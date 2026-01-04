'use client'

import { getStorageUrl } from '../lib/supabase/storage'

export default function TrendingSidebar({ trendingArticles = [], onArticleClick }) {
  const handleArticleClick = (article) => {
    onArticleClick?.(article)
  }

  const formatDate = (date) => {
    if (!date) return 'Recently'
    const d = new Date(date)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getImageUrl = (imagePath) => {
    return getStorageUrl(imagePath) || imagePath
  }

  return (
    <aside
      className="
        bg-[#111111] rounded-2xl p-6
        min-h-[200px]
        w-full
      "
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        <h3 className="text-xl font-extrabold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
          Read Next
        </h3>
      </div>

      {/* Empty State */}
      {trendingArticles.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No suggested articles right now
        </div>
      )}

      {/* Articles */}
      <div className="flex flex-col gap-6">
        {trendingArticles.map((article, index) => (
          <div key={article.id ?? index}>
            <article
              className="flex gap-4 cursor-pointer group"
              onClick={() => handleArticleClick(article)}
            >
              {/* Article Image */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-purple-900/30 to-blue-900/30">
                  {article.cover_image_url ? (
                    <img
                      src={getImageUrl(article.cover_image_url)}
                      alt={article.title || 'Article'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.parentElement.innerHTML = `
                          <div class="w-full h-full flex items-center justify-center">
                            <svg class="w-6 h-6 text-purple-500 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        `
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-500 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    {article.category && (
                      <span
                        className="text-[11px] font-bold tracking-wider block truncate"
                        style={{ color: article.category.color || '#667eea' }}
                      >
                        {article.category.name}
                      </span>
                    )}

                    <h4
                      className="
                        text-base font-bold leading-tight my-1 text-white
                        group-hover:text-gray-300
                        line-clamp-2
                      "
                    >
                      {article.title || 'Untitled Article'}
                    </h4>

                    {/* Date (without calendar icon) */}
                    <span className="text-xs text-[#666666]">
                      {formatDate(article.published_at)}
                    </span>
                  </div>

                  {/* Rank (moved to right side) */}
                  <span
                    className={`text-2xl font-black leading-none ml-2 flex-shrink-0 ${
                      article.position === 1
                        ? 'text-[#667eea]'
                        : 'text-[#888888]'
                    }`}
                  >
                    {article.position}
                  </span>
                </div>
              </div>
            </article>

            {/* Divider */}
            {index < trendingArticles.length - 1 && (
              <div className="h-px bg-[#222222] mt-6" />
            )}
          </div>
        ))}
      </div>
    </aside>
  )
}