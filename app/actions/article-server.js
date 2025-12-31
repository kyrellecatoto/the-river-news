'use server'

import { createAdminClient } from '../../lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createArticleServer(articleData) {
  try {
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('news_articles')
      .insert([{
        ...articleData,
        slug: articleData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error
    
    revalidatePath('/admin/dashboard/articles')
    revalidatePath('/')
    
    return { success: true, data }
  } catch (error) {
    console.error('Error creating article:', error)
    return { success: false, error: error.message }
  }
}