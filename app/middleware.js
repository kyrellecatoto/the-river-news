import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  const res = NextResponse.next()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Allow access to login page
    if (request.nextUrl.pathname === '/admin' || 
        request.nextUrl.pathname === '/admin/login' ||
        request.nextUrl.pathname === '/admin/signup' ||
        request.nextUrl.pathname === '/admin/reset-password') {
      return res
    }

    // Redirect to login if no session
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Check if user is admin
    if (session) {
      const { data: profile } = await supabase
        .from('admin_profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (profile?.role !== 'admin') {
        return NextResponse.redirect(new URL('/admin/unauthorized', request.url))
      }
    }
  }

  return res
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
}