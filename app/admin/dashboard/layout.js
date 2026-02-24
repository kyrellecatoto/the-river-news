'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, signOut } from '../../lib/supabase/auth'
import { 
  Home, 
  FileText, 
  Folder, 
  Settings, 
  Users,
  BarChart,
  LogOut,
  Menu,
  X,
  User,
  Medal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

export default function DashboardLayout({ children }) {
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false) // For mobile slide-in
  const [isCollapsed, setIsCollapsed] = useState(false) // For desktop shrink/maximize
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    checkUser()
  }, [])

  // Close sidebar automatically when screen resizes to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/admin/login')
        return
      }
      setUser(currentUser)
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const navItems = [
    { href: '/admin/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/admin/dashboard/articles', icon: FileText, label: 'Articles' },
    { href: '/admin/dashboard/categories', icon: Folder, label: 'Categories' },
    { href: '/admin/dashboard/analytics', icon: BarChart, label: 'Analytics' },
    { href: '/admin/dashboard/settings', icon: Settings, label: 'Settings' },
    { href: '/admin/dashboard/applications', icon: Users, label: 'Applications' },
    { href: '/admin/dashboard/palaro-tally', icon: Medal, label: 'Palaro Tally' },
  ]

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 bg-gray-800 shadow-2xl flex-shrink-0 flex flex-col h-full
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0
          ${isCollapsed ? 'lg:w-20 w-64' : 'w-64'}
        `}
      >
        {/* Sidebar Header */}
        <div className={`p-5 border-b border-gray-700 flex items-center shrink-0 h-[73px] ${isCollapsed ? 'lg:justify-center justify-between' : 'justify-between'}`}>
          {/* Logo Text - Hides when collapsed on desktop */}
          <h1 className={`text-xl font-black tracking-wider text-white transition-opacity duration-300 ${isCollapsed ? 'lg:hidden block' : 'block'}`}>
            THE RIVER
          </h1>
          
          {/* Mobile Close Button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>

          {/* Desktop Shrink/Expand Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
            aria-label="Toggle sidebar size"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div className={`p-4 pb-2 shrink-0 flex ${isCollapsed ? 'lg:justify-center' : ''}`}>
            <div className={`flex items-center bg-gray-900/50 rounded-xl border border-gray-700/50 ${isCollapsed ? 'lg:p-2 lg:bg-transparent lg:border-transparent p-3 space-x-3 w-full' : 'p-3 space-x-3 w-full'}`}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shrink-0 shadow-lg">
                <User size={18} className="text-white" />
              </div>
              
              {/* Hide text when collapsed on desktop */}
              <div className={`truncate transition-all duration-300 ${isCollapsed ? 'lg:hidden block' : 'block'}`}>
                <p className="font-semibold text-sm text-white truncate">
                  {user.user_metadata?.full_name || 'Admin'}
                </p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto mt-2 px-3">
          <ul className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={isCollapsed ? item.label : ''} // Shows tooltip when collapsed
                    className={`
                      flex items-center rounded-xl transition-all duration-200
                      ${isCollapsed ? 'lg:justify-center lg:px-0 px-4 py-3 space-x-3' : 'px-4 py-3 space-x-3'}
                      ${isActive 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
                        : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                      }
                    `}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon size={20} className={`shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                    <span className={`font-medium text-sm truncate transition-all duration-300 ${isCollapsed ? 'lg:hidden block' : 'block'}`}>
                      {item.label}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-700 shrink-0">
          <button
            onClick={handleLogout}
            title={isCollapsed ? "Logout" : ""}
            className={`
              flex items-center w-full text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-colors font-medium text-sm
              ${isCollapsed ? 'lg:justify-center lg:p-3 p-3 space-x-3 px-4' : 'px-4 py-3 space-x-3'}
            `}
          >
            <LogOut size={20} className="shrink-0" />
            <span className={`transition-all duration-300 ${isCollapsed ? 'lg:hidden block' : 'block'}`}>
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Mobile Top Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 shrink-0 shadow-sm z-30 h-[73px]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-black tracking-wider text-white">THE RIVER</h1>
          </div>
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shrink-0 shadow-md">
            <User size={14} className="text-white" />
          </div>
        </header>

        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-gray-900 transition-all duration-300">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

    </div>
  )
}