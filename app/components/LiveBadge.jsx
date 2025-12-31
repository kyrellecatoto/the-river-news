'use client'

import { useState, useEffect } from 'react'
import { createClient } from '..//lib/supabase/client'

export default function LiveBadge() {
  const [breakingNews, setBreakingNews] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    fetchBreakingNews()
    
    // Refresh breaking news every 5 minutes
    const interval = setInterval(fetchBreakingNews, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  async function fetchBreakingNews() {
    try {
      setLoading(true)
      const supabase = createClient()
      
      const now = new Date()
      const tenHoursAgo = new Date(now.getTime() - (10 * 60 * 60 * 1000)) // 10 hours ago
      
      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .eq('is_breaking', true)
        .gte('published_at', tenHoursAgo.toISOString()) // Only articles from last 10 hours
        .order('published_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching breaking news:', error)
        return
      }

      if (data) {
        setBreakingNews(data)
        setIsVisible(true)
        
        // Auto-hide after 10 hours from publish time
        const publishTime = new Date(data.published_at)
        const expiryTime = new Date(publishTime.getTime() + (10 * 60 * 60 * 1000))
        
        if (now < expiryTime) {
          const timeUntilExpiry = expiryTime.getTime() - now.getTime()
          setTimeout(() => {
            setIsVisible(false)
            setBreakingNews(null)
          }, timeUntilExpiry)
        }
      } else {
        setBreakingNews(null)
        setIsVisible(false)
      }
    } catch (error) {
      console.error('Error fetching breaking news:', error)
    } finally {
      setLoading(false)
    }
  }

  // Don't render anything if no breaking news or loading
  if (!isVisible || loading || !breakingNews) {
    return null
  }

  return (
    <div className="bg-[#111111] py-3 px-6 border-b border-[#222222] animate-fadeIn">
      <div className="max-w-[1400px] mx-auto flex items-center gap-4">
        <span className="badge-pulse flex items-center gap-2 bg-[#dc2626] text-white py-1.5 px-4 rounded-full text-xs font-bold animate-pulse">
          <span className="w-2 h-2 bg-white rounded-full inline-block animate-ping"></span>
          BREAKING NEWS
        </span>
        <p className="text-white text-sm m-0 font-medium truncate flex-1">
          {breakingNews.title}
        </p>
        {breakingNews.is_video && breakingNews.video_url && (
          <a 
            href={breakingNews.video_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[#667eea] no-underline text-xs font-semibold hover:text-[#5a67d8] transition-colors whitespace-nowrap"
          >
            Watch Now →
          </a>
        )}
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}