'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../../../../lib/supabase/client'
import { getCurrentUser } from '../../../../../lib/supabase/auth'
import { uploadImage, uploadAndOptimizeImage, deleteImage, getStorageUrl } from '../../../../../lib/supabase/storage'
import { 
  ArrowLeft,
  Save,
  Star,
  Upload,
  X,
  Eye,
  Calendar,
  Clock,
  User,
  Tag,
  Image as ImageIcon,
  Loader2,
  Type
} from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'

export default function EditArticlePage() {
  const router = useRouter()
  const params = useParams()
  const articleId = params.id
  const isNew = articleId === 'new'

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    content: '',
    category_id: '',
    cover_image_url: '',
    cover_image_caption: '', // ADDED: Cover image caption field
    is_featured: false,
    is_video: false,
    video_url: '',
    video_duration: 0,
    is_live: false,
    is_breaking: false,
    author_name: '',
    author_image_url: '',
    read_time_minutes: 5,
    published_at: null
  })
  
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [previewImage, setPreviewImage] = useState('')
  const [authorImage, setAuthorImage] = useState('')

  useEffect(() => {
    checkAuthAndLoadData()
  }, [articleId])

  const checkAuthAndLoadData = async () => {
    try {
      const user = await getCurrentUser()
      if (!user) {
        router.push('/admin/login')
        return
      }
      
      await loadCategories()
      
      if (!isNew) {
        await loadArticle()
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error('Error:', error)
      router.push('/admin/login')
    }
  }

  const loadCategories = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('news_categories')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error loading categories:', error)
      toast.error('Failed to load categories')
      return []
    }
    setCategories(data || [])
  }

  const loadArticle = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('news_articles')
        .select(`
          *,
          category:news_categories(*)
        `)
        .eq('id', articleId)
        .single()

      if (error) {
        console.error('Error loading article:', error)
        toast.error('Article not found')
        router.push('/admin/dashboard/articles')
        return
      }

      setFormData({
        title: data.title || '',
        subtitle: data.subtitle || '',
        content: data.content || '',
        category_id: data.category_id || '',
        cover_image_url: data.cover_image_url || '',
        cover_image_caption: data.cover_image_caption || '', // ADDED: Load caption
        is_featured: data.is_featured || false,
        is_video: data.is_video || false,
        video_url: data.video_url || '',
        video_duration: data.video_duration || 0,
        is_live: data.is_live || false,
        is_breaking: data.is_breaking || false,
        author_name: data.author_name || '',
        author_image_url: data.author_image_url || '',
        read_time_minutes: data.read_time_minutes || 5,
        published_at: data.published_at || null
      })

      // Set preview images
      if (data.cover_image_url) {
        setPreviewImage(getStorageUrl(data.cover_image_url) || data.cover_image_url)
      }
      if (data.author_image_url) {
        setAuthorImage(getStorageUrl(data.author_image_url) || data.author_image_url)
      }
    } catch (error) {
      console.error('Error loading article:', error)
      toast.error('Failed to load article')
      router.push('/admin/dashboard/articles')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e, type = 'cover') => {
    const file = e.target.files[0]
    if (!file) return

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB')
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPEG, PNG, WebP)')
      return
    }

    setUploadingImage(true)

    try {
      let uploadResult
      
      if (type === 'cover') {
        // Optimize and upload cover image
        uploadResult = await uploadAndOptimizeImage(file, {
          maxWidth: 1200,
          maxHeight: 630,
          quality: 0.8,
          fileName: `cover-${Date.now()}`
        })
      } else {
        // Optimize and upload author image (smaller)
        uploadResult = await uploadAndOptimizeImage(file, {
          maxWidth: 400,
          maxHeight: 400,
          quality: 0.7,
          fileName: `author-${Date.now()}`
        })
      }

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed')
      }

      if (type === 'cover') {
        // Delete old cover image if exists
        if (formData.cover_image_url && formData.cover_image_url.startsWith('article-images/')) {
          await deleteImage(formData.cover_image_url)
        }
        
        setFormData({
          ...formData,
          cover_image_url: uploadResult.path,
          cover_image_caption: formData.cover_image_caption || '' // Keep existing caption
        })
        setPreviewImage(uploadResult.url)
        toast.success('Cover image uploaded successfully')
      } else {
        // Delete old author image if exists
        if (formData.author_image_url && formData.author_image_url.startsWith('article-images/')) {
          await deleteImage(formData.author_image_url)
        }
        
        setFormData({
          ...formData,
          author_image_url: uploadResult.path
        })
        setAuthorImage(uploadResult.url)
        toast.success('Author image uploaded successfully')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error(`Upload failed: ${error.message}`)
    } finally {
      setUploadingImage(false)
      // Reset file input
      e.target.value = ''
    }
  }

  const removeImage = async (type = 'cover') => {
    if (type === 'cover') {
      if (formData.cover_image_url && formData.cover_image_url.startsWith('article-images/')) {
        try {
          await deleteImage(formData.cover_image_url)
        } catch (error) {
          console.error('Error deleting cover image:', error)
        }
      }
      setFormData({ 
        ...formData, 
        cover_image_url: '',
        cover_image_caption: '' // Clear caption when removing image
      })
      setPreviewImage('')
      toast.success('Cover image removed')
    } else {
      if (formData.author_image_url && formData.author_image_url.startsWith('article-images/')) {
        try {
          await deleteImage(formData.author_image_url)
        } catch (error) {
          console.error('Error deleting author image:', error)
        }
      }
      setFormData({ ...formData, author_image_url: '' })
      setAuthorImage('')
      toast.success('Author image removed')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.title.trim()) {
      toast.error('Title is required')
      return
    }
    
    if (!formData.content.trim()) {
      toast.error('Content is required')
      return
    }

    setSaving(true)

    try {
      const supabase = createClient()
      
      // Generate slug from title
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

      // Prepare article data
      const articleData = {
        title: formData.title.trim(),
        subtitle: formData.subtitle?.trim() || null,
        content: formData.content.trim(),
        category_id: formData.category_id || null,
        cover_image_url: formData.cover_image_url || null,
        cover_image_caption: formData.cover_image_caption?.trim() || null, // ADDED: Include caption
        is_featured: formData.is_featured || false,
        is_video: formData.is_video || false,
        video_url: formData.video_url?.trim() || null,
        video_duration: formData.video_duration || null,
        is_live: formData.is_live || false,
        is_breaking: formData.is_breaking || false,
        author_name: formData.author_name?.trim() || null,
        author_image_url: formData.author_image_url || null,
        read_time_minutes: formData.read_time_minutes || 5,
        published_at: formData.published_at || null,
        slug: slug,
        updated_at: new Date().toISOString()
      }

      let result
      if (isNew) {
        // Create new article
        articleData.created_at = new Date().toISOString()
        
        const { data, error } = await supabase
          .from('news_articles')
          .insert([articleData])
          .select()

        if (error) {
          console.error('Error creating article:', error)
          toast.error(`Failed to create article: ${error.message}`)
          return
        }
        
        if (data && data.length > 0) {
          result = data[0]
        }
        
        toast.success('Article created successfully!')
      } else {
        // Update existing article
        const { data, error } = await supabase
          .from('news_articles')
          .update(articleData)
          .eq('id', articleId)
          .select()

        if (error) {
          console.error('Error updating article:', error)
          toast.error(`Failed to update article: ${error.message}`)
          return
        }
        
        if (data && data.length > 0) {
          result = data[0]
        }
        
        toast.success('Article updated successfully!')
      }

      // Redirect to articles list after a short delay
      setTimeout(() => {
        router.push('/admin/dashboard/articles')
      }, 1500)

    } catch (error) {
      console.error('Error saving article:', error)
      toast.error(error.message || 'Failed to save article')
    } finally {
      setSaving(false)
    }
  }

  const handlePublishNow = () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a title before publishing')
      return
    }
    
    if (!formData.content.trim()) {
      toast.error('Please enter content before publishing')
      return
    }
    
    setFormData({
      ...formData,
      published_at: new Date().toISOString()
    })
    toast.success('Article will be published when saved')
  }

  const handleSaveDraft = () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a title before saving')
      return
    }
    
    if (!formData.content.trim()) {
      toast.error('Please enter content before saving')
      return
    }
    
    setFormData({
      ...formData,
      published_at: null
    })
    toast.success('Article will be saved as draft')
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCategoryChange = (value) => {
    setFormData(prev => ({
      ...prev,
      category_id: value || null
    }))
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/dashboard/articles"
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              {isNew ? 'Create New Article' : 'Edit Article'}
            </h1>
            <p className="text-gray-400">
              {isNew ? 'Add a new article to your website' : 'Edit existing article'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving || !formData.title.trim()}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={handlePublishNow}
            disabled={saving || !formData.title.trim() || !formData.content.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            Publish Now
          </button>
          <button
            type="submit"
            form="article-form"
            disabled={saving || !formData.title.trim() || !formData.content.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Saving...
              </>
            ) : (
              <>
                <Save size={20} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      <form id="article-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Enter article title"
                required
              />
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Subtitle
              </label>
              <textarea
                value={formData.subtitle}
                onChange={(e) => handleChange('subtitle', e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Brief description of the article"
                rows="3"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Content *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => handleChange('content', e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                placeholder="Write your article content here..."
                rows="15"
                required
              />
              <p className="mt-2 text-sm text-gray-400">
                Supports basic HTML. Use paragraphs for better formatting.
              </p>
            </div>
          </div>

          {/* Right Column - Settings */}
          <div className="space-y-6">
            {/* Cover Image with Caption - UPDATED SECTION */}
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ImageIcon size={16} className="text-gray-400" />
                  <label className="block text-sm font-medium text-gray-300">
                    Featured Image
                  </label>
                </div>
                {previewImage && (
                  <button
                    type="button"
                    onClick={() => removeImage('cover')}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                )}
              </div>
              
              {previewImage ? (
                <div className="mb-4">
                  <div className="relative mb-3 group">
                    <img
                      src={previewImage}
                      alt="Cover preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removeImage('cover')}
                        className="p-2 bg-red-600 text-white rounded-full"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Image Caption Input */}
                  <div className="mt-3">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                      <Type size={16} className="text-gray-400" />
                      Image Caption (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.cover_image_caption || ''}
                      onChange={(e) => handleChange('cover_image_caption', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter a caption for this image"
                      maxLength="200"
                    />
                    <div className="flex justify-between mt-1">
                      <p className="text-xs text-gray-400">
                        Appears below the image in the article
                      </p>
                      <p className="text-xs text-gray-400">
                        {formData.cover_image_caption?.length || 0}/200 characters
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center mb-4">
                  <ImageIcon className="mx-auto mb-2 text-gray-400" size={32} />
                  <p className="text-sm text-gray-400">No cover image selected</p>
                  <p className="text-xs text-gray-500 mt-1">Add a caption after uploading an image</p>
                </div>
              )}

              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'cover')}
                  className="hidden"
                  id="cover-image-upload"
                  disabled={uploadingImage}
                />
                <label
                  htmlFor="cover-image-upload"
                  className={`w-full px-4 py-2 rounded-lg text-center cursor-pointer transition-colors flex items-center justify-center gap-2 ${
                    uploadingImage
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      {previewImage ? 'Change Cover' : 'Upload Cover'}
                    </>
                  )}
                </label>
              </label>
              
              <p className="mt-2 text-xs text-gray-400">
                Recommended: 1200×630px, max 10MB
              </p>
            </div>

            {/* Author Section */}
            <div className="bg-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-300">
                  <User className="inline mr-2" size={16} />
                  Author Details
                </label>
                {authorImage && (
                  <button
                    type="button"
                    onClick={() => removeImage('author')}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove Photo
                  </button>
                )}
              </div>

              {/* Author Image */}
              {authorImage ? (
                <div className="relative mb-4 group">
                  <img
                    src={authorImage}
                    alt="Author"
                    className="w-20 h-20 object-cover rounded-full mx-auto"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => removeImage('author')}
                      className="p-1 bg-red-600 text-white rounded-full"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-20 h-20 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <User className="text-gray-400" size={24} />
                </div>
              )}

              <label className="block mb-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'author')}
                  className="hidden"
                  id="author-image-upload"
                  disabled={uploadingImage}
                />
                <label
                  htmlFor="author-image-upload"
                  className={`w-full px-4 py-2 rounded-lg text-center cursor-pointer transition-colors flex items-center justify-center gap-2 text-xs ${
                    uploadingImage
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 className="animate-spin" size={12} />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={12} />
                      Upload Author Photo
                    </>
                  )}
                </label>
              </label>

              <input
                type="text"
                value={formData.author_name || ''}
                onChange={(e) => handleChange('author_name', e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 mb-3"
                placeholder="Author name"
              />
              
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Clock className="inline mr-2" size={16} />
                Read Time (minutes)
              </label>
              <input
                type="number"
                value={formData.read_time_minutes || 5}
                onChange={(e) => handleChange('read_time_minutes', parseInt(e.target.value) || 5)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                min="1"
                max="60"
              />
            </div>

            {/* Category */}
            <div className="bg-gray-800 rounded-xl p-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Tag className="inline mr-2" size={16} />
                Category
              </label>
              <select
                value={formData.category_id || ''}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Toggles */}
            <div className="bg-gray-800 rounded-xl p-4">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Status & Features
              </label>
              
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-gray-300">Featured Article</span>
                  <input
                    type="checkbox"
                    checked={formData.is_featured || false}
                    onChange={(e) => handleChange('is_featured', e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-gray-300">Video Content</span>
                  <input
                    type="checkbox"
                    checked={formData.is_video || false}
                    onChange={(e) => handleChange('is_video', e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                  />
                </label>

                {formData.is_video && (
                  <div className="ml-4 space-y-2">
                    <input
                      type="url"
                      value={formData.video_url || ''}
                      onChange={(e) => handleChange('video_url', e.target.value)}
                      className="w-full px-3 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                      placeholder="Video URL (YouTube, Vimeo, etc.)"
                    />
                    <input
                      type="number"
                      value={formData.video_duration || ''}
                      onChange={(e) => handleChange('video_duration', parseInt(e.target.value) || null)}
                      className="w-full px-3 py-1 bg-gray-900 border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                      placeholder="Duration (seconds)"
                    />
                  </div>
                )}

                <label className="flex items-center justify-between">
                  <span className="text-gray-300">Breaking News</span>
                  <input
                    type="checkbox"
                    checked={formData.is_breaking || false}
                    onChange={(e) => handleChange('is_breaking', e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-gray-300">Live Coverage</span>
                  <input
                    type="checkbox"
                    checked={formData.is_live || false}
                    onChange={(e) => handleChange('is_live', e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>

            {/* Publish Date */}
            <div className="bg-gray-800 rounded-xl p-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Calendar className="inline mr-2" size={16} />
                Publish Schedule
              </label>
              <input
                type="datetime-local"
                value={formData.published_at ? new Date(formData.published_at).toISOString().slice(0, 16) : ''}
                onChange={(e) => {
                  const dateValue = e.target.value
                  handleChange('published_at', dateValue ? new Date(dateValue).toISOString() : null)
                }}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
              <p className="mt-2 text-xs text-gray-400">
                {formData.published_at 
                  ? `Will publish on: ${new Date(formData.published_at).toLocaleString()}`
                  : 'Leave empty to save as draft'
                }
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}