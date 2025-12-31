'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from './../../components/Navbar'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/client'
import Footer from '../../components/Footer'
import { getStorageUrl } from '../../lib/supabase/storage'
import { 
  Calendar, 
  Clock, 
  User, 
  Share2, 
  Heart, 
  MessageCircle,  
  Bookmark, 
  Image as ImageIcon,
  Send,
  ThumbsUp,
  Reply,
  Camera
} from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'

export default function ArticlePage() {
  const params = useParams()
  const router = useRouter()
  const [article, setArticle] = useState(null)
  const [latestArticles, setLatestArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [authorImageUrl, setAuthorImageUrl] = useState('')
  const [siteSettings, setSiteSettings] = useState({})
  
  // Comment states
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  const [showComments, setShowComments] = useState(true)
  const [commenterName, setCommenterName] = useState('')
  const [commenterEmail, setCommenterEmail] = useState('')

  useEffect(() => {
    fetchArticle()
    fetchLatestArticles()
    fetchSiteSettings()
  }, [params.slug])

  useEffect(() => {
    if (article) {
      if (article.cover_image_url) {
        const url = getStorageUrl(article.cover_image_url) || article.cover_image_url
        setCoverImageUrl(url)
      }
      if (article.author_image_url) {
        const url = getStorageUrl(article.author_image_url) || article.author_image_url
        setAuthorImageUrl(url)
      }
      
      loadComments()
    }
  }, [article])

  async function fetchArticle() {
    try {
      setLoading(true)
      const supabase = createClient()
      
      const { data: articleData, error } = await supabase
        .from('news_articles')
        .select(`
          *,
          category:news_categories(*)
        `)
        .eq('slug', params.slug)
        .single()

      if (error) {
        console.error('Error fetching article:', error)
        toast.error('Article not found')
        router.push('/')
        return
      }

      setArticle(articleData)
      await incrementViewCount(articleData.id)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load article')
    } finally {
      setLoading(false)
    }
  }

  async function fetchSiteSettings() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('site_settings').select('*')
      if (error) throw error
      const settings = {}
      data?.forEach((s) => { settings[s.key] = s.value })
      setSiteSettings(settings)
    } catch (error) {
      console.error('Error fetching site settings:', error)
    }
  }

  async function fetchLatestArticles() {
    try {
      const supabase = createClient()
      const { data: latestData, error } = await supabase
        .from('news_articles')
        .select(`
          *,
          category:news_categories(*)
        `)
        .order('published_at', { ascending: false })
        .limit(30) // Increased limit to ensure we have data for National/Local sections

      if (error) throw error
      setLatestArticles(latestData || [])
    } catch (error) {
      console.error('Error fetching latest articles:', error)
    }
  }

  async function loadComments() {
    if (!article) return
    try {
      const supabase = createClient()
      const { data: commentsData, error } = await supabase
        .from('article_comments')
        .select('*')
        .eq('article_id', article.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      const parentComments = commentsData?.filter(comment => !comment.parent_comment_id) || []
      const replies = commentsData?.filter(comment => comment.parent_comment_id) || []
      const commentsWithReplies = parentComments.map(comment => ({
        ...comment,
        replies: replies.filter(reply => reply.parent_comment_id === comment.id)
      }))
      setComments(commentsWithReplies)
    } catch (error) {
      console.error('Error loading comments:', error)
    }
  }

  async function incrementViewCount(articleId) {
    try {
      const supabase = createClient()
      const { data: currentArticle } = await supabase
        .from('news_articles')
        .select('views_count')
        .eq('id', articleId)
        .single()

      if (!currentArticle) return
      const { error } = await supabase
        .from('news_articles')
        .update({ views_count: (currentArticle.views_count || 0) + 1 })
        .eq('id', articleId)
      if (error) throw error
    } catch (error) {
      console.error('Error incrementing view count:', error)
    }
  }

  const handleLike = async () => {
    if (!article) return
    const newLikedState = !liked
    setLiked(newLikedState)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('news_articles')
        .update({ likes_count: (article.likes_count || 0) + (newLikedState ? 1 : -1) })
        .eq('id', article.id)
      if (error) throw error
      setArticle(prev => ({ ...prev, likes_count: (prev.likes_count || 0) + (newLikedState ? 1 : -1) }))
    } catch (error) {
      console.error('Error updating likes:', error)
      setLiked(!newLikedState)
    }
  }

  const handleCommentLike = async (commentId) => {
    try {
      const supabase = createClient()
      const { data: comment } = await supabase
        .from('article_comments')
        .select('likes_count')
        .eq('id', commentId)
        .single()
      if (!comment) return
      const { error } = await supabase
        .from('article_comments')
        .update({ likes_count: (comment.likes_count || 0) + 1 })
        .eq('id', commentId)
      if (error) throw error
      loadComments()
      toast.success('Liked!')
    } catch (error) {
      console.error('Error liking comment:', error)
      toast.error('Failed to like comment')
    }
  }

  const handleBookmark = () => {
    const bookmarks = JSON.parse(localStorage.getItem('article_bookmarks') || '[]')
    if (bookmarked) {
      const newBookmarks = bookmarks.filter(id => id !== article.id)
      localStorage.setItem('article_bookmarks', JSON.stringify(newBookmarks))
      toast.success('Removed from bookmarks')
    } else {
      bookmarks.push(article.id)
      localStorage.setItem('article_bookmarks', JSON.stringify(bookmarks))
      toast.success('Added to bookmarks')
    }
    setBookmarked(!bookmarked)
  }

  const handleShare = () => {
    if (navigator.share && article) {
      navigator.share({ title: article.title, text: article.subtitle, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  const handleArticleClick = (article) => {
    router.push(`/article/${article.slug}`)
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim()) { toast.error('Comment cannot be empty'); return }
    if (!commenterName.trim()) { toast.error('Please enter your name'); return }
    setCommentLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('article_comments')
        .insert({
          article_id: article.id,
          commenter_name: commenterName.trim(),
          commenter_email: commenterEmail.trim() || null,
          content: newComment.trim(),
          parent_comment_id: null,
          is_anonymous: true
        })
        .select()
        .single()
      if (error) throw error
      setComments(prev => [data, ...prev])
      setNewComment('')
      setArticle(prev => ({ ...prev, comments_count: (prev.comments_count || 0) + 1 }))
      toast.success('Comment added successfully!')
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Failed to add comment')
    } finally {
      setCommentLoading(false)
    }
  }

  const handleSubmitReply = async (parentCommentId) => {
    if (!replyText.trim()) { toast.error('Reply cannot be empty'); return }
    if (!commenterName.trim()) { toast.error('Please enter your name'); return }
    setCommentLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('article_comments')
        .insert({
          article_id: article.id,
          commenter_name: commenterName.trim(),
          commenter_email: commenterEmail.trim() || null,
          content: replyText.trim(),
          parent_comment_id: parentCommentId,
          is_anonymous: true
        })
        .select()
        .single()
      if (error) throw error
      setComments(prev => prev.map(comment => {
        if (comment.id === parentCommentId) {
          return { ...comment, replies: [...(comment.replies || []), data] }
        }
        return comment
      }))
      setReplyText('')
      setReplyingTo(null)
      toast.success('Reply added successfully!')
    } catch (error) {
      console.error('Error adding reply:', error)
      toast.error('Failed to add reply')
    } finally {
      setCommentLoading(false)
    }
  }

  const getImageUrl = (imagePath) => {
    return getStorageUrl(imagePath) || imagePath
  }

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    let interval = seconds / 31536000
    if (interval > 1) return Math.floor(interval) + ' years ago'
    interval = seconds / 2592000
    if (interval > 1) return Math.floor(interval) + ' months ago'
    interval = seconds / 86400
    if (interval > 1) return Math.floor(interval) + ' days ago'
    interval = seconds / 3600
    if (interval > 1) return Math.floor(interval) + ' hours ago'
    interval = seconds / 60
    if (interval > 1) return Math.floor(interval) + ' minutes ago'
    return Math.floor(seconds) + ' seconds ago'
  }

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'A'
  }

  const getAvatarColor = (name) => {
    const colors = [ 'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-teal-500' ]
    if (!name) return colors[0]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  // Helper for new split section
  const getArticlesByCategory = (categoryName) => {
    return latestArticles
      .filter(article => article.category?.name?.toLowerCase() === categoryName.toLowerCase())
      .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
      .slice(0, 4) 
  }

  const leftCategoryData = getArticlesByCategory('National')
  const rightCategoryData = getArticlesByCategory('Local')

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#667eea]"></div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <Toaster position="top-right" />
      <Navbar />

      <main className="flex-grow">
        <article className="max-w-4xl mx-auto p-4 md:p-8">
          {/* Article Header */}
          <header className="mb-8">
            {article.category && (
              <span 
                className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-4"
                style={{ 
                  backgroundColor: `${article.category.color}20`,
                  color: article.category.color
                }}
              >
                {article.category.name}
              </span>
            )}
            
            <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-8">
              <div className="flex items-center gap-2">
                {authorImageUrl ? (
                  <img 
                    src={authorImageUrl} 
                    alt={article.author_name || 'Author'} 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <User size={16} />
                )}
                <span>{article.author_name || 'Staff Writer'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>
                  {article.published_at 
                    ? new Date(article.published_at).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : 'Recently'
                  }
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>{article.read_time_minutes || 5} min read</span>
              </div>
            </div>

            {/* Article Actions */}
            <div className="flex gap-4 mb-8">
              <button 
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  liked ? 'bg-red-500/20 text-red-400' : 'bg-[#222222] text-gray-300 hover:bg-[#333333]'
                }`}
              >
                <Heart size={20} fill={liked ? 'currentColor' : 'transparent'} />
                <span>{(article.likes_count || 0) + (liked ? 1 : 0)}</span>
              </button>
              <button 
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-2 px-4 py-2 bg-[#222222] text-gray-300 rounded-lg hover:bg-[#333333] transition-colors"
              >
                <MessageCircle size={20} />
                <span>{article.comments_count || 0}</span>
              </button>
              <button 
                onClick={handleBookmark}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  bookmarked ? 'bg-yellow-500/20 text-yellow-400' : 'bg-[#222222] text-gray-300 hover:bg-[#333333]'
                }`}
              >
                <Bookmark size={20} fill={bookmarked ? 'currentColor' : 'transparent'} />
              </button>
              <button 
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-[#222222] text-gray-300 rounded-lg hover:bg-[#333333] transition-colors"
              >
                <Share2 size={20} />
                <span>Share</span>
              </button>
            </div>
          </header>

          {/* Featured Image with Caption */}
          {coverImageUrl && (
            <div className="mb-8">
              <div className="rounded-2xl overflow-hidden mb-2">
                <img
                  src={coverImageUrl}
                  alt={article.title}
                  className="w-full h-auto max-h-[500px] object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.parentElement.innerHTML = `
                      <div class="w-full h-64 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-2xl flex items-center justify-center">
                        <div class="text-center">
                          <ImageIcon class="mx-auto mb-2 text-gray-400" size={32} />
                          <p class="text-gray-300">Image unavailable</p>
                        </div>
                      </div>
                    `
                  }}
                />
              </div>
              
              {article.cover_image_caption && (
                <div className="flex items-start gap-2 text-sm text-gray-400 mt-2 px-2">
                  <Camera size={14} className="flex-shrink-0 mt-0.5" />
                  <p className="italic">{article.cover_image_caption}</p>
                </div>
              )}
            </div>
          )}

          {/* Article Content */}
          <div className="prose prose-invert prose-lg max-w-none mb-12">
            <div 
              className="text-lg leading-relaxed text-gray-300"
              dangerouslySetInnerHTML={{ __html: formatArticleContent(article.content) }}
            />
          </div>

          {/* Live Badge for Breaking News */}
          {article.is_breaking && (
            <div className="mt-8 p-4 bg-red-900/20 border border-red-800 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-bold text-red-400">BREAKING NEWS</span>
              </div>
              <p className="mt-2 text-gray-300">
                This is a developing story. Updates will be provided as more information becomes available.
              </p>
            </div>
          )}

          {/* Live Coverage Badge */}
          {article.is_live && (
            <div className="mt-8 p-4 bg-green-900/20 border border-green-800 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-bold text-green-400">LIVE COVERAGE</span>
              </div>
              <p className="mt-2 text-gray-300">
                This article is being updated in real-time with the latest developments.
              </p>
            </div>
          )}
        </article>

        {/* Comments Section */}
        <section className="max-w-4xl mx-auto p-4 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Comments ({article.comments_count || 0})</h2>
            <button 
              onClick={() => setShowComments(!showComments)}
              className="text-sm text-gray-400 hover:text-gray-300"
            >
              {showComments ? 'Hide Comments' : 'Show Comments'}
            </button>
          </div>

          {showComments && (
            <>
              {/* New Comment Form */}
              <div className="bg-[#111111] rounded-xl p-6 mb-8">
                <h3 className="text-lg font-semibold mb-4">Leave a Comment</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      value={commenterName}
                      onChange={(e) => setCommenterName(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Your Email (optional)
                    </label>
                    <input
                      type="email"
                      value={commenterEmail}
                      onChange={(e) => setCommenterEmail(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Comment *
                  </label>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts..."
                    disabled={commentLoading}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none disabled:opacity-50"
                    rows="4"
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || !commenterName.trim() || commentLoading}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 px-6 py-2 rounded-lg font-semibold transition-opacity disabled:opacity-50"
                  >
                    {commentLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                        Posting...
                      </>
                    ) : (
                      <>
                        Post Comment
                        <Send size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-6">
                {comments.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="mx-auto mb-4 text-gray-600" size={48} />
                    <h3 className="text-xl font-bold mb-2">No comments yet</h3>
                    <p className="text-gray-400">Be the first to share your thoughts!</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="bg-[#111111] rounded-xl p-4">
                      {/* Main Comment */}
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getAvatarColor(comment.commenter_name)} text-white font-bold`}>
                            {getInitial(comment.commenter_name)}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <span className="font-semibold">
                                {comment.commenter_name || 'Anonymous'}
                              </span>
                              <span className="text-xs text-gray-400 ml-2">
                                {timeAgo(comment.created_at)}
                              </span>
                            </div>
                            {comment.is_approved === false && (
                              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                                Pending Approval
                              </span>
                            )}
                          </div>
                          <p className="text-gray-300 mb-3">{comment.content}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <button
                              onClick={() => handleCommentLike(comment.id)}
                              className="flex items-center gap-1 text-gray-400 hover:text-gray-300"
                            >
                              <ThumbsUp size={16} />
                              <span>{comment.likes_count || 0}</span>
                            </button>
                            <button
                              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                              className="text-gray-400 hover:text-gray-300 flex items-center gap-1"
                            >
                              <Reply size={16} />
                              <span>Reply</span>
                            </button>
                          </div>

                          {/* Reply Form */}
                          {replyingTo === comment.id && (
                            <div className="mt-4">
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Write your reply..."
                                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm resize-none"
                                rows="2"
                              />
                              <div className="flex justify-end gap-2 mt-2">
                                <button
                                  onClick={() => setReplyingTo(null)}
                                  className="px-3 py-1 text-sm text-gray-400 hover:text-gray-300"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSubmitReply(comment.id)}
                                  disabled={!replyText.trim() || commentLoading}
                                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                  Post Reply
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Replies */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-4 pl-4 border-l-2 border-gray-800 space-y-4">
                              {comment.replies.map((reply) => (
                                <div key={reply.id} className="flex gap-3">
                                  <div className="flex-shrink-0">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getAvatarColor(reply.commenter_name)} text-white font-bold text-sm`}>
                                      {getInitial(reply.commenter_name)}
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                      <div>
                                        <span className="font-semibold text-sm">
                                          {reply.commenter_name || 'Anonymous'}
                                        </span>
                                        <span className="text-xs text-gray-400 ml-2">
                                          {timeAgo(reply.created_at)}
                                        </span>
                                      </div>
                                      {reply.is_approved === false && (
                                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                                          Pending
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-gray-300 text-sm">{reply.content}</p>
                                    <button
                                      onClick={() => handleCommentLike(reply.id)}
                                      className="flex items-center gap-1 text-xs mt-1 text-gray-400 hover:text-gray-300"
                                    >
                                      <ThumbsUp size={12} />
                                      <span>{reply.likes_count || 0}</span>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </section>

        {/* Latest Stories Section - UPDATED DESIGN (Squared corners, gap-4, text overlays) */}
        {latestArticles.length > 0 && (
          <section className="max-w-[1400px] mx-auto p-4 md:p-8 mt-16 border-t border-[#222222] pt-12">
            <div className="flex items-center justify-between mb-8 border-b border-[#222222] pb-6">
              <h2 className="text-[24px] font-black m-0 text-white uppercase tracking-tight">
                Latest Stories
              </h2>
              <Link 
                href="/" 
                className="text-[#667eea] hover:text-white text-sm font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
              >
                View All
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {latestArticles.slice(0, 8).map((latestArticle) => (
                <Link 
                  key={latestArticle.id} 
                  href={`/article/${latestArticle.slug}`}
                  className="group bg-[#111111] cursor-pointer hover:bg-[#161616] transition-colors"
                >
                  <div className="relative h-64 sm:h-44 overflow-hidden">
                    {getImageUrl(latestArticle.cover_image_url) ? (
                      <img
                        src={getImageUrl(latestArticle.cover_image_url)}
                        alt={latestArticle.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.parentElement.innerHTML = `
                            <div class="w-full h-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center">
                              <ImageIcon class="text-gray-400" size={32} />
                            </div>
                          `
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center">
                        <ImageIcon className="text-gray-400" size={32} />
                      </div>
                    )}
                    
                    {/* Category Badge - Inside Image */}
                    {latestArticle.category && (
                      <div className="absolute top-3 left-3 z-20">
                        <span 
                          className="text-white py-1 px-3 text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-sm bg-black/20"
                          style={{ 
                            backgroundColor: latestArticle.category.color || '#667eea'
                          }}
                        >
                          {latestArticle.category.name}
                        </span>
                      </div>
                    )}
                    
                    {/* Mobile Title Overlay */}
                    <div className="absolute inset-0 flex flex-col justify-end p-4 sm:hidden bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                      <h4 className="text-lg font-bold leading-tight text-white drop-shadow-md">
                        {latestArticle.title}
                      </h4>
                      <div className="flex gap-2 text-[10px] text-gray-300 mt-2 uppercase tracking-wide font-medium">
                        <span>
                          {latestArticle.published_at 
                            ? new Date(latestArticle.published_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })
                            : 'Recently'
                          }
                        </span>
                      </div>
                    </div>
                    
                    {/* Breaking News Badge */}
                    {latestArticle.is_breaking && (
                      <div className="absolute top-3 right-3 z-20">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-600/90 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                          BREAKING
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Desktop Content */}
                  <div className="hidden sm:block p-3">
                    <h3 className="text-sm font-bold leading-snug mb-2 text-white group-hover:underline decoration-[#666666] underline-offset-4 decoration-1 line-clamp-2">
                      {latestArticle.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-[#999999] mb-3 line-clamp-2 font-serif">
                      {latestArticle.subtitle}
                    </p>
                    
                    <div className="flex items-center justify-between text-[10px] text-[#666666] uppercase tracking-wide font-medium pt-2 border-t border-[#222222]">
                      <div className="flex items-center gap-2">
                        <span>
                          {latestArticle.published_at 
                            ? new Date(latestArticle.published_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })
                            : 'Recently'
                          }
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <MessageCircle size={12} />
                          <span>{latestArticle.comments_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* =========================================
            SECTION 2: SPLIT CATEGORIES (National & Local)
           ========================================= */}
        {latestArticles.length > 0 && (
          <div className="max-w-[1400px] mx-auto p-4 md:p-8 mt-12 mb-20">
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
        )}

      </main>

      {/* Footer */}
      <Footer siteSettings={siteSettings} />
    </div>
  );
}

// --- HELPER COMPONENTS & FUNCTIONS ---

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

function formatArticleContent(content) {
  if (!content) return ''
  
  return content
    .split('\n')
    .map(paragraph => {
      const trimmed = paragraph.trim()
      
      if (trimmed.startsWith('# ')) {
        return `<h2 class="text-3xl font-bold mt-10 mb-4 pt-8 border-t border-gray-800">${trimmed.substring(2)}</h2>`
      }
      if (trimmed.startsWith('## ')) {
        return `<h3 class="text-2xl font-bold mt-8 mb-3">${trimmed.substring(3)}</h3>`
      }
      if (trimmed.startsWith('### ')) {
        return `<h4 class="text-xl font-bold mt-6 mb-2">${trimmed.substring(4)}</h4>`
      }
      if (trimmed.startsWith('#### ')) {
        return `<h5 class="text-lg font-bold mt-4 mb-2">${trimmed.substring(5)}</h5>`
      }
      if (trimmed.startsWith('> ')) {
        return `<blockquote class="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-900/10 text-gray-300">${trimmed.substring(2)}</blockquote>`
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return `<li class="ml-4 mb-1">${trimmed.substring(2)}</li>`
      }
      if (trimmed.match(/^[0-9]+\.\s/)) {
        return `<li class="ml-4 mb-1">${trimmed.replace(/^[0-9]+\.\s/, '')}</li>`
      }
      if (trimmed === '') {
        return `<div class="h-6"></div>`
      }
      
      let formattedParagraph = trimmed
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code class="bg-gray-800 px-1 py-0.5 rounded text-sm">$1</code>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-400 hover:text-blue-300 underline">$1</a>')
      
      return `<p class="mb-6 leading-relaxed">${formattedParagraph}</p>`
    })
    .join('')
    .replace(/(<li[^>]*>.*?<\/li>)/g, '<ul class="list-disc ml-6 mb-6">$&</ul>')
    .replace(/<ul class="list-disc ml-6 mb-6"><\/ul>/g, '')
    .replace(/(<ul[^>]*>)(<li[^>]*>)/g, '$1$2')
}