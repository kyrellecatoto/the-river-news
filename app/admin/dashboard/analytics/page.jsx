'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../../lib/supabase/client'
import { getCurrentUser } from '../../../lib/supabase/auth'
import {
  BarChart2,
  TrendingUp,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Calendar,
  Clock,
  Download,
  Filter,
  RefreshCw,
  TrendingDown,
  TrendingUp as TrendingUpIcon,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  LineChart,
  DollarSign
} from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'

export default function AnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('month') // day, week, month, year, all
  const [analytics, setAnalytics] = useState({
    overview: {
      totalLikes: 0,
      totalComments: 0,
      totalArticles: 0,
      totalCategories: 0,
      engagementRate: 0
    },
    trends: {
      views: { current: 0, previous: 0, change: 0 },
      likes: { current: 0, previous: 0, change: 0 },
      comments: { current: 0, previous: 0, change: 0 },
      articles: { current: 0, previous: 0, change: 0 }
    },
    topContent: [],
    categoryDistribution: [],
    hourlyActivity: [],
    recentActivity: []
  })

  useEffect(() => {
    checkAuthAndLoadData()
  }, [timeRange])

  const checkAuthAndLoadData = async () => {
    try {
      const user = await getCurrentUser()
      if (!user) {
        router.push('/admin/login')
        return
      }
      await loadAnalytics()
    } catch (error) {
      console.error('Error:', error)
      router.push('/admin/login')
    }
  }

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      // Get date range based on timeRange selection
      const now = new Date()
      let startDate = new Date()
      
      switch (timeRange) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
        case 'all':
          startDate = new Date(0) // Beginning of time
          break
      }

      // Fetch all articles with their metrics
      const { data: articles, error } = await supabase
        .from('news_articles')
        .select(`
          *,
          category:news_categories(*)
        `)
        .gte('published_at', timeRange === 'all' ? undefined : startDate.toISOString())
        .order('published_at', { ascending: false })

      if (error) throw error

      // Fetch categories for distribution
      const { data: categories } = await supabase
        .from('news_categories')
        .select('*')

      // Calculate analytics
      calculateAnalytics(articles || [], categories || [])
    } catch (error) {
      console.error('Error loading analytics:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const calculateAnalytics = (articles, categories) => {
    // Overview metrics
    const totalViews = articles.reduce((sum, article) => sum + (article.views_count || 0), 0)
    const totalLikes = articles.reduce((sum, article) => sum + (article.likes_count || 0), 0)
    const totalComments = articles.reduce((sum, article) => sum + (article.comments_count || 0), 0)
    const totalArticles = articles.length
    
    // Engagement rate calculation
    const totalInteractions = totalLikes + totalComments
    const engagementRate = totalViews > 0 ? (totalInteractions / totalViews) * 100 : 0

    // Calculate trends (simplified - in real app, compare with previous period)
    const half = Math.floor(articles.length / 2)
    const recentArticles = articles.slice(0, half)
    const previousArticles = articles.slice(half)
    
    const recentViews = recentArticles.reduce((sum, article) => sum + (article.views_count || 0), 0)
    const previousViews = previousArticles.reduce((sum, article) => sum + (article.views_count || 0), 0)
    const viewsChange = previousViews > 0 ? ((recentViews - previousViews) / previousViews) * 100 : 100

    const recentLikes = recentArticles.reduce((sum, article) => sum + (article.likes_count || 0), 0)
    const previousLikes = previousArticles.reduce((sum, article) => sum + (article.likes_count || 0), 0)
    const likesChange = previousLikes > 0 ? ((recentLikes - previousLikes) / previousLikes) * 100 : 100

    const recentComments = recentArticles.reduce((sum, article) => sum + (article.comments_count || 0), 0)
    const previousComments = previousArticles.reduce((sum, article) => sum + (article.comments_count || 0), 0)
    const commentsChange = previousComments > 0 ? ((recentComments - previousComments) / previousComments) * 100 : 100

    const articlesChange = previousArticles.length > 0 
      ? ((recentArticles.length - previousArticles.length) / previousArticles.length) * 100 
      : 100

    // Top content (sorted by engagement score)
    const topContent = [...articles]
      .sort((a, b) => {
        const aScore = (a.views_count || 0) * 0.3 + (a.likes_count || 0) * 0.4 + (a.comments_count || 0) * 0.3
        const bScore = (b.views_count || 0) * 0.3 + (b.likes_count || 0) * 0.4 + (b.comments_count || 0) * 0.3
        return bScore - aScore
      })
      .slice(0, 5)

    // Category distribution
    const categoryDistribution = categories.map(category => {
      const categoryArticles = articles.filter(article => article.category_id === category.id)
      const totalCategoryViews = categoryArticles.reduce((sum, article) => sum + (article.views_count || 0), 0)
      const totalCategoryLikes = categoryArticles.reduce((sum, article) => sum + (article.likes_count || 0), 0)
      const totalCategoryComments = categoryArticles.reduce((sum, article) => sum + (article.comments_count || 0), 0)
      
      return {
        id: category.id,
        name: category.name,
        color: category.color,
        articleCount: categoryArticles.length,
        totalViews: totalCategoryViews,
        totalLikes: totalCategoryLikes,
        totalComments: totalCategoryComments,
        percentage: articles.length > 0 ? (categoryArticles.length / articles.length) * 100 : 0
      }
    }).sort((a, b) => b.articleCount - a.articleCount)

    // Generate hourly activity data (simulated)
    const hourlyActivity = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      views: Math.floor(Math.random() * 1000) + 500,
      comments: Math.floor(Math.random() * 50) + 20,
      likes: Math.floor(Math.random() * 100) + 50
    }))

    // Recent activity (last 10 articles)
    const recentActivity = articles.slice(0, 10).map(article => ({
      id: article.id,
      title: article.title,
      type: article.is_video ? 'video' : 'article',
      views: article.views_count || 0,
      likes: article.likes_count || 0,
      comments: article.comments_count || 0,
      time: new Date(article.published_at || article.created_at).toLocaleDateString(),
      engagement: ((article.likes_count || 0) + (article.comments_count || 0)) / (article.views_count || 1) * 100
    }))

    setAnalytics({
      overview: {
        totalViews,
        totalLikes,
        totalComments,
        totalArticles,
        totalCategories: categories.length,
        engagementRate
      },
      trends: {
        views: { current: recentViews, previous: previousViews, change: viewsChange },
        likes: { current: recentLikes, previous: previousLikes, change: likesChange },
        comments: { current: recentComments, previous: previousComments, change: commentsChange },
        articles: { current: recentArticles.length, previous: previousArticles.length, change: articlesChange }
      },
      topContent,
      categoryDistribution,
      hourlyActivity,
      recentActivity
    })
  }

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const getTrendIcon = (change) => {
    if (change > 0) return <ArrowUpRight className="text-green-400" size={16} />
    if (change < 0) return <ArrowDownRight className="text-red-400" size={16} />
    return <TrendingUpIcon className="text-gray-400" size={16} />
  }

  const getTrendColor = (change) => {
    if (change > 0) return 'text-green-400'
    if (change < 0) return 'text-red-400'
    return 'text-gray-400'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2">Analytics Dashboard</h1>
            <p className="text-blue-100">
              Comprehensive insights into your content performance and audience engagement
            </p>
          </div>
          <button
            onClick={loadAnalytics}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            title="Refresh analytics"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Time Range Filter */}
      <div className="bg-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Analytics Time Range</h3>
          <div className="flex gap-2">
            {['day', 'week', 'month', 'year', 'all'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                  timeRange === range 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Eye className="text-blue-400" size={24} />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{formatNumber(analytics.overview.totalViews)}</div>
              <div className={`flex items-center gap-1 text-sm ${getTrendColor(analytics.trends.views.change)}`}>
                {getTrendIcon(analytics.trends.views.change)}
                <span>{analytics.trends.views.change.toFixed(1)}%</span>
              </div>
            </div>
          </div>
          <h3 className="font-semibold">Total Views</h3>
          <p className="text-sm text-gray-400">Unique page views</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-500/20 rounded-lg">
              <Heart className="text-red-400" size={24} />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{formatNumber(analytics.overview.totalLikes)}</div>
              <div className={`flex items-center gap-1 text-sm ${getTrendColor(analytics.trends.likes.change)}`}>
                {getTrendIcon(analytics.trends.likes.change)}
                <span>{analytics.trends.likes.change.toFixed(1)}%</span>
              </div>
            </div>
          </div>
          <h3 className="font-semibold">Total Likes</h3>
          <p className="text-sm text-gray-400">User likes on articles</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <MessageCircle className="text-green-400" size={24} />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{formatNumber(analytics.overview.totalComments)}</div>
              <div className={`flex items-center gap-1 text-sm ${getTrendColor(analytics.trends.comments.change)}`}>
                {getTrendIcon(analytics.trends.comments.change)}
                <span>{analytics.trends.comments.change.toFixed(1)}%</span>
              </div>
            </div>
          </div>
          <h3 className="font-semibold">Total Comments</h3>
          <p className="text-sm text-gray-400">User comments & discussions</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <BarChart2 className="text-purple-400" size={24} />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{analytics.overview.engagementRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-400">Engagement Rate</div>
            </div>
          </div>
          <h3 className="font-semibold">Engagement Rate</h3>
          <p className="text-sm text-gray-400">Interactions per view</p>
        </div>
      </div>

      {/* Top Content and Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Content */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Top Performing Content</h2>
            <Link
              href="/admin/dashboard/articles?sort=engagement"
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              View All →
            </Link>
          </div>
          
          <div className="space-y-4">
            {analytics.topContent.map((article, index) => (
              <Link
                key={article.id}
                href={`/admin/dashboard/articles/${article.id}/edit`}
                className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
                  <div>
                    <div className="font-medium group-hover:text-gray-300 transition-colors line-clamp-1">
                      {article.title}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Eye size={12} />
                        {formatNumber(article.views_count || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart size={12} />
                        {formatNumber(article.likes_count || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle size={12} />
                        {formatNumber(article.comments_count || 0)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">
                    {(((article.likes_count || 0) + (article.comments_count || 0)) / (article.views_count || 1) * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-400">Engagement</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Category Performance</h2>
            <Link
              href="/admin/dashboard/categories"
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Manage Categories →
            </Link>
          </div>
          
          <div className="space-y-4">
            {analytics.categoryDistribution.map((category) => (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span className="font-medium">{category.name}</span>
                    <span className="text-sm text-gray-400">
                      {category.articleCount} article{category.articleCount === 1 ? '' : 's'}
                    </span>
                  </div>
                  <span className="text-sm font-semibold">{category.percentage.toFixed(1)}%</span>
                </div>
                
                {/* Progress bar */}
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${category.percentage}%`,
                      backgroundColor: category.color
                    }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Eye size={12} />
                      {formatNumber(category.totalViews)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart size={12} />
                      {formatNumber(category.totalLikes)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle size={12} />
                      {formatNumber(category.totalComments)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Recent Activity</h2>

        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4">Article</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">Views</th>
                <th className="text-left py-3 px-4">Likes</th>
                <th className="text-left py-3 px-4">Comments</th>
                <th className="text-left py-3 px-4">Engagement</th>
                <th className="text-left py-3 px-4">Published</th>
              </tr>
            </thead>
            <tbody>
              {analytics.recentActivity.map((activity) => (
                <tr key={activity.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                  <td className="py-3 px-4">
                    <Link 
                      href={`/admin/dashboard/articles/${activity.id}/edit`}
                      className="font-medium hover:text-gray-300 transition-colors line-clamp-1 max-w-xs"
                    >
                      {activity.title}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      activity.type === 'video' 
                        ? 'bg-blue-500/20 text-blue-400' 
                        : 'bg-gray-700 text-gray-300'
                    }`}>
                      {activity.type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Eye size={14} className="text-gray-400" />
                      <span>{formatNumber(activity.views)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Heart size={14} className="text-red-400" />
                      <span>{formatNumber(activity.likes)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <MessageCircle size={14} className="text-green-400" />
                      <span>{formatNumber(activity.comments)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold">{activity.engagement.toFixed(1)}%</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-400">{activity.time}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}