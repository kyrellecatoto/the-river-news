'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from './components/Navbar'
import LiveBadge from './components/LiveBadge'
import HeroSection from './components/HeroSection'
import TrendingSidebar from './components/TrendingSidebar'
import LatestStories from './components/LatestStories'
import NewsletterSection from './components/NewsletterSection'
import Footer from './components/Footer'
import { toast, Toaster } from 'react-hot-toast'
import { createClient } from './lib/supabase/client'

export default function Home() {
  const router = useRouter()

  const [heroArticle, setHeroArticle] = useState(null)
  const [trendingArticles, setTrendingArticles] = useState([])
  const [latestArticles, setLatestArticles] = useState([])
  const [breakingNews, setBreakingNews] = useState([])
  const [siteSettings, setSiteSettings] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const handleArticleClick = (article) => {
    if (article?.slug) {
      router.push(`/article/${article.slug}`)
    }
  }

  async function fetchData() {
    try {
      setLoading(true)
      const supabase = createClient()

      const [
        heroData,
        trendingData,
        latestData,
        breakingData,
        settingsData
      ] = await Promise.all([
        fetchHeroArticle(supabase),
        fetchTrendingArticles(supabase),
        fetchLatestArticles(supabase),
        fetchBreakingNews(supabase),
        fetchSiteSettings(supabase)
      ])

      setHeroArticle(heroData)
      setTrendingArticles(trendingData)
      setLatestArticles(latestData)
      setBreakingNews(breakingData)
      setSiteSettings(settingsData)
    } catch (error) {
      console.error(error)
      toast.error('Failed to load news data')
    } finally {
      setLoading(false)
    }
  }

  async function fetchHeroArticle(supabase) {
    const { data } = await supabase
      .from('news_articles')
      .select(`*, category:news_categories(*)`)
      .eq('is_featured', true)
      .order('published_at', { ascending: false })
      .limit(1)
      .single()

    return data ?? null
  }

  async function fetchTrendingArticles(supabase) {
    const { data } = await supabase
      .from('news_articles')
      .select(`*, category:news_categories(*)`)
      .eq('is_featured', true)
      .order('published_at', { ascending: false })
      .limit(5)

    return (data ?? []).map((article, index) => ({
      ...article,
      position: index + 1
    }))
  }

  async function fetchLatestArticles(supabase) {
    const { data } = await supabase
      .from('news_articles')
      .select(`*, category:news_categories(*)`)
      .order('published_at', { ascending: false })
      .limit(6)

    return data ?? []
  }

  async function fetchBreakingNews(supabase) {
    const { data } = await supabase
      .from('news_articles')
      .select(`*, category:news_categories(*)`)
      .eq('is_breaking', true)
      .order('published_at', { ascending: false })
      .limit(3)

    return data ?? []
  }

  async function fetchSiteSettings(supabase) {
    const { data } = await supabase.from('site_settings').select('*')

    const settings = {}
    data?.forEach((s) => {
      settings[s.key] = s.value
    })

    return settings
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#667eea]" />
      </div>
    )
  }

  return (
    <div className="w-full bg-[#0a0a0a] font-sans">
      <Toaster position="top-right" />

      <Navbar siteSettings={siteSettings} />
      <LiveBadge breakingNews={breakingNews} />

      {/* HERO + TRENDING */}
      <section className="bg-[#0a0a0a] py-10 px-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* LEFT: HERO */}
            <div className="lg:col-span-2">
              <HeroSection
                heroArticle={heroArticle}
                siteSettings={siteSettings}
                onArticleClick={handleArticleClick}
              />
            </div>

            {/* RIGHT: TRENDING */}
            <div className="lg:col-span-1">
              <TrendingSidebar
                trendingArticles={trendingArticles}
                onArticleClick={handleArticleClick}
              />
            </div>

          </div>
        </div>
      </section>
      {/* LATEST STORIES */}
      <section className="bg-[#0a0a0a] py-10 px-6">
        <div className="max-w-[1400px] mx-auto">
          <LatestStories
            articles={latestArticles}
            onArticleClick={handleArticleClick}
          />
        </div>
      </section>

      <NewsletterSection />
      <Footer siteSettings={siteSettings} />
    </div>
  )
}
