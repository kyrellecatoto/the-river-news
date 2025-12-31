'use client'

export default function TrendingSidebar({ trendingArticles = [], onArticleClick }) {
  const handleArticleClick = (article) => {
    onArticleClick?.(article)
  }

  const timeAgo = (date) => {
    if (!date) return 'Recently'
    const diff = Math.max(
      0,
      Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60))
    )
    return `${diff}h ago`
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
              className="flex gap-4 cursor-pointer"
              onClick={() => handleArticleClick(article)}
            >
              {/* Rank */}
              <span
                className={`text-3xl font-black leading-none ${
                  article.position === 1
                    ? 'text-[#667eea]'
                    : 'text-[#888888]'
                }`}
              >
                {article.position}
              </span>

              {/* Content */}
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
                    text-base font-bold leading-tight my-2 text-white
                    hover:text-gray-300
                    line-clamp-2
                  "
                >
                  {article.title || 'Untitled Article'}
                </h4>

                <div className="flex gap-2 text-xs text-[#666666]">
                  <span>{timeAgo(article.published_at)}</span>
                  <span>•</span>
                  <span>{article.shares_count || 0} shares</span>
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
