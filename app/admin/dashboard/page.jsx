'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/client'
import { getCurrentUser } from '../../lib/supabase/auth'
import { 
  FileText, 
  Folder, 
  Eye, 
  Users, 
  TrendingUp,
  BarChart2,
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  Video,
  Star,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Heart,
  TrendingUp as TrendingUpIcon,
  ArrowUp,
  ArrowDown,
  RefreshCw
} from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [articles, setArticles] = useState([])
  const [filteredArticles, setFilteredArticles] = useState([])
  const [categories, setCategories] = useState([])
  const [stats, setStats] = useState({
    totalArticles: 0,
    totalCategories: 0,
    featuredArticles: 0,
    videoArticles: 0,
    breakingNews: 0,
    recentArticles: [],
    totalComments: 0,
    totalLikes: 0,
    averageComments: 0,
    averageLikes: 0,
    trendingArticles: [],
    mostCommentedArticles: [],
    mostLikedArticles: []
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [timeRange, setTimeRange] = useState('week') // week, month, year, all
  const itemsPerPage = 10

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  useEffect(() => {
    filterArticles()
  }, [searchTerm, selectedCategory, articles])

  const checkAuthAndLoadData = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/admin/login')
        return
      }
      setUser(currentUser)
      await loadData()
    } catch (error) {
      console.error('Error:', error)
      router.push('/admin/login')
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      const [articlesData, categoriesData] = await Promise.all([
        fetchArticles(supabase),
        fetchCategories(supabase)
      ])

      setArticles(articlesData)
      setCategories(categoriesData)

      // Calculate analytics
      calculateAnalytics(articlesData)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const fetchArticles = async (supabase) => {
    const { data, error } = await supabase
      .from('news_articles')
      .select(`
        *,
        category:news_categories(*)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  const fetchCategories = async (supabase) => {
    const { data, error } = await supabase
      .from('news_categories')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  }

  const calculateAnalytics = (articlesData) => {
    const now = new Date()
    let filteredArticles = articlesData

    // Filter by time range
    if (timeRange === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      filteredArticles = articlesData.filter(a => 
        a.published_at && new Date(a.published_at) > oneWeekAgo
      )
    } else if (timeRange === 'month') {
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      filteredArticles = articlesData.filter(a => 
        a.published_at && new Date(a.published_at) > oneMonthAgo
      )
    } else if (timeRange === 'year') {
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      filteredArticles = articlesData.filter(a => 
        a.published_at && new Date(a.published_at) > oneYearAgo
      )
    }

    // Basic stats
    const featuredArticles = articlesData.filter(a => a.is_featured)
    const videoArticles = articlesData.filter(a => a.is_video)
    const breakingNews = articlesData.filter(a => a.is_breaking)
    const recentArticles = articlesData
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)

    // Comment and like analytics
    const totalComments = articlesData.reduce((sum, article) => sum + (article.comments_count || 0), 0)
    const totalLikes = articlesData.reduce((sum, article) => sum + (article.likes_count || 0), 0)
    const averageComments = articlesData.length > 0 ? Math.round(totalComments / articlesData.length) : 0
    const averageLikes = articlesData.length > 0 ? Math.round(totalLikes / articlesData.length) : 0

    // Trending articles (most views + likes + comments in last week)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const trendingArticles = articlesData
      .filter(a => a.published_at && new Date(a.published_at) > oneWeekAgo)
      .sort((a, b) => {
        const aScore = (a.views_count || 0) + (a.likes_count || 0) * 2 + (a.comments_count || 0) * 3
        const bScore = (b.views_count || 0) + (b.likes_count || 0) * 2 + (b.comments_count || 0) * 3
        return bScore - aScore
      })
      .slice(0, 3)

    // Most commented articles
    const mostCommentedArticles = [...articlesData]
      .sort((a, b) => (b.comments_count || 0) - (a.comments_count || 0))
      .slice(0, 3)

    // Most liked articles
    const mostLikedArticles = [...articlesData]
      .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
      .slice(0, 3)

    setStats({
      totalArticles: articlesData.length,
      totalCategories: categories.length,
      featuredArticles: featuredArticles.length,
      videoArticles: videoArticles.length,
      breakingNews: breakingNews.length,
      recentArticles,
      totalComments,
      totalLikes,
      averageComments,
      averageLikes,
      trendingArticles,
      mostCommentedArticles,
      mostLikedArticles
    })
  }

  const filterArticles = () => {
    let filtered = [...articles]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.subtitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.content?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article =>
        article.category_id === selectedCategory
      )
    }

    setFilteredArticles(filtered)
    setCurrentPage(1)
  }

  const handleDeleteArticle = async (id) => {
    if (!confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('news_articles')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Article deleted successfully')
      loadData() // Reload data
    } catch (error) {
      console.error('Error deleting article:', error)
      toast.error('Failed to delete article')
    }
  }

  const handlePublishToggle = async (article) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('news_articles')
        .update({
          published_at: article.published_at ? null : new Date().toISOString()
        })
        .eq('id', article.id)

      if (error) throw error

      toast.success(article.published_at ? 'Article unpublished' : 'Article published')
      loadData()
    } catch (error) {
      console.error('Error toggling publish status:', error)
      toast.error('Failed to update article')
    }
  }

  const handleFeaturedToggle = async (article) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('news_articles')
        .update({
          is_featured: !article.is_featured
        })
        .eq('id', article.id)

      if (error) throw error

      toast.success(article.is_featured ? 'Removed from featured' : 'Added to featured')
      loadData()
    } catch (error) {
      console.error('Error toggling featured status:', error)
      toast.error('Failed to update article')
    }
  }

  // Calculate engagement rate
  const calculateEngagementRate = (article) => {
    const views = article.views_count || 0
    const totalInteractions = (article.likes_count || 0) + (article.comments_count || 0)
    return views > 0 ? ((totalInteractions / views) * 100).toFixed(1) : 0
  }

  // Pagination calculations
  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentArticles = filteredArticles.slice(startIndex, endIndex)

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
      
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Welcome back, {user?.user_metadata?.full_name || 'Admin'}!
            </h1>
            <p className="text-blue-100">
              Track your content performance and audience engagement.
            </p>
          </div>
          <button
            onClick={loadData}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            title="Refresh data"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {/* Analytics Time Filter */}
      <div className="bg-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Analytics Time Range</h3>
          <div className="flex gap-2">
            {['week', 'month', 'year', 'all'].map((range) => (
              <button
                key={range}
                onClick={() => {
                  setTimeRange(range)
                  calculateAnalytics(articles)
                }}
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

      {/* Stats Grid - Enhanced with Comments and Likes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Articles</p>
              <p className="text-3xl font-bold mt-2">{stats.totalArticles}</p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <FileText className="text-blue-400" size={24} />
            </div>
          </div>
          <Link 
            href="/admin/dashboard/articles" 
            className="text-blue-400 text-sm hover:text-blue-300 mt-4 inline-block"
          >
            View all →
          </Link>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Comments</p>
              <p className="text-3xl font-bold mt-2">{stats.totalComments.toLocaleString()}</p>
              <p className="text-sm text-green-400 mt-1">
                Avg: {stats.averageComments} per article
              </p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-lg">
              <MessageCircle className="text-green-400" size={24} />
            </div>
          </div>
          <Link 
            href="/admin/dashboard/comments" 
            className="text-green-400 text-sm hover:text-green-300 mt-4 inline-block"
          >
            Manage comments →
          </Link>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Likes</p>
              <p className="text-3xl font-bold mt-2">{stats.totalLikes.toLocaleString()}</p>
              <p className="text-sm text-red-400 mt-1">
                Avg: {stats.averageLikes} per article
              </p>
            </div>
            <div className="p-3 bg-red-500/20 rounded-lg">
              <Heart className="text-red-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Engagement Rate</p>
              <p className="text-3xl font-bold mt-2">
                {stats.totalArticles > 0 
                  ? ((stats.totalLikes + stats.totalComments) / stats.totalArticles).toFixed(1)
                  : '0.0'
                }
              </p>
              <p className="text-sm text-purple-400 mt-1">
                Total interactions per article
              </p>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <TrendingUpIcon className="text-purple-400" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Performance Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trending Articles */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">🔥 Trending Now</h3>
            <span className="text-sm text-gray-400">Last 7 days</span>
          </div>
          <div className="space-y-4">
            {stats.trendingArticles.length > 0 ? (
              stats.trendingArticles.map((article, index) => (
                <Link 
                  key={article.id}
                  href={`/admin/dashboard/articles/${article.id}/edit`}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-xl font-bold text-gray-400">#{index + 1}</div>
                    <div>
                      <div className="font-medium group-hover:text-gray-300 transition-colors">
                        {article.title}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                        <div className="flex items-center gap-1">
                          <Eye size={12} />
                          <span>{article.views_count?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart size={12} />
                          <span>{article.likes_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle size={12} />
                          <span>{article.comments_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    {calculateEngagementRate(article)}% engagement
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-6 text-gray-400">
                No trending articles in the selected time range
              </div>
            )}
          </div>
        </div>

        {/* Most Engaged Content */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">📊 Most Engaged Content</h3>
            <div className="flex gap-2">
              <button className="text-sm px-3 py-1 bg-blue-600/20 text-blue-400 rounded">
                Comments
              </button>
              <button className="text-sm px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600">
                Likes
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {stats.mostCommentedArticles.length > 0 ? (
              stats.mostCommentedArticles.map((article, index) => (
                <Link 
                  key={article.id}
                  href={`/admin/dashboard/articles/${article.id}/edit`}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{article.title}</div>
                      <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <MessageCircle size={12} />
                          {article.comments_count || 0} comments
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart size={12} />
                          {article.likes_count || 0} likes
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      {article.views_count?.toLocaleString() || 0} views
                    </div>
                    <div className="text-xs text-gray-400">
                      {calculateEngagementRate(article)}% engagement
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-6 text-gray-400">
                No engagement data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Articles Management Section */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Articles Management</h2>
            <p className="text-gray-400">Quickly manage your articles from the dashboard</p>
          </div>
          <Link
            href="/admin/dashboard/articles/new"
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 px-4 py-2 rounded-lg font-semibold transition-opacity"
          >
            <Plus size={20} />
            New Article
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search Articles
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title, content..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Filter by Category
              </label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 appearance-none"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sort by Engagement
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const sorted = [...filteredArticles].sort((a, b) => 
                      (b.comments_count || 0) - (a.comments_count || 0)
                    )
                    setFilteredArticles(sorted)
                  }}
                  className="px-4 py-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-colors"
                >
                  Most Comments
                </button>
                <button
                  onClick={() => {
                    const sorted = [...filteredArticles].sort((a, b) => 
                      (b.likes_count || 0) - (a.likes_count || 0)
                    )
                    setFilteredArticles(sorted)
                  }}
                  className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
                >
                  Most Likes
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Articles Table with Engagement Metrics */}
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left p-4">Title</th>
                  <th className="text-left p-4">Category</th>
                  <th className="text-left p-4">Engagement</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Published</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentArticles.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-400">
                      {searchTerm || selectedCategory !== 'all' 
                        ? 'No articles match your filters' 
                        : 'No articles found. Create your first article!'}
                    </td>
                  </tr>
                ) : (
                  currentArticles.map((article) => (
                    <tr key={article.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {article.is_video && <Video size={16} className="text-blue-400" />}
                          {article.is_featured && <Star size={16} className="text-yellow-400" fill="currentColor" />}
                          <div>
                            <div className="font-medium truncate max-w-xs">{article.title}</div>
                            <div className="text-sm text-gray-400 truncate max-w-xs">
                              {article.subtitle || 'No subtitle'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {article.category ? (
                          <span 
                            className="px-3 py-1 rounded-full text-xs font-semibold"
                            style={{ 
                              backgroundColor: `${article.category.color}20`,
                              color: article.category.color
                            }}
                          >
                            {article.category.name}
                          </span>
                        ) : (
                          <span className="text-gray-500">Uncategorized</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3 text-sm">
                            <div className="flex items-center gap-1">
                              <Eye size={12} className="text-gray-400" />
                              <span>{article.views_count?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart size={12} className="text-red-400" />
                              <span>{article.likes_count || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle size={12} className="text-green-400" />
                              <span>{article.comments_count || 0}</span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">
                            Engagement: {calculateEngagementRate(article)}%
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {article.is_breaking && (
                            <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">Breaking</span>
                          )}
                          {article.is_live && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">Live</span>
                          )}
                          {!article.published_at && (
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded">Draft</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-gray-300">
                            {article.published_at 
                              ? new Date(article.published_at).toLocaleDateString()
                              : 'Not published'
                            }
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleFeaturedToggle(article)}
                            className={`p-2 rounded ${
                              article.is_featured 
                                ? 'bg-yellow-500/20 text-yellow-400' 
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                            title={article.is_featured ? 'Remove from featured' : 'Add to featured'}
                          >
                            <Star size={16} />
                          </button>
                          
                          <button
                            onClick={() => handlePublishToggle(article)}
                            className={`p-2 rounded ${
                              article.published_at 
                                ? 'bg-red-500/20 text-red-400' 
                                : 'bg-green-500/20 text-green-400'
                            } hover:opacity-80`}
                            title={article.published_at ? 'Unpublish' : 'Publish'}
                          >
                            {article.published_at ? 'Unpublish' : 'Publish'}
                          </button>
                          
                          <Link
                            href={`/admin/dashboard/articles/${article.id}/edit`}
                            className="p-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </Link>
                          
                          <Link
                            href={`/article/${article.slug}`}
                            target="_blank"
                            className="p-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
                            title="View"
                          >
                            <Eye size={16} />
                          </Link>
                          
                          <button
                            onClick={() => handleDeleteArticle(article.id)}
                            className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredArticles.length)} of {filteredArticles.length} articles
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
                >
                  <ChevronLeft size={20} />
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-lg ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Analytics Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">Quick Analytics</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/admin/dashboard/analytics/comments"
              className="p-4 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 rounded-lg transition-colors text-center"
            >
              <MessageCircle className="mx-auto mb-2 text-green-400" size={24} />
              <span>Comments Analytics</span>
            </Link>
            <Link
              href="/admin/dashboard/analytics/likes"
              className="p-4 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-lg transition-colors text-center"
            >
              <Heart className="mx-auto mb-2 text-red-400" size={24} />
              <span>Likes Analytics</span>
            </Link>
            <Link
              href="/admin/dashboard/analytics/trending"
              className="p-4 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 rounded-lg transition-colors text-center"
            >
              <TrendingUpIcon className="mx-auto mb-2 text-blue-400" size={24} />
              <span>Trending Content</span>
            </Link>
            <Link
              href="/admin/dashboard/analytics/reports"
              className="p-4 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 rounded-lg transition-colors text-center"
            >
              <BarChart2 className="mx-auto mb-2 text-purple-400" size={24} />
              <span>Full Reports</span>
            </Link>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">Performance Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Heart className="text-red-400" size={20} />
                <span>Top Performing Article</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">
                  {stats.mostLikedArticles[0]?.title || 'No articles'}
                </div>
                <div className="text-sm text-gray-400">
                  {stats.mostLikedArticles[0]?.likes_count || 0} likes
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MessageCircle className="text-green-400" size={20} />
                <span>Most Discussed Article</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">
                  {stats.mostCommentedArticles[0]?.title || 'No articles'}
                </div>
                <div className="text-sm text-gray-400">
                  {stats.mostCommentedArticles[0]?.comments_count || 0} comments
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Eye className="text-blue-400" size={20} />
                <span>Highest Engagement</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">
                  {stats.trendingArticles[0]?.title || 'No articles'}
                </div>
                <div className="text-sm text-gray-400">
                  {calculateEngagementRate(stats.trendingArticles[0] || {})}% rate
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}