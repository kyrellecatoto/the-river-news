import { createClient } from './client'

export async function getAllCategories() {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('news_categories')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error('Error in getAllCategories:', error)
    throw error // Re-throw to handle in component
  }
}