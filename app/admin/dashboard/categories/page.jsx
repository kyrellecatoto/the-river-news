'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../../lib/supabase/client'
import { getCurrentUser } from '../../../lib/supabase/auth'
import {
  Folder,
  Plus,
  Edit,
  Trash2,
  Palette,
  Eye,
  Search,
  Hash,
  Calendar,
  AlertCircle
} from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'

export default function CategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState([])
  const [filteredCategories, setFilteredCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#667eea',
    slug: ''
  })
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [articleCounts, setArticleCounts] = useState({})

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  useEffect(() => {
    filterCategories()
  }, [searchTerm, categories])

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
      
      // Fetch categories
      const { data: categoriesData, error } = await supabase
        .from('news_categories')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setCategories(categoriesData || [])
      setFilteredCategories(categoriesData || [])

      // Fetch article counts for each category
      const { data: articlesData } = await supabase
        .from('news_articles')
        .select('category_id')

      const counts = {}
      articlesData?.forEach(article => {
        if (article.category_id) {
          counts[article.category_id] = (counts[article.category_id] || 0) + 1
        }
      })

      setArticleCounts(counts)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const filterCategories = () => {
    let filtered = [...categories]

    if (searchTerm) {
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredCategories(filtered)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Category name is required')
      return
    }

    if (!formData.color) {
      toast.error('Please select a color')
      return
    }

    try {
      const supabase = createClient()
      
      const slug = formData.slug || formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      if (editingId) {
        // Update existing category
        const { error } = await supabase
          .from('news_categories')
          .update({
            name: formData.name.trim(),
            description: formData.description?.trim() || null,
            color: formData.color,
            slug: slug,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId)

        if (error) throw error
        
        toast.success('Category updated successfully')
      } else {
        // Create new category
        const { error } = await supabase
          .from('news_categories')
          .insert([{
            name: formData.name.trim(),
            description: formData.description?.trim() || null,
            color: formData.color,
            slug: slug,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])

        if (error) throw error
        
        toast.success('Category created successfully')
      }

      // Reset form and reload data
      resetForm()
      loadData()
    } catch (error) {
      console.error('Error saving category:', error)
      toast.error(`Failed to save category: ${error.message}`)
    }
  }

  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color,
      slug: category.slug
    })
    setEditingId(category.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    // Check if category has articles
    if (articleCounts[id] > 0) {
      toast.error('Cannot delete category with articles. Remove articles first.')
      return
    }

    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('news_categories')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Category deleted successfully')
      loadData()
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Failed to delete category')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#667eea',
      slug: ''
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleColorChange = (color) => {
    setFormData(prev => ({ ...prev, color }))
  }

  const predefinedColors = [
    '#667eea', '#764ba2', '#f56565', '#ed8936', '#ecc94b', 
    '#48bb78', '#38b2ac', '#4299e1', '#9f7aea', '#ed64a6'
  ]

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
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-gray-400">Manage article categories and organization</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 px-4 py-2 rounded-lg font-semibold transition-opacity"
        >
          <Plus size={20} />
          {showForm ? 'Cancel' : 'New Category'}
        </button>
      </div>

      {/* Category Form */}
      {showForm && (
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">
            {editingId ? 'Edit Category' : 'Create New Category'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Enter category name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Slug (Optional)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="category-slug"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Leave empty to auto-generate from name
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="Brief description of this category"
                rows="3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category Color *
              </label>
              
              {/* Color Picker */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-16 h-16 cursor-pointer rounded-lg border-2 border-gray-700"
                  />
                  <div className="absolute inset-0 rounded-lg border-2 border-white pointer-events-none"></div>
                </div>
                
                <div className="text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: formData.color }}
                    ></div>
                    <span className="font-mono">{formData.color}</span>
                  </div>
                  <p className="text-gray-400">Click to pick custom color</p>
                </div>
              </div>

              {/* Predefined Colors */}
              <div>
                <p className="text-sm text-gray-300 mb-2">Quick Colors:</p>
                <div className="flex flex-wrap gap-2">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleColorChange(color)}
                      className={`w-8 h-8 rounded-lg border-2 transition-transform ${
                        formData.color === color 
                          ? 'border-white scale-110' 
                          : 'border-gray-700 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 px-6 py-3 rounded-lg font-semibold transition-opacity"
              >
                {editingId ? 'Update Category' : 'Create Category'}
              </button>
              
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="bg-gray-800 rounded-xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search categories..."
            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Categories Grid */}
      {filteredCategories.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-12 text-center">
          <Folder className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-xl font-bold mb-2">No categories found</h3>
          <p className="text-gray-400 mb-6">
            {searchTerm 
              ? 'No categories match your search'
              : 'Create your first category to organize articles'
            }
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 px-6 py-3 rounded-lg font-semibold transition-opacity"
            >
              <Plus size={20} />
              Create First Category
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <div 
              key={category.id} 
              className="bg-gray-800 rounded-xl p-6 border-2 border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <Folder 
                      size={24} 
                      style={{ color: category.color }}
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{category.name}</h3>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>



              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Eye size={14} className="text-gray-400" />
                    <span>{articleCounts[category.id] || 0} articles</span>
                  </div>

                </div>
                
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span className="text-gray-400">Color</span>
                </div>
              </div>



              <Link
                href={`/admin/dashboard/articles?category=${category.id}`}
                className="block mt-4 text-center px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                View Articles →
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4">Category Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{categories.length}</div>
            <div className="text-sm text-gray-400">Total Categories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {Object.values(articleCounts).reduce((a, b) => a + b, 0)}
            </div>
            <div className="text-sm text-gray-400">Total Articles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {Object.values(articleCounts).filter(count => count > 0).length}
            </div>
            <div className="text-sm text-gray-400">Active Categories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {categories.length > 0 
                ? Math.round(Object.values(articleCounts).reduce((a, b) => a + b, 0) / categories.length)
                : 0
              }
            </div>
            <div className="text-sm text-gray-400">Avg Articles per Category</div>
          </div>
        </div>
      </div>
    </div>
  )
}