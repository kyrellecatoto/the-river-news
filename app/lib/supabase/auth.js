import { createClient } from './client'
import { createAdminClient } from './admin'

// Client-side authentication functions
export async function signIn(email, password) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export async function signUp(email, password, userData = {}) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/dashboard`,
    },
  })

  if (error) throw error
  return data
}

export async function signOut() {
  const supabase = createClient()
  
  const { error } = await supabase.auth.signOut()
  if (error) throw error
  return true
}

export async function getCurrentUser() {
  const supabase = createClient()
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    
    if (!session) return null
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    
    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

// Server-side authentication check
export async function getServerSession() {
  const supabase = createAdminClient()
  
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Error getting server session:', error)
    return null
  }
  
  return session
}

export async function getServerUser() {
  const supabase = createAdminClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('Error getting server user:', error)
    return null
  }
}

// Check if user is admin (server-side)
export async function isUserAdmin(userId) {
  const supabase = createAdminClient()
  
  try {
    const { data, error } = await supabase
      .from('admin_profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) return false
    return data?.role === 'admin'
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }

  
}

// Add this function to your existing auth.js file:

export async function resetPassword(email) {
  const supabase = createClient()
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/update-password`,
  })

  if (error) throw error
  return { success: true }
}