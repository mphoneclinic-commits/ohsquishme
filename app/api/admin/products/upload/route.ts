import { NextResponse } from 'next/server'
import { isAdminFromRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: Request) {
  try {
    const adminUser = await isAdminFromRequest()

    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    }

    const fileExt = file.name.split('.').pop() || 'jpg'
    const filePath = `products/${crypto.randomUUID()}.${fileExt}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabaseAdmin.storage
      .from('product-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data } = supabaseAdmin.storage
      .from('product-images')
      .getPublicUrl(filePath)

    return NextResponse.json({ url: data.publicUrl })
  } catch (error) {
    console.error('Upload product image error:', error)
    return NextResponse.json(
      { error: 'Unexpected server error' },
      { status: 500 }
    )
  }
}