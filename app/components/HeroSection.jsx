'use client'

import { getStorageUrl } from '../lib/supabase/storage'

export default function HeroSection({ heroArticle, siteSettings, onArticleClick }) {
  if (!heroArticle) {
    return (
      <section className="bg-[#0a0a0a] py-8 px-0 sm:px-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="relative overflow-hidden h-[400px] sm:h-[600px] bg-gradient-to-br from-[#667eea] to-[#764ba2]">
          </div>
        </div>
      </section>
    )
  }

  const handleClick = () => {
    if (onArticleClick && heroArticle) {
      onArticleClick(heroArticle)
    }
  }

  const handlePlayButtonClick = (e) => {
    e.stopPropagation()
    // Handle video play logic here
    console.log('Play video:', heroArticle.video_url)
  }

  // Get proper image URL for hero article
  const heroImageUrl = heroArticle.cover_image_url 
    ? getStorageUrl(heroArticle.cover_image_url)
    : null

  return (
    <section className="bg-[#0a0a0a] py-8 px-0 sm:px-6">
      <div className="max-w-[1400px] mx-auto">
        <div 
          className="relative overflow-hidden cursor-pointer h-[400px] sm:h-[600px] sm:rounded-2xl card-hover active:scale-[0.98] transition-transform"
          onClick={handleClick}
        >
          <div 
            className="absolute inset-0 flex items-center justify-center bg-cover bg-center"
            style={{
              backgroundImage: heroImageUrl 
                ? `url(${heroImageUrl})`
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            {/* Add loading placeholder */}
            {heroImageUrl && (
              <img 
                src={heroImageUrl} 
                alt="" 
                className="hidden" 
                onLoad={(e) => {
                  // Image loaded successfully
                  e.target.parentElement.style.backgroundImage = `url(${heroImageUrl})`
                }}
                onError={(e) => {
                  // If image fails to load, fallback to gradient
                  e.target.parentElement.style.backgroundImage = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
              />
            )}
            
            {heroArticle.is_video && (
              <div 
                className="play-button absolute w-16 h-16 sm:w-20 sm:h-20 bg-white/95 rounded-full flex items-center justify-center cursor-pointer shadow-lg"
                onClick={handlePlayButtonClick}
              >
                <svg width="24" height="24" className="ml-1 sm:w-8 sm:h-8" viewBox="0 0 32 32">
                  <path d="M10 8 L10 24 L24 16 Z" fill="#667eea" />
                </svg>
              </div>
            )}
          </div>
          <div className="gradient-overlay absolute inset-0 flex flex-col justify-end p-5 sm:p-10">
            <div className="flex gap-2 sm:gap-3 mb-3 sm:mb-4">
              {heroArticle.is_video && (
                <span className="bg-[#dc2626] text-white py-1.5 px-3 sm:px-4 rounded-full text-xs font-bold">
                  VIDEO
                </span>
              )}
              {heroArticle.category && (
                <span 
                  className="bg-white/20 text-white py-1.5 px-3 sm:px-4 rounded-full text-xs font-semibold backdrop-blur-md"
                  style={{ backgroundColor: heroArticle.category.color || '#667eea' }}
                >
                  {heroArticle.category.name}
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-[48px] font-black leading-tight mb-3 sm:mb-4 text-white">
              {heroArticle.title || siteSettings.hero_title}
            </h2>
            <p className="text-sm sm:text-lg leading-relaxed text-white/90 mb-4 sm:mb-5 line-clamp-2 sm:line-clamp-none">
              {heroArticle.subtitle || siteSettings.hero_subtitle}
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-4 items-center text-xs sm:text-sm text-white/80">
              <span className="font-semibold">{heroArticle.author_name || 'Staff Writer'}</span>
              <span className="hidden sm:inline">•</span>
              <span>
                {heroArticle.published_at 
                  ? new Date(heroArticle.published_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: heroArticle.published_at.includes('-') ? 'numeric' : undefined
                    })
                  : 'Recently'
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}