'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../../lib/supabase/client'
import { getCurrentUser } from '../../../lib/supabase/auth'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Video, 
  Star, 
  Search,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'

export default function ArticlesPage() {
  const [articles, setArticles] = useState([])
  const [filteredArticles, setFilteredArticles] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const router = useRouter()

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  useEffect(() => {
    filterArticles()
  }, [searchTerm, selectedCategory, articles])

  const checkAuthAndLoadData = async () => {
    try {
      const user = await getCurrentUser()
      if (!user) {
        router.push('/admin/login')
        return
      }
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
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load articles')
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
    setCurrentPage(1) // Reset to first page when filters change
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
      loadData() // Reload articles
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
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Articles</h1>
          <p className="text-gray-400">Manage all news articles</p>
        </div>
        <Link
          href="/admin/dashboard/articles/new"
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 px-4 py-2 rounded-lg font-semibold transition-opacity"
        >
          <Plus size={20} />
          New Article
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Total Articles</p>
          <p className="text-2xl font-bold mt-1">{articles.length}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Published</p>
          <p className="text-2xl font-bold mt-1">
            {articles.filter(a => a.published_at).length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Featured</p>
          <p className="text-2xl font-bold mt-1">
            {articles.filter(a => a.is_featured).length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Drafts</p>
          <p className="text-2xl font-bold mt-1">
            {articles.filter(a => !a.published_at).length}
          </p>
        </div>
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
              Status
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  // Filter for published articles
                  const publishedArticles = articles.filter(a => a.published_at)
                  setFilteredArticles(publishedArticles)
                }}
                className="px-4 py-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-colors"
              >
                Published
              </button>
              <button
                onClick={() => {
                  // Filter for drafts
                  const draftArticles = articles.filter(a => !a.published_at)
                  setFilteredArticles(draftArticles)
                }}
                className="px-4 py-2 bg-yellow-600/20 text-yellow-400 rounded-lg hover:bg-yellow-600/30 transition-colors"
              >
                Drafts
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Articles Table */}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="text-left p-4">Title</th>
                <th className="text-left p-4">Category</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Published</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentArticles.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400">
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
  )
}