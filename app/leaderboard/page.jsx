'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { MessageCircle, Image as ImageIcon } from 'lucide-react'
import { createClient } from '../lib/supabase/client'
import { getStorageUrl } from '../lib/supabase/storage'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const TABS = [
  { id: 'overall', label: 'Overall Tally' },
  { id: 'regular', label: 'Regular Sports' },
  { id: 'demo', label: 'Demo Sports' },
  { id: 'para', label: 'Para Games' },
  { id: 'secondary', label: 'High School' },
  { id: 'elementary', label: 'Elementary' }
]

export default function PalaroHubPage() {
  const [rankings, setRankings] = useState([])
  const [articles, setArticles] = useState([])
  const [otherNews, setOtherNews] = useState([])
  const [siteSettings, setSiteSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overall')

  useEffect(() => {
    async function loadAllData() {
      setLoading(true)
      await Promise.all([
        fetchRankings(),
        fetchPalaroNews(),
        fetchSiteSettings()
      ])
      setLoading(false)
    }
    loadAllData()
  }, [])

  async function fetchRankings() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('palaro_medal_ranking')
        .select('*')

      if (!error) setRankings(data || [])
    } catch (error) {
      console.error('Error fetching rankings:', error)
    }
  }

  async function fetchPalaroNews() {
    try {
      const supabase = createClient()
      const { data: categoryData, error: catError } = await supabase
        .from('news_categories')
        .select('id, name, color')
        .ilike('name', '%Palarong Pambansa%') 
        .single()

      if (catError || !categoryData) {
        fetchFallbackNews(supabase)
        return
      }

      const { data: articlesData, error: artError } = await supabase
        .from('news_articles')
        .select(`*, category:news_categories(*)`)
        .eq('category_id', categoryData.id)
        .order('published_at', { ascending: false })

      if (!artError) setArticles(articlesData || [])

      const { data: otherData, error: otherError } = await supabase
        .from('news_articles')
        .select(`*, category:news_categories(*)`)
        .neq('category_id', categoryData.id)
        .order('published_at', { ascending: false })
        .limit(4)

      if (!otherError) setOtherNews(otherData || [])

    } catch (error) {
      console.error('Error fetching news:', error)
    }
  }

  async function fetchFallbackNews(supabase) {
    const { data } = await supabase
      .from('news_articles')
      .select(`*, category:news_categories(*)`)
      .order('published_at', { ascending: false })
      .limit(4)
    setOtherNews(data || [])
  }

  async function fetchSiteSettings() {
    const supabase = createClient()
    const { data } = await supabase.from('site_settings').select('*')
    const settings = {}
    data?.forEach((s) => { settings[s.key] = s.value })
    setSiteSettings(settings)
  }

  // --- DYNAMIC RANKING LOGIC ---
  // This recalculates the ranks and sorts the table instantly based on the active tab
  const processedRankings = useMemo(() => {
    if (!rankings.length) return []

    // 1. Map the correct medal values based on the active tab
    const mapped = rankings.map(row => {
      let g = 0, s = 0, b = 0
      switch(activeTab) {
        case 'regular': g = row.reg_gold; s = row.reg_silver; b = row.reg_bronze; break;
        case 'demo': g = row.demo_gold; s = row.demo_silver; b = row.demo_bronze; break;
        case 'para': g = row.para_gold; s = row.para_silver; b = row.para_bronze; break;
        case 'secondary': g = row.sec_gold; s = row.sec_silver; b = row.sec_bronze; break;
        case 'elementary': g = row.elem_gold; s = row.elem_silver; b = row.elem_bronze; break;
        default: g = row.total_gold; s = row.total_silver; b = row.total_bronze; break; // overall
      }
      return { ...row, g, s, b, total_current: g + s + b }
    })

    // 2. Sort by Gold, then Silver, then Bronze
    mapped.sort((a, b) => {
      if (b.g !== a.g) return b.g - a.g
      if (b.s !== a.s) return b.s - a.s
      if (b.b !== a.b) return b.b - a.b
      return a.region_name.localeCompare(b.region_name)
    })

    // 3. Assign Dense Rank (Ties get the same rank, next gets the immediate next number)
    let currentRank = 1
    mapped.forEach((row, index) => {
      if (index > 0) {
        const prev = mapped[index - 1]
        if (prev.g !== row.g || prev.s !== row.s || prev.b !== row.b) {
          currentRank++
        }
      }
      row.displayRank = currentRank
    })

    return mapped
  }, [rankings, activeTab])


  // --- RENDERING HELPERS ---
  const getImageUrl = (path) => getStorageUrl(path) || path

  const getRankBadge = (rank) => {
    switch (rank) {
      case 1: return <span className="text-2xl" title="1st Place">🥇</span>
      case 2: return <span className="text-2xl" title="2nd Place">🥈</span>
      case 3: return <span className="text-2xl" title="3rd Place">🥉</span>
      default: return <span className="text-gray-400 font-bold">{rank}</span>
    }
  }

  const featuredArticle = articles.length > 0 ? articles[0] : null
  const headlinesArticles = articles.length > 1 ? articles.slice(1) : []

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
        <Navbar />
        <div className="flex-grow flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#667eea]"></div>
        </div>
        <Footer siteSettings={siteSettings} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow max-w-[1400px] mx-auto w-full p-4 md:p-8 space-y-16">
        
        {/* --- PAGE HEADER --- */}
        <div className="border-b border-[#222222] pb-6 mt-4 md:mt-8">
           <div className="flex items-center gap-3 mb-2">
             <div className="h-8 w-2 bg-[#667eea]"></div>
             <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight">
               Palarong Pambansa 2026
             </h1>
           </div>
           <p className="text-xl text-gray-400 font-medium ml-5 mt-2">
             Official Medal Tally & Latest Coverage
           </p>
        </div>

        {/* --- SECTION 1: LEADERBOARD WITH TABS --- */}
        <section>
          <div className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden shadow-2xl">
            
            {/* Tabs Navigation (Horizontally Scrollable on Mobile) */}
            <div className="flex items-center overflow-x-auto border-b border-[#222222] hide-scrollbar bg-[#161616]">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    whitespace-nowrap px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2
                    ${activeTab === tab.id 
                      ? 'text-[#667eea] border-[#667eea] bg-[#667eea]/5' 
                      : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="bg-[#161616] border-b border-[#222222]">
                  <tr>
                    <th className="p-4 text-center text-gray-400 font-semibold w-24">Rank</th>
                    <th className="p-4 text-gray-400 font-semibold">Region</th>
                    <th className="p-4 text-center text-yellow-400 font-bold w-28">Gold</th>
                    <th className="p-4 text-center text-gray-300 font-bold w-28">Silver</th>
                    <th className="p-4 text-center text-orange-400 font-bold w-28">Bronze</th>
                    <th className="p-4 text-center text-white font-bold w-32 bg-white/5">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222]">
                  {processedRankings.map((row) => (
                    <tr key={row.region_code} className="hover:bg-[#1a1a1a] transition-colors group">
                      <td className="p-4 text-center align-middle">{getRankBadge(row.displayRank)}</td>
                      <td className="p-4">
                        <div className="text-lg font-bold text-white group-hover:text-[#667eea] transition-colors">
                          {row.region_name}
                        </div>
                        <div className="text-sm text-gray-500 font-medium">{row.region_code}</div>
                      </td>
                      {/* Using the dynamically mapped g, s, b values */}
                      <td className="p-4 text-center text-xl font-bold text-white">{row.g}</td>
                      <td className="p-4 text-center text-xl font-bold text-gray-300">{row.s}</td>
                      <td className="p-4 text-center text-xl font-bold text-orange-300">{row.b}</td>
                      <td className="p-4 text-center text-2xl font-black text-white bg-white/5">{row.total_current}</td>
                    </tr>
                  ))}

                  {processedRankings.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-500">
                        No medals have been recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* --- SECTION 2: PALARO NEWS --- */}
        <section className="flex flex-col gap-12 pt-8 border-t border-[#222222]">
          <h2 className="text-2xl font-black uppercase tracking-wider text-white flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
            Palaro News Coverage
          </h2>

          {articles.length === 0 ? (
             <div className="text-center py-10 text-gray-500 bg-[#111] rounded-xl border border-[#222]">
               <p className="text-lg">Coverage for this event hasn't started yet.</p>
             </div>
          ) : (
            <div className="flex flex-col gap-16">
              {/* Featured Banner */}
              {featuredArticle && (
                <Link 
                  href={`/article/${featuredArticle.slug}`}
                  className="group relative w-full bg-[#111111] hover:bg-[#161616] transition-colors grid grid-cols-1 lg:grid-cols-12 overflow-hidden border border-[#222] rounded-xl"
                >
                  <div className="lg:col-span-8 h-64 md:h-[400px] relative overflow-hidden">
                    {getImageUrl(featuredArticle.cover_image_url) ? (
                      <img
                        src={getImageUrl(featuredArticle.cover_image_url)}
                        alt={featuredArticle.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center">
                          <ImageIcon className="text-gray-400" size={48} />
                        </div>
                    )}
                    {featuredArticle.category && (
                      <div className="absolute top-4 left-4 z-20">
                        <span 
                          className="text-white py-1.5 px-4 text-xs font-bold uppercase tracking-wider shadow-sm backdrop-blur-md"
                          style={{ backgroundColor: featuredArticle.category.color || '#667eea' }}
                        >
                          {featuredArticle.category.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-4 p-6 md:p-10 flex flex-col justify-center">
                      <div className="mb-4 text-[#667eea] font-bold tracking-wider text-xs uppercase flex items-center gap-2">
                         <span className="w-2 h-2 rounded-full bg-[#667eea] animate-pulse"></span>
                         Top Story
                      </div>
                      <h2 className="text-2xl md:text-4xl font-black leading-tight mb-4 text-white group-hover:text-[#667eea] transition-colors">
                        {featuredArticle.title}
                      </h2>
                      <p className="text-[#999] leading-relaxed mb-6 font-serif line-clamp-3">
                        {featuredArticle.subtitle}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-[#666] uppercase font-medium mt-auto">
                        <span>
                           {new Date(featuredArticle.published_at).toLocaleDateString('en-US', {
                             month: 'long', day: 'numeric', year: 'numeric'
                           })}
                        </span>
                        <div className="flex items-center gap-1">
                           <MessageCircle size={14} />
                           <span>{featuredArticle.comments_count || 0} Comments</span>
                        </div>
                      </div>
                  </div>
                </Link>
              )}

              {/* Headlines */}
              {headlinesArticles.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-wider border-l-4 border-[#667eea] pl-3 mb-6 text-white">
                    More from Palaro
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                    {headlinesArticles.map((article) => (
                      <Link key={article.id} href={`/article/${article.slug}`} className="group flex flex-col cursor-pointer">
                        <div className="relative h-48 w-full overflow-hidden mb-4 bg-[#111] rounded-lg border border-[#222]">
                          {getImageUrl(article.cover_image_url) ? (
                            <img src={getImageUrl(article.cover_image_url)} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center">
                              <ImageIcon className="text-gray-600" size={24} />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col flex-grow">
                          <h3 className="text-lg font-bold leading-snug mb-2 text-white group-hover:text-[#667eea] transition-colors line-clamp-2">
                            {article.title}
                          </h3>
                          <div className="flex items-center justify-between mt-auto">
                            <span className="text-[10px] text-[#666] font-mono uppercase">
                            {new Date(article.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* --- SECTION 3: OTHER NEWS --- */}
        {otherNews.length > 0 && (
            <section className="border-t border-[#222222] pt-12">
                 <h3 className="text-xl font-bold uppercase tracking-wider border-l-4 border-white pl-3 mb-6 text-white">
                    Other News
                 </h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
                    {otherNews.map((article) => (
                        <Link key={article.id} href={`/article/${article.slug}`} className="group flex flex-col cursor-pointer">
                          <div className="relative h-40 w-full overflow-hidden mb-3 bg-[#111] rounded-lg border border-[#222]">
                            {getImageUrl(article.cover_image_url) ? (
                              <img src={getImageUrl(article.cover_image_url)} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center">
                                <ImageIcon className="text-gray-600" size={20} />
                              </div>
                            )}
                            {article.category && (
                              <div className="absolute top-2 left-2 z-10">
                                <span className="text-white py-1 px-3 text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-sm bg-black/40 rounded" style={{ borderBottom: `2px solid ${article.category.color || '#fff'}` }}>
                                  {article.category.name}
                                </span>
                              </div>
                            )}
                          </div>
                           <h4 className="text-sm font-bold leading-snug text-white group-hover:text-[#667eea] transition-colors line-clamp-2 mb-1.5">
                                {article.title}
                            </h4>
                          <div className="flex flex-col mt-auto">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-[#666] font-mono uppercase">
                                  {new Date(article.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                          </div>
                        </Link>
                    ))}
                 </div>
            </section>
        )}
      </main>

      <Footer siteSettings={siteSettings} />

      {/* Tailwind Utility for hiding scrollbar on the tabs */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}