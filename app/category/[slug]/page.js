'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle, Share2, Image as ImageIcon } from 'lucide-react'
import { createClient } from '../../lib/supabase/client'
import { getStorageUrl } from '../../lib/supabase/storage'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

export default function CategoryPage() {
  const params = useParams()
  // Capitalize first letter for display (e.g., "politics" -> "Politics")
  const categoryNameDisplay = params.slug.charAt(0).toUpperCase() + params.slug.slice(1)
  
  const [articles, setArticles] = useState([])
  const [otherNews, setOtherNews] = useState([]) // State for unrelated news
  const [loading, setLoading] = useState(true)
  const [siteSettings, setSiteSettings] = useState({})

  useEffect(() => {
    fetchCategoryArticles()
    fetchSiteSettings()
  }, [params.slug])

  async function fetchCategoryArticles() {
    try {
      setLoading(true)
      const supabase = createClient()

      // 1. First, find the Category ID based on the URL slug (name)
      const { data: categoryData, error: catError } = await supabase
        .from('news_categories')
        .select('id, name, color')
        .ilike('name', params.slug) 
        .single()

      if (catError || !categoryData) {
        console.error('Category not found')
        setLoading(false)
        return
      }

      // 2. Fetch articles belonging to this Category ID
      const { data: articlesData, error: artError } = await supabase
        .from('news_articles')
        .select(`*, category:news_categories(*)`)
        .eq('category_id', categoryData.id)
        .order('published_at', { ascending: false })

      if (artError) throw artError
      setArticles(articlesData || [])

      // 3. Fetch "Other News" (Articles NOT in this category)
      const { data: otherData, error: otherError } = await supabase
        .from('news_articles')
        .select(`*, category:news_categories(*)`)
        .neq('category_id', categoryData.id) // Exclude current category
        .order('published_at', { ascending: false })
        .limit(4) // Fetch 4 items for the bottom section

      if (!otherError) {
        setOtherNews(otherData || [])
      }

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchSiteSettings() {
    const supabase = createClient()
    const { data } = await supabase.from('site_settings').select('*')
    const settings = {}
    data?.forEach((s) => { settings[s.key] = s.value })
    setSiteSettings(settings)
  }

  // --- RENDERING HELPERS ---
  const getImageUrl = (path) => getStorageUrl(path) || path

  // Helper to split articles
  const featuredArticle = articles.length > 0 ? articles[0] : null
  const headlinesArticles = articles.length > 1 ? articles.slice(1) : []

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <Navbar />
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#667eea]"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-[1400px] mx-auto w-full p-4 md:p-8">
        
        {/* Category Header */}
        <div className="mb-8 border-b border-[#222222] pb-6 mt-8">
           <div className="flex items-center gap-3 mb-2">
             <div className="h-8 w-2 bg-[#667eea]"></div>
             <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight">
               {categoryNameDisplay}
             </h1>
           </div>
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-xl">No articles found in {categoryNameDisplay}.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-16">
            
            {/* --- SECTION 1: FEATURED BANNER --- */}
            {featuredArticle && (
              <Link 
                href={`/article/${featuredArticle.slug}`}
                className="group relative w-full bg-[#111111] hover:bg-[#161616] transition-colors grid grid-cols-1 lg:grid-cols-12 overflow-hidden border border-[#222]"
              >
                {/* Banner Image */}
                <div className="lg:col-span-8 h-64 md:h-96 relative overflow-hidden">
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
                  {/* Badge */}
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

                {/* Banner Content */}
                <div className="lg:col-span-4 p-6 md:p-10 flex flex-col justify-center">
                    <div className="mb-4 text-[#667eea] font-bold tracking-wider text-xs uppercase flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-[#667eea] animate-pulse"></span>
                       Latest Story
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

            {/* --- SECTION 2: HEADLINES (Rest of current category) --- */}
            {headlinesArticles.length > 0 && (
              <div>
                <h3 className="text-xl font-bold uppercase tracking-wider border-l-4 border-[#667eea] pl-3 mb-6 text-white">
                  Headlines
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                  {headlinesArticles.map((article) => (
                    <Link 
                      key={article.id} 
                      href={`/article/${article.slug}`}
                      className="group flex flex-col cursor-pointer"
                    >
                      {/* Image Container */}
                      <div className="relative h-48 w-full overflow-hidden mb-4 bg-[#111]">
                        {getImageUrl(article.cover_image_url) ? (
                          <img
                            src={getImageUrl(article.cover_image_url)}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center">
                            <ImageIcon className="text-gray-600" size={24} />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex flex-col flex-grow">
                        <h3 className="text-lg font-bold leading-snug mb-2 text-white group-hover:text-[#667eea] transition-colors line-clamp-2">
                          {article.title}
                        </h3>
                        <div className="flex items-center justify-between mb-2">

                        <span className="text-[10px] text-[#666] font-mono uppercase">
                        {new Date(article.published_at).toLocaleDateString('en-US', {
                            month: 'long', 
                            day: 'numeric',
                            year: 'numeric'
                        })}
                        </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* --- SECTION 3: OTHER NEWS (Unrelated Categories) --- */}
            {otherNews.length > 0 && (
                <div className="border-t border-[#222] pt-12">
                     <h3 className="text-xl font-bold uppercase tracking-wider border-l-4 border-white pl-3 mb-6 text-white">
                        Other News
                     </h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
                        {otherNews.map((article) => (
                            <Link 
                              key={article.id} 
                              href={`/article/${article.slug}`}
                              className="group flex flex-col cursor-pointer"
                            >
                              <div className="relative h-40 w-full overflow-hidden mb-3 bg-[#111]">
                                {getImageUrl(article.cover_image_url) ? (
                                  <img
                                    src={getImageUrl(article.cover_image_url)}
                                    alt={article.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center">
                                    <ImageIcon className="text-gray-600" size={20} />
                                  </div>
                                )}
                                
                                {/* BADGE: Overlayed on image (Top Left) */}
                                {article.category && (
                                  <div className="absolute top-2 left-2 z-10">
                                    <span 
                                      className="text-white py-1 px-3 text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-sm bg-black/20"
                                      style={{ backgroundColor: article.category.color || '#fff' }}
                                    >
                                      {article.category.name}
                                    </span>
                                  </div>
                                )}
                              </div>
                               <h4 className="text-sm font-bold leading-snug text-white group-hover:text-[#667eea] transition-colors line-clamp-2">
                                    {article.title}
                                </h4>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-[10px] text-[#666] font-mono uppercase">
                                {new Date(article.published_at).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
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
      </main>

      <Footer siteSettings={siteSettings} />
    </div>
  )
}