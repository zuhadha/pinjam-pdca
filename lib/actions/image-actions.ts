'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/actions'
import { revalidatePath } from 'next/cache'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_IMAGES_PER_ITEM = 5
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']

export interface UploadImageInput {
  itemId: string
  file: File
}

export async function uploadItemImage(input: UploadImageInput) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    return { error: 'Unauthorized - Admin access required' }
  }

  try {
    // Validate file type
    if (!ALLOWED_TYPES.includes(input.file.type)) {
      return { error: 'Tipe file tidak didukung. Gunakan JPG, PNG, atau WebP' }
    }

    // Validate file size
    if (input.file.size > MAX_FILE_SIZE) {
      return { error: `Ukuran file terlalu besar. Maximum 5MB (file Anda: ${(input.file.size / 1024 / 1024).toFixed(2)}MB)` }
    }

    // Check current image count
    const { count } = await supabase
      .from('item_images')
      .select('*', { count: 'exact', head: true })
      .eq('item_id', input.itemId)

    if (count && count >= MAX_IMAGES_PER_ITEM) {
      return { error: `Maximum ${MAX_IMAGES_PER_ITEM} gambar per barang` }
    }

    // Generate unique filename
    const fileExt = input.file.name.split('.').pop()
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    const fileName = `${input.itemId}/${timestamp}-${random}.${fileExt}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('item-images')
      .upload(fileName, input.file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { error: `Upload gagal: ${uploadError.message}` }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('item-images')
      .getPublicUrl(fileName)

    // Get next display order
    const { data: existingImages } = await supabase
      .from('item_images')
      .select('display_order')
      .eq('item_id', input.itemId)
      .order('display_order', { ascending: false })
      .limit(1)

    const nextOrder = existingImages && existingImages.length > 0
      ? existingImages[0].display_order + 1
      : 0

    // Save metadata to database
    const { data: imageData, error: dbError } = await supabase
      .from('item_images')
      .insert({
        item_id: input.itemId,
        image_path: fileName,
        image_url: publicUrl,
        file_name: input.file.name,
        file_size: input.file.size,
        uploaded_by: user.id,
        display_order: nextOrder
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Rollback: delete from storage
      await supabase.storage.from('item-images').remove([fileName])
      return { error: 'Gagal menyimpan metadata gambar' }
    }

    // Only revalidate catalog, not admin pages to avoid redirect during edit
    revalidatePath('/catalog')

    return {
      success: true,
      image: imageData,
      message: 'Gambar berhasil diupload'
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'Terjadi kesalahan yang tidak terduga' }
  }
}

export async function deleteItemImage(imageId: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    return { error: 'Unauthorized - Admin access required' }
  }

  try {
    // Get image data
    const { data: image, error: fetchError } = await supabase
      .from('item_images')
      .select('image_path, item_id')
      .eq('id', imageId)
      .single()

    if (fetchError || !image) {
      return { error: 'Gambar tidak ditemukan' }
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('item-images')
      .remove([image.image_path])

    if (storageError) {
      console.error('Storage delete error:', storageError)
      // Continue anyway to delete from database
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('item_images')
      .delete()
      .eq('id', imageId)

    if (dbError) {
      return { error: 'Gagal menghapus gambar dari database' }
    }

    // Reorder remaining images
    const { data: remainingImages } = await supabase
      .from('item_images')
      .select('id')
      .eq('item_id', image.item_id)
      .order('display_order', { ascending: true })

    if (remainingImages) {
      for (let i = 0; i < remainingImages.length; i++) {
        await supabase
          .from('item_images')
          .update({ display_order: i })
          .eq('id', remainingImages[i].id)
      }
    }

    revalidatePath('/catalog')

    return {
      success: true,
      message: 'Gambar berhasil dihapus'
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'Terjadi kesalahan yang tidak terduga' }
  }
}

export async function reorderItemImages(itemId: string, imageIds: string[]) {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user || user.role !== 'admin') {
    return { error: 'Unauthorized - Admin access required' }
  }

  try {
    // Update display_order for each image
    for (let i = 0; i < imageIds.length; i++) {
      await supabase
        .from('item_images')
        .update({ display_order: i })
        .eq('id', imageIds[i])
        .eq('item_id', itemId) // Security: ensure image belongs to this item
    }

    revalidatePath('/catalog')

    return {
      success: true,
      message: 'Urutan gambar berhasil diupdate'
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'Gagal mengupdate urutan gambar' }
  }
}

export async function getItemImages(itemId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('item_images')
    .select('*')
    .eq('item_id', itemId)
    .order('display_order', { ascending: true })

  if (error) {
    console.error('Error fetching images:', error)
    return []
  }

  return data || []
}
