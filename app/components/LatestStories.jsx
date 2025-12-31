'use client'

import { useState } from 'react'
import { MessageCircle, Share2 } from 'lucide-react'
import { getStorageUrl } from '../lib/supabase/storage'
import Link from 'next/link'

export default function LatestStories({ articles, onArticleClick }) {
  const [activeFilter, setActiveFilter] = useState('All')
  const [likedArticles, setLikedArticles] = useState({})

  const handleArticleClick = (article) => {
    if (onArticleClick) {
      onArticleClick(article)
    }
  }

  const handleLike = (e, articleId) => {
    e.stopPropagation()
    setLikedArticles(prev => ({
      ...prev,
      [articleId]: !prev[articleId]
    }))
  }

  const handleComment = (e, articleId) => {
    e.stopPropagation()
    console.log('Comment on article:', articleId)
  }

  const handleShare = (e, article) => {
    e.stopPropagation()
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.subtitle,
        url: `${window.location.origin}/article/${article.slug}`,
      })
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/article/${article.slug}`)
      alert('Link copied to clipboard!')
    }
  }

  if (!articles || articles.length === 0) {
    return (
      <section className="bg-[#0a0a0a] py-10 px-6">
        <div className="max-w-[1400px] mx-auto text-center text-gray-500">
          <p className="text-lg">No articles available at the moment</p>
        </div>
      </section>
    )
  }

  const filteredArticles = articles.filter(article => {
    if (activeFilter === 'Video') return article.is_video
    if (activeFilter === 'Articles') return !article.is_video
    return true
  })

  // --- HELPER FOR NEW SECTION: Get articles for specific categories ---
  const getArticlesByCategory = (categoryName) => {
    return articles
      .filter(article => article.category?.name?.toLowerCase() === categoryName.toLowerCase())
      .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
      .slice(0, 4) 
  }

  const leftCategoryData = getArticlesByCategory('National')
  const rightCategoryData = getArticlesByCategory('Local')

  return (
    <section className="bg-[#0a0a0a] py-8 px-4 sm:px-6">
      <div className="max-w-[1400px] mx-auto">
        
        {/* =========================================
            SECTION 1: LATEST STORIES
           ========================================= */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-[#222222] pb-6">
          <h3 className="text-[24px] font-black m-0 mb-4 md:mb-0 text-white uppercase tracking-tight">Latest Stories</h3>
          <div className="flex gap-2">
            {['All', 'Video', 'Articles'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`py-1 px-4 text-xs font-bold cursor-pointer transition-all uppercase tracking-wider ${
                  activeFilter === filter
                    ? 'text-white border-b-2 border-[#667eea]'
                    : 'text-[#666666] hover:text-white border-b-2 border-transparent'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-16">
          {filteredArticles.map((article, index) => {
            const articleImageUrl = article.cover_image_url 
              ? getStorageUrl(article.cover_image_url)
              : null
            
            return (
              <article 
                key={article.id} 
                className="group bg-[#111111] cursor-pointer hover:bg-[#161616] transition-colors"
                onClick={() => handleArticleClick(article)}
              >
                {/* REMOVED: The "Mobile Category" div that was here.
                   Now the layout is cleaner and the badge is always inside the image.
                */}
                
                <div 
                  /* CHANGED: h-64 for mobile (taller/more immersive), sm:h-44 for desktop 
                  */
                  className="relative h-64 sm:h-44 bg-cover bg-center flex items-center justify-center overflow-hidden"
                  style={{
                    backgroundImage: articleImageUrl 
                      ? `url(${articleImageUrl})`
                      : `linear-gradient(135deg, ${getCategoryColor(article.category?.name, index)}`
                  }}
                >
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300 hidden sm:block"></div>
                  
                  {articleImageUrl && (
                    <img 
                      src={articleImageUrl} 
                      alt="" 
                      className="hidden" 
                      onLoad={(e) => { e.target.parentElement.style.backgroundImage = `url(${articleImageUrl})` }}
                      onError={(e) => { e.target.parentElement.style.backgroundImage = `linear-gradient(135deg, ${getCategoryColor(article.category?.name, index)}` }}
                    />
                  )}
                  
                  {/* Category Label - Now Visible on ALL screens (removed hidden sm:block) */}
                  {article.category && (
                    <div className="absolute top-3 left-3 z-20">
                      <span 
                        className="text-white py-1 px-3 text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-sm bg-black/20"
                        style={{ backgroundColor: article.category.color || '#667eea' }}
                      >
                        {article.category.name}
                      </span>
                    </div>
                  )}

                  {/* Mobile Title Overlay - Gradient for readability */}
                  <div className="absolute inset-0 flex flex-col justify-end p-4 sm:hidden bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                    <h4 className="text-lg font-bold leading-tight text-white drop-shadow-md">
                      {article.title}
                    </h4>
                     <div className="flex gap-2 text-[10px] text-gray-300 mt-2 uppercase tracking-wide font-medium">
                      <span>
                        {article.published_at 
                          ? new Date(article.published_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })
                          : 'Recently'
                        }
                      </span>
                    </div>
                  </div>
                  
                  
                  {/* Video Indicator */}
                  {article.is_video && (
                    <div className="absolute bottom-2 right-2 bg-black/80 py-0.5 px-1.5 z-10">
                      <span className="text-white text-[10px] font-medium font-mono">
                        {article.video_duration 
                          ? `${Math.floor(article.video_duration / 60)}:${String(article.video_duration % 60).padStart(2, '0')}`
                          : '5:32'
                        }
                      </span>
                    </div>
                  )}
                  
                  {/* Play Icon */}
                  {article.is_video && articleImageUrl && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-10 h-10 bg-black/60 flex items-center justify-center border border-white/20">
                        <svg width="14" height="14" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" fill="white" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Desktop Text Content (Hidden on Mobile, since mobile text is inside image now) */}
                <div className="hidden sm:block p-3">
                  <h4 className="text-sm font-bold leading-snug mb-2 text-white group-hover:underline decoration-[#666666] underline-offset-4 decoration-1 line-clamp-2">
                    {article.title}
                  </h4>
                  <p className="text-xs leading-relaxed text-[#999999] mb-3 line-clamp-2 font-serif">
                    {article.subtitle}
                  </p>
                  <div className="flex justify-between items-center pt-2 border-t border-[#222222]">
                    <div className="flex gap-2 text-[10px] text-[#666666] uppercase tracking-wide font-medium">
                      <span>
                        {article.published_at 
                          ? new Date(article.published_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })
                          : 'Recently'
                        }
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={(e) => handleComment(e, article.id)}
                        className="flex items-center gap-1 text-[10px] cursor-pointer hover:text-white transition-colors"
                      >
                        <MessageCircle size={12} color="#666666" />
                        <span className="text-[#666666]">{article.comments_count || 0}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
        
        <div className="text-center mb-20 border-t border-[#222222] pt-8">
          <button className="bg-[#222222] text-white py-2 px-8 text-xs font-bold uppercase tracking-widest hover:bg-[#333333] transition-all">
            Load More Stories
          </button>
        </div>


        {/* =========================================
            SECTION 2: SPLIT CATEGORIES
           ========================================= */}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-12">
          
          {/* LEFT COLUMN: National */}
          <CategoryColumn 
            title="National" 
            articles={leftCategoryData} 
            onArticleClick={handleArticleClick}
          />

          {/* RIGHT COLUMN: Local */}
          <CategoryColumn 
            title="Local" 
            articles={rightCategoryData} 
            onArticleClick={handleArticleClick}
          />

        </div>

      </div>
    </section>
  )
}

// --- SUB-COMPONENT FOR THE SPLIT COLUMNS ---
function CategoryColumn({ title, articles, onArticleClick }) {
  if (!articles || articles.length === 0) return (
    <div className="flex flex-col text-[#444]">
      <div className="flex items-center mb-5">
        <div className="h-4 w-1 bg-[#333] mr-2"></div>
        <h3 className="text-sm font-black uppercase tracking-widest text-[#666]">{title}</h3>
      </div>
      <p className="text-xs">No articles available.</p>
    </div>
  )

  const mainArticle = articles[0]
  const listArticles = articles.slice(1)

  return (
    <div className="flex flex-col">
      {/* Header with Thick Bar */}
      <div className="flex items-center mb-5">
        <div className="h-4 w-1 bg-white mr-2"></div>
        <h3 className="text-sm font-black uppercase tracking-widest text-white">
          {title}
        </h3>
      </div>

      {/* Hero Article (Big Photo) */}
      <div className="mb-6 group cursor-pointer" onClick={() => onArticleClick(mainArticle)}>
        <div className="relative overflow-hidden mb-3 aspect-[16/9]">
            {mainArticle.cover_image_url ? (
               <img 
                 src={getStorageUrl(mainArticle.cover_image_url)}
                 alt={mainArticle.title}
                 className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
               />
            ) : (
               <div className="w-full h-full bg-[#161616] flex items-center justify-center text-[#333]">No Image</div>
            )}
             {/* Mobile Overlay for Hero in Split Column */}
             <div className="absolute inset-0 flex items-end p-4 sm:hidden bg-gradient-to-t from-black/80 to-transparent">
                 <h2 className="text-lg font-bold leading-tight text-white">{mainArticle.title}</h2>
             </div>
        </div>
        {/* Desktop Text for Hero */}
        <div className="hidden sm:block">
            <h2 className="text-xl md:text-2xl font-bold leading-tight text-white group-hover:text-[#667eea] transition-colors">
            {mainArticle.title}
            </h2>
            <p className="text-[#888] mt-2 text-sm line-clamp-2 font-serif">
            {mainArticle.subtitle}
            </p>
        </div>
      </div>

      {/* Divider */}
      {listArticles.length > 0 && <div className="border-t border-[#222222] mb-6"></div>}

      {/* Sub-Articles List */}
      <div className="flex flex-col gap-6">
        {listArticles.map((article) => (
          <div 
            key={article.id} 
            onClick={() => onArticleClick(article)}
            className="group flex gap-4 items-start cursor-pointer"
          >
            {/* Small Thumbnail */}
            <div className="flex-shrink-0 overflow-hidden w-28 h-20 md:w-32 md:h-24 bg-[#161616]">
               {article.cover_image_url && (
                <img 
                  src={getStorageUrl(article.cover_image_url)}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
               )}
            </div>
            
            {/* Text */}
            <div className="flex flex-col justify-start">
              <h4 className="text-sm md:text-base font-bold leading-snug text-white group-hover:text-[#667eea] transition-colors line-clamp-2 mb-1">
                {article.title}
              </h4>
              <span className="text-[10px] text-[#555] uppercase tracking-wide">
                 {article.published_at 
                    ? new Date(article.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : 'Recent'
                 }
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function getCategoryColor(categoryName, index) {
  const colors = [
    ['#f093fb', '#f5576c'],
    ['#4facfe', '#00f2fe'],
    ['#fa709a', '#fee140'],
    ['#a8edea', '#fed6e3'],
    ['#667eea', '#764ba2'],
    ['#ff9a9e', '#fecfef']
  ]
  return colors[index % colors.length].join(', ')
}