import { createClient } from './client'

// Get Supabase storage URL for a file
export function getStorageUrl(filePath) {
  if (!filePath) return null
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  return `${supabaseUrl}/storage/v1/object/public/article-images/${filePath}`
}

// Upload image to Supabase Storage
export async function uploadImage(file, fileName = null) {
  try {
    const supabase = createClient()
    
    // Generate unique filename if not provided
    const fileExt = file.name.split('.').pop()
    const fileNameWithExt = fileName 
      ? `${fileName}.${fileExt}`
      : `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    
    // Clean filename
    const cleanFileName = fileNameWithExt
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    
    const filePath = cleanFileName
    
    // Upload file
    const { data, error } = await supabase.storage
      .from('article-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      console.error('Error uploading image:', error)
      throw error
    }
    
    return {
      success: true,
      path: filePath,
      url: getStorageUrl(filePath),
      fullPath: data?.path
    }
  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Delete image from Supabase Storage
export async function deleteImage(filePath) {
  try {
    const supabase = createClient()
    
    const { error } = await supabase.storage
      .from('article-images')
      .remove([filePath])
    
    if (error) {
      console.error('Error deleting image:', error)
      throw error
    }
    
    return { success: true }
  } catch (error) {
    console.error('Delete error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// List images in storage (for admin)
export async function listImages(limit = 100, offset = 0) {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase.storage
      .from('article-images')
      .list('', {
        limit,
        offset,
        sortBy: { column: 'created_at', order: 'desc' }
      })
    
    if (error) {
      console.error('Error listing images:', error)
      throw error
    }
    
    return {
      success: true,
      images: data.map(item => ({
        name: item.name,
        url: getStorageUrl(item.name),
        size: item.metadata?.size,
        created_at: item.created_at,
        updated_at: item.updated_at
      }))
    }
  } catch (error) {
    console.error('List error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Get image metadata
export async function getImageInfo(filePath) {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase.storage
      .from('article-images')
      .getPublicUrl(filePath)
    
    if (error) {
      console.error('Error getting image info:', error)
      throw error
    }
    
    return {
      success: true,
      url: data.publicUrl
    }
  } catch (error) {
    console.error('Get info error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Upload and optimize image (client-side optimization)
export async function uploadAndOptimizeImage(file, options = {}) {
  const {
    maxWidth = 1200,
    maxHeight = 630,
    quality = 0.8,
    fileName = null
  } = options
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        const img = new Image()
        
        img.onload = async () => {
          try {
            // Calculate new dimensions
            let width = img.width
            let height = img.height
            
            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height)
              width = Math.floor(width * ratio)
              height = Math.floor(height * ratio)
            }
            
            // Create canvas for resizing
            const canvas = document.createElement('canvas')
            canvas.width = width
            canvas.height = height
            
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0, width, height)
            
            // Convert to blob with quality settings
            canvas.toBlob(async (blob) => {
              try {
                // Create new file from blob
                const optimizedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                })
                
                // Upload optimized image
                const result = await uploadImage(optimizedFile, fileName)
                resolve(result)
              } catch (error) {
                reject(error)
              }
            }, 'image/jpeg', quality)
          } catch (error) {
            reject(error)
          }
        }
        
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = e.target.result
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}