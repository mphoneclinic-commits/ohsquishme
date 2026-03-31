import { NextResponse } from 'next/server'
import { isAdminFromRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

function getFileExtension(file: File) {
  const byName = file.name.split('.').pop()?.toLowerCase()

  if (byName) return byName
  if (file.type === 'image/jpeg') return 'jpg'
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'image/gif') return 'gif'

  return 'bin'
}

export async function POST(req: Request) {
  try {
    const adminUser = await isAdminFromRequest()

    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const fileEntry = formData.get('file')

    if (!fileEntry || !(fileEntry instanceof File)) {
      return NextResponse.json(
        { error: 'Image file is required' },
        { status: 400 }
      )
    }

    const file = fileEntry

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Only JPG, PNG, WEBP, and GIF images are allowed' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'Image must be 5MB or smaller' },
        { status: 400 }
      )
    }

    const bucketName =
      process.env.SUPABASE_PRODUCT_IMAGES_BUCKET || 'product-images'

    const ext = getFileExtension(file)

    const safeBaseName =
      file.name
        .replace(/\.[^/.]+$/, '')
        .toLowerCase()
        .replace(/[^a-z0-9-_]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 50) || 'product-image'

    const filePath = `admin-${adminUser.id}/${Date.now()}-${safeBaseName}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      )
    }

    const { data } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    if (!data?.publicUrl) {
      return NextResponse.json(
        { error: 'Failed to get public URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      url: data.publicUrl,
    })
  } catch (error) {
    console.error('Upload route error:', error)

    return NextResponse.json(
      { error: 'Unexpected server error' },
      { status: 500 }
    )
  }
}