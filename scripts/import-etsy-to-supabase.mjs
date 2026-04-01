import nextEnv from '@next/env'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const { loadEnvConfig } = nextEnv

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectDir = path.join(__dirname, '..')

loadEnvConfig(projectDir)

const CSV_PATH = path.join(projectDir, 'EtsyListingsDownload.csv')
const DOWNLOAD_IMAGES = false

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('SUPABASE URL exists:', !!SUPABASE_URL)
console.log('SERVICE ROLE exists:', !!SUPABASE_SERVICE_ROLE_KEY)

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Missing env vars. Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
  )
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

function parseCsvLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  result.push(current)
  return result
}

function parseCsv(content) {
  const lines = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < content.length; i++) {
    const char = content[i]
    const next = content[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
        current += char
      }
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (current.trim() !== '') {
        lines.push(current.replace(/\r$/, ''))
      }
      current = ''

      if (char === '\r' && next === '\n') {
        i++
      }
    } else {
      current += char
    }
  }

  if (current.trim() !== '') {
    lines.push(current)
  }

  if (lines.length === 0) return []

  const headers = parseCsvLine(lines[0]).map((h) => h.trim())
  const rows = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    const row = {}

    headers.forEach((header, idx) => {
      row[header] = (values[idx] ?? '').trim()
    })

    rows.push(row)
  }

  return rows
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback
  const cleaned = String(value).replace(/[^0-9.-]/g, '')
  const num = Number(cleaned)
  return Number.isFinite(num) ? num : fallback
}

function parseList(value) {
  if (!value) return []
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function collectImageUrls(row) {
  const urls = []

  for (let i = 1; i <= 10; i++) {
    const key = `IMAGE${i}`
    const url = row[key]?.trim()
    if (url) urls.push(url)
  }

  return urls
}

async function downloadImage(url, outputPath) {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to download image: ${url} (${res.status})`)
  }

  const arrayBuffer = await res.arrayBuffer()
  fs.writeFileSync(outputPath, Buffer.from(arrayBuffer))
}

async function uploadImageToSupabase(imageUrl, productSlug, index) {
  const res = await fetch(imageUrl)
  if (!res.ok) {
    throw new Error(`Failed to fetch image for upload: ${imageUrl}`)
  }

  const contentType = res.headers.get('content-type') || 'image/jpeg'
  const ext =
    contentType.includes('png')
      ? 'png'
      : contentType.includes('webp')
      ? 'webp'
      : 'jpg'

  const arrayBuffer = await res.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const filePath = `etsy-import/${productSlug}-${index + 1}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(filePath, buffer, {
      contentType,
      upsert: true,
    })

  if (uploadError) {
    throw uploadError
  }

  const { data } = supabase.storage.from('product-images').getPublicUrl(filePath)
  return data.publicUrl
}

async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`CSV not found at ${CSV_PATH}`)
  }

  const raw = fs.readFileSync(CSV_PATH, 'utf8')
  const rows = parseCsv(raw)

  console.log(`Found ${rows.length} Etsy rows`)

  const imagesDir = path.join(__dirname, '..', 'etsy-images')
  if (DOWNLOAD_IMAGES && !fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true })
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]

    const name = row.TITLE?.trim() || `Untitled Product ${i + 1}`
    const description = row.DESCRIPTION?.trim() || ''
    const priceRetail = toNumber(row.PRICE, 0)
    const stock = Math.max(0, parseInt(row.QUANTITY || '0', 10) || 0)
    const sku = row.SKU?.trim() || null
    const tags = parseList(row.TAGS)
    const materials = parseList(row.MATERIALS)
    const imageUrls = collectImageUrls(row)
    const productSlug = slugify(name) || `product-${i + 1}`

    let uploadedImageUrls = []

    for (let imgIndex = 0; imgIndex < imageUrls.length; imgIndex++) {
      const originalUrl = imageUrls[imgIndex]

      try {
        if (DOWNLOAD_IMAGES) {
          const ext = path.extname(new URL(originalUrl).pathname) || '.jpg'
          const localPath = path.join(
            imagesDir,
            `${productSlug}-${imgIndex + 1}${ext}`
          )
          await downloadImage(originalUrl, localPath)
        }

        const publicUrl = await uploadImageToSupabase(
          originalUrl,
          productSlug,
          imgIndex
        )
        uploadedImageUrls.push(publicUrl)
      } catch (err) {
        console.error(`Image failed for "${name}" (${originalUrl})`, err.message)
      }
    }

    const mainImageUrl = uploadedImageUrls[0] || imageUrls[0] || null

    const productPayload = {
      name,
      description,
      price_retail: priceRetail,
      price_wholesale: null,
      stock,
      image_url: mainImageUrl,
      active: true,
      sku,
      tags,
      materials,
    }

    const { data: insertedProduct, error: productError } = await supabase
      .from('products')
      .insert(productPayload)
      .select('id, name')
      .single()

    if (productError) {
      console.error(`Product insert failed for "${name}"`, productError)
      continue
    }

    if (uploadedImageUrls.length > 0) {
      const imageRows = uploadedImageUrls.map((url, sortOrder) => ({
        product_id: insertedProduct.id,
        image_url: url,
        sort_order: sortOrder,
      }))

      const { error: imagesError } = await supabase
        .from('product_images')
        .insert(imageRows)

      if (imagesError) {
        console.error(`Image rows insert failed for "${name}"`, imagesError)
      }
    }

    console.log(`Imported: ${insertedProduct.name}`)
  }

  console.log('Done')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})