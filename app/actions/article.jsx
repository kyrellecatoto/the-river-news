// actions/article.jsx
'use server'  // This must be at the top - no 'use client'

import { createAdminClient } from '../lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createArticle(articleData) {
  try {
    console.log('Creating article with data:', articleData)
    
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

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }
    
    // Revalidate paths
    revalidatePath('/admin/dashboard/articles')
    revalidatePath('/')
    
    return { success: true, data }
  } catch (error) {
    console.error('Error creating article:', error)
    return { 
      success: false, 
      error: error.message || 'Failed to create article'
    }
  }
}

export async function updateArticle(id, articleData) {
  try {
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('news_articles')
      .update({
        ...articleData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    
    revalidatePath('/admin/dashboard/articles')
    revalidatePath('/')
    
    return { success: true, data }
  } catch (error) {
    console.error('Error updating article:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteArticle(id) {
  try {
    const supabase = createAdminClient()
    
    const { error } = await supabase
      .from('news_articles')
      .delete()
      .eq('id', id)

    if (error) throw error
    
    revalidatePath('/admin/dashboard/articles')
    revalidatePath('/')
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting article:', error)
    return { success: false, error: error.message }
  }
}