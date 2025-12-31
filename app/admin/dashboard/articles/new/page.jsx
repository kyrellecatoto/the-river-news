'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAllCategories } from '../../../../lib/supabase/queries'
import { createArticle } from '../../../../actions/article'
import { toast, Toaster } from 'react-hot-toast'
import { uploadImage, uploadAndOptimizeImage, deleteImage, getStorageUrl } from '../../../../lib/supabase/storage'
import { 
  Save, 
  X, 
  Image as ImageIcon,
  Star,
  Video, 
  Clock, 
  User,
  Eye,
  Zap,
  Globe,
  Calendar,
  Upload,
  Loader2,
  Type
} from 'lucide-react'
import Link from 'next/link'

export default function NewArticlePage() {
  const router = useRouter()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [previewImage, setPreviewImage] = useState('')
  const [authorImage, setAuthorImage] = useState('')
  
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    content: '',
    category_id: null,
    cover_image_url: '',
    cover_image_caption: '', // NEW FIELD
    is_featured: false,
    is_video: false,
    video_url: '',
    video_duration: 0,
    is_live: false,
    is_breaking: false,
    author_name: '',
    author_image_url: '',
    read_time_minutes: 5,
    published_at: new Date().toISOString()
  })

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    try {
      const categoriesData = await getAllCategories()
      setCategories(categoriesData)
    } catch (error) {
      console.error('Error loading categories:', error)
      toast.error('Failed to load categories')
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
        
        setFormData(prev => ({
          ...prev,
          cover_image_url: uploadResult.path,
          cover_image_caption: prev.cover_image_caption || '' // Keep existing caption or empty
        }))
        setPreviewImage(uploadResult.url)
        toast.success('Cover image uploaded successfully')
      } else {
        // Delete old author image if exists
        if (formData.author_image_url && formData.author_image_url.startsWith('article-images/')) {
          await deleteImage(formData.author_image_url)
        }
        
        setFormData(prev => ({
          ...prev,
          author_image_url: uploadResult.path
        }))
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
      setFormData(prev => ({ 
        ...prev, 
        cover_image_url: '',
        cover_image_caption: '' // Clear caption when removing image
      }))
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
      setFormData(prev => ({ ...prev, author_image_url: '' }))
      setAuthorImage('')
      toast.success('Author image removed')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Prepare data for submission
      const articleData = {
        ...formData,
        // Convert empty string category to null
        category_id: formData.category_id || null,
        // Generate slug from title
        slug: formData.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
        published_at: formData.published_at || new Date().toISOString(),
        // Ensure caption is null if empty
        cover_image_caption: formData.cover_image_caption?.trim() || null
      }

      const result = await createArticle(articleData)
      
      if (result.success) {
        toast.success('Article created successfully!')
        router.push('/admin/dashboard/articles')
      } else {
        toast.error(result.error || 'Failed to create article')
      }
    } catch (error) {
      console.error('Error creating article:', error)
      toast.error(error.message || 'Failed to create article')
    } finally {
      setLoading(false)
    }
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

  const handleCheckboxChange = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
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
    
    setFormData(prev => ({
      ...prev,
      published_at: null
    }))
    toast.success('Article will be saved as draft')
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
    
    setFormData(prev => ({
      ...prev,
      published_at: new Date().toISOString()
    }))
    toast.success('Article will be published when saved')
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Create New Article</h1>
          <p className="text-gray-400">Add a new article to your news website</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={loading || !formData.title.trim()}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            Save as Draft
          </button>
          <Link
            href="/admin/dashboard/articles"
            className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.title.trim() || !formData.content.trim()}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 px-4 py-2 rounded-lg font-semibold transition-opacity disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Creating...
              </>
            ) : (
              <>
                <Save size={20} />
                {formData.published_at ? 'Publish Article' : 'Save Article'}
              </>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Subtitle */}
            <div className="bg-gray-800 rounded-xl p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter article title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subtitle
                </label>
                <textarea
                  value={formData.subtitle}
                  onChange={(e) => handleChange('subtitle', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Brief description or subtitle"
                  rows="3"
                />
              </div>
            </div>

            {/* Content Editor */}
            <div className="bg-gray-800 rounded-xl p-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Content *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => handleChange('content', e.target.value)}
                className="w-full min-h-[400px] px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                placeholder="Write your article content here... Use Markdown for formatting."
                required
              />
              <p className="mt-2 text-sm text-gray-400">
                Supports basic formatting. Use empty lines for paragraphs.
              </p>
            </div>

            {/* Featured Image with Caption - UPDATED SECTION */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ImageIcon size={20} className="text-gray-400" />
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
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* Author Details Section */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  <label className="block text-sm font-medium text-gray-300">
                    Author Details
                  </label>
                </div>
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
                value={formData.author_name}
                onChange={(e) => handleChange('author_name', e.target.value)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 mb-3"
                placeholder="Author name"
              />
            </div>

            {/* Publish Settings */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Publish Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      Publish Date
                    </div>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.published_at ? new Date(formData.published_at).toISOString().slice(0, 16) : ''}
                    onChange={(e) => handleChange('published_at', e.target.value || new Date().toISOString())}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Leave empty for draft
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      Read Time (minutes)
                    </div>
                  </label>
                  <input
                    type="number"
                    value={formData.read_time_minutes}
                    onChange={(e) => handleChange('read_time_minutes', parseInt(e.target.value) || 5)}
                    min="1"
                    max="60"
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Categories</h3>
              <select
                value={formData.category_id || ''}
                onChange={(e) => handleCategoryChange(e.target.value || null)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">No Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Article Flags */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-4">Article Flags</h3>
              
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Star size={20} className="text-yellow-400" />
                    <span>Featured Article</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={() => handleCheckboxChange('is_featured')}
                    className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Zap size={20} className="text-red-400" />
                    <span>Breaking News</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.is_breaking}
                    onChange={() => handleCheckboxChange('is_breaking')}
                    className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Eye size={20} className="text-green-400" />
                    <span>Live Coverage</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.is_live}
                    onChange={() => handleCheckboxChange('is_live')}
                    className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>

            {/* Video Settings */}
            <div className="bg-gray-800 rounded-xl p-6">
              <label className="flex items-center justify-between mb-4 p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Video size={20} className="text-blue-400" />
                  <span>Video Content</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.is_video}
                  onChange={() => handleCheckboxChange('is_video')}
                  className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                />
              </label>

              {formData.is_video && (
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Video URL
                    </label>
                    <input
                      type="url"
                      value={formData.video_url}
                      onChange={(e) => handleChange('video_url', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Video Duration (seconds)
                    </label>
                    <input
                      type="number"
                      value={formData.video_duration}
                      onChange={(e) => handleChange('video_duration', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}