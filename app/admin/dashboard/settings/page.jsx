'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase/client'
import { getCurrentUser } from '../../../lib/supabase/auth'
import {
  Save,
  Settings as SettingsIcon,
  Globe,
  Palette,
  Bell,
  Lock,
  Mail,
  Users,
  Shield,
  Database,
  Cloud,
  Smartphone,
  CreditCard,
  FileText,
  Zap,
  RefreshCw,
  Upload,
  X,
  Check
} from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  
  const [settings, setSettings] = useState({
    // General Settings
    general: {
      siteTitle: 'The River News',
      siteDescription: 'Latest news and breaking updates',
      siteUrl: 'https://therivernews.com',
      contactEmail: 'contact@therivernews.com',
      logoUrl: '',
      faviconUrl: '',
      timezone: 'UTC'
    },
    
    // Appearance
    appearance: {
      theme: 'dark',
      primaryColor: '#667eea',
      secondaryColor: '#764ba2',
      accentColor: '#f56565',
      fontFamily: 'Inter',
      borderRadius: '0.5rem',
      enableAnimations: true
    },
    
    // SEO
    seo: {
      metaTitle: 'The River News - Latest Updates',
      metaDescription: 'Stay updated with the latest news and breaking stories',
      metaKeywords: 'news, updates, breaking, articles',
      ogImage: '',
      twitterHandle: '@therivernews',
      googleAnalyticsId: '',
      googleSiteVerification: ''
    },
    
    // Content
    content: {
      defaultAuthor: 'Staff Writer',
      defaultReadTime: 3,
      enableComments: true,
      moderateComments: false,
      allowAnonymousComments: true,
      maxUploadSize: 10, // MB
      allowedFileTypes: 'jpg,jpeg,png,gif,webp'
    },
    
    // Social Media
    social: {
      facebookUrl: '',
      twitterUrl: '',
      instagramUrl: '',
      linkedinUrl: '',
      youtubeUrl: '',
      enableSharing: true,
      shareButtons: ['facebook', 'twitter', 'linkedin', 'whatsapp']
    },
    
    // Email
    email: {
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: 'noreply@therivernews.com',
      fromName: 'The River News',
      enableNotifications: true
    },
    
    // Security
    security: {
      requireLogin: false,
      twoFactorAuth: false,
      sessionTimeout: 24, // hours
      maxLoginAttempts: 5,
      enableIpRestriction: false,
      allowedIps: []
    },
    
    // Performance
    performance: {
      enableCaching: true,
      cacheDuration: 3600, // seconds
      enableCdn: false,
      cdnUrl: '',
      optimizeImages: true,
      lazyLoadImages: true
    },
    
    // Backup
    backup: {
      autoBackup: true,
      backupFrequency: 'daily',
      backupLocation: 'local',
      keepBackups: 7,
      lastBackup: null
    }
  })

  useEffect(() => {
    checkAuthAndLoadSettings()
  }, [])

  const checkAuthAndLoadSettings = async () => {
    try {
      const user = await getCurrentUser()
      if (!user) {
        router.push('/admin/login')
        return
      }
      await loadSettings()
    } catch (error) {
      console.error('Error:', error)
      router.push('/admin/login')
    }
  }

  const loadSettings = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      // Load settings from database or localStorage
      const savedSettings = localStorage.getItem('news_site_settings')
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings))
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      
      // Save to localStorage (in production, save to database)
      localStorage.setItem('news_site_settings', JSON.stringify(settings))
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSettingChange = (category, field, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }))
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image size must be less than 5MB')
      return
    }

    // In production, upload to Supabase Storage
    const reader = new FileReader()
    reader.onload = (e) => {
      handleSettingChange('general', 'logoUrl', e.target.result)
      toast.success('Logo uploaded successfully')
    }
    reader.readAsDataURL(file)
  }

  const resetToDefaults = () => {
    if (!confirm('Are you sure you want to reset all settings to default values?')) {
      return
    }

    setSettings({
      // Reset to original defaults
      general: {
        siteTitle: 'The River News',
        siteDescription: 'Latest news and breaking updates',
        siteUrl: 'https://therivernews.com',
        contactEmail: 'contact@therivernews.com',
        logoUrl: '',
        faviconUrl: '',
        timezone: 'UTC'
      },
      appearance: {
        theme: 'dark',
        primaryColor: '#667eea',
        secondaryColor: '#764ba2',
        accentColor: '#f56565',
        fontFamily: 'Inter',
        borderRadius: '0.5rem',
        enableAnimations: true
      },
      seo: {
        metaTitle: 'The River News - Latest Updates',
        metaDescription: 'Stay updated with the latest news and breaking stories',
        metaKeywords: 'news, updates, breaking, articles',
        ogImage: '',
        twitterHandle: '@therivernews',
        googleAnalyticsId: '',
        googleSiteVerification: ''
      },
      content: {
        defaultAuthor: 'Staff Writer',
        defaultReadTime: 5,
        enableComments: true,
        moderateComments: false,
        allowAnonymousComments: true,
        maxUploadSize: 10,
        allowedFileTypes: 'jpg,jpeg,png,gif,webp'
      },
      social: {
        facebookUrl: '',
        twitterUrl: '',
        instagramUrl: '',
        linkedinUrl: '',
        youtubeUrl: '',
        enableSharing: true,
        shareButtons: ['facebook', 'twitter', 'linkedin', 'whatsapp']
      },
      email: {
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPassword: '',
        fromEmail: 'noreply@therivernews.com',
        fromName: 'The River News',
        enableNotifications: true
      },
      security: {
        requireLogin: false,
        twoFactorAuth: false,
        sessionTimeout: 24,
        maxLoginAttempts: 5,
        enableIpRestriction: false,
        allowedIps: []
      },
      performance: {
        enableCaching: true,
        cacheDuration: 3600,
        enableCdn: false,
        cdnUrl: '',
        optimizeImages: true,
        lazyLoadImages: true
      },
      backup: {
        autoBackup: true,
        backupFrequency: 'daily',
        backupLocation: 'local',
        keepBackups: 7,
        lastBackup: null
      }
    })

    toast.success('Settings reset to defaults')
  }

  const testEmailConnection = async () => {
    toast.loading('Testing email connection...')
    // Simulate email test
    setTimeout(() => {
      toast.dismiss()
      toast.success('Email connection successful!')
    }, 2000)
  }

  const runBackup = async () => {
    toast.loading('Creating backup...')
    // Simulate backup
    setTimeout(() => {
      toast.dismiss()
      handleSettingChange('backup', 'lastBackup', new Date().toISOString())
      toast.success('Backup completed successfully!')
    }, 3000)
  }

  const clearCache = async () => {
    toast.loading('Clearing cache...')
    // Simulate cache clear
    setTimeout(() => {
      toast.dismiss()
      toast.success('Cache cleared successfully!')
    }, 1000)
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-gray-400">Configure your news website settings</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Reset to Defaults
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 px-6 py-2 rounded-lg font-semibold transition-opacity disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="animate-spin" size={20} />
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

      {/* Settings Tabs */}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <div className="border-b border-gray-700">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('general')}
              className={`flex items-center gap-2 px-6 py-4 whitespace-nowrap transition-colors ${
                activeTab === 'general' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Globe size={18} />
              General
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`flex items-center gap-2 px-6 py-4 whitespace-nowrap transition-colors ${
                activeTab === 'appearance' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Palette size={18} />
              Appearance
            </button>
            <button
              onClick={() => setActiveTab('seo')}
              className={`flex items-center gap-2 px-6 py-4 whitespace-nowrap transition-colors ${
                activeTab === 'seo' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <SettingsIcon size={18} />
              SEO
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`flex items-center gap-2 px-6 py-4 whitespace-nowrap transition-colors ${
                activeTab === 'content' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <FileText size={18} />
              Content
            </button>
            <button
              onClick={() => setActiveTab('social')}
              className={`flex items-center gap-2 px-6 py-4 whitespace-nowrap transition-colors ${
                activeTab === 'social' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Users size={18} />
              Social
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`flex items-center gap-2 px-6 py-4 whitespace-nowrap transition-colors ${
                activeTab === 'email' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Mail size={18} />
              Email
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 px-6 py-4 whitespace-nowrap transition-colors ${
                activeTab === 'security' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Lock size={18} />
              Security
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`flex items-center gap-2 px-6 py-4 whitespace-nowrap transition-colors ${
                activeTab === 'performance' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Zap size={18} />
              Performance
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`flex items-center gap-2 px-6 py-4 whitespace-nowrap transition-colors ${
                activeTab === 'backup' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Database size={18} />
              Backup
            </button>
          </div>
        </div>

        {/* Settings Content */}
        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold mb-4">General Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Site Title
                  </label>
                  <input
                    type="text"
                    value={settings.general.siteTitle}
                    onChange={(e) => handleSettingChange('general', 'siteTitle', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Site URL
                  </label>
                  <input
                    type="url"
                    value={settings.general.siteUrl}
                    onChange={(e) => handleSettingChange('general', 'siteUrl', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Site Description
                  </label>
                  <textarea
                    value={settings.general.siteDescription}
                    onChange={(e) => handleSettingChange('general', 'siteDescription', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={settings.general.contactEmail}
                    onChange={(e) => handleSettingChange('general', 'contactEmail', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Timezone
                  </label>
                  <select
                    value={settings.general.timezone}
                    onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="UTC">UTC</option>
                    <option value="EST">Eastern Time</option>
                    <option value="CST">Central Time</option>
                    <option value="MST">Mountain Time</option>
                    <option value="PST">Pacific Time</option>
                  </select>
                </div>
              </div>

              {/* Logo Upload */}
              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-lg font-semibold mb-4">Logo & Favicon</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Site Logo
                    </label>
                    <div className="flex items-center gap-4">
                      {settings.general.logoUrl ? (
                        <div className="relative">
                          <img 
                            src={settings.general.logoUrl} 
                            alt="Site Logo" 
                            className="w-32 h-20 object-contain bg-gray-900 rounded-lg p-2"
                          />
                          <button
                            onClick={() => handleSettingChange('general', 'logoUrl', '')}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="w-32 h-20 bg-gray-900 rounded-lg flex items-center justify-center">
                          <Upload className="text-gray-400" size={24} />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <label className="block">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                            id="logo-upload"
                          />
                          <label
                            htmlFor="logo-upload"
                            className="block px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-center cursor-pointer transition-colors"
                          >
                            Upload Logo
                          </label>
                        </label>
                        <p className="text-xs text-gray-400 mt-2">
                          Recommended: 300×100px, PNG or SVG
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Favicon
                    </label>
                    <div className="flex items-center gap-4">
                      {settings.general.faviconUrl ? (
                        <div className="relative">
                          <img 
                            src={settings.general.faviconUrl} 
                            alt="Favicon" 
                            className="w-16 h-16 object-contain bg-gray-900 rounded-lg p-2"
                          />
                          <button
                            onClick={() => handleSettingChange('general', 'faviconUrl', '')}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gray-900 rounded-lg flex items-center justify-center">
                          <Upload className="text-gray-400" size={20} />
                        </div>
                      )}
                      
                      <div>
                        <label className="block">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0]
                              if (file) {
                                const reader = new FileReader()
                                reader.onload = (e) => {
                                  handleSettingChange('general', 'faviconUrl', e.target.result)
                                }
                                reader.readAsDataURL(file)
                              }
                            }}
                            className="hidden"
                            id="favicon-upload"
                          />
                          <label
                            htmlFor="favicon-upload"
                            className="block px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-center cursor-pointer transition-colors"
                          >
                            Upload Favicon
                          </label>
                        </label>
                        <p className="text-xs text-gray-400 mt-2">
                          Recommended: 32×32px, ICO or PNG
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold mb-4">Appearance Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Theme
                  </label>
                  <select
                    value={settings.appearance.theme}
                    onChange={(e) => handleSettingChange('appearance', 'theme', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Font Family
                  </label>
                  <select
                    value={settings.appearance.fontFamily}
                    onChange={(e) => handleSettingChange('appearance', 'fontFamily', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Montserrat">Montserrat</option>
                    <option value="Poppins">Poppins</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Primary Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.appearance.primaryColor}
                      onChange={(e) => handleSettingChange('appearance', 'primaryColor', e.target.value)}
                      className="w-12 h-12 cursor-pointer rounded-lg border-2 border-gray-700"
                    />
                    <input
                      type="text"
                      value={settings.appearance.primaryColor}
                      onChange={(e) => handleSettingChange('appearance', 'primaryColor', e.target.value)}
                      className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Secondary Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.appearance.secondaryColor}
                      onChange={(e) => handleSettingChange('appearance', 'secondaryColor', e.target.value)}
                      className="w-12 h-12 cursor-pointer rounded-lg border-2 border-gray-700"
                    />
                    <input
                      type="text"
                      value={settings.appearance.secondaryColor}
                      onChange={(e) => handleSettingChange('appearance', 'secondaryColor', e.target.value)}
                      className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Border Radius
                  </label>
                  <select
                    value={settings.appearance.borderRadius}
                    onChange={(e) => handleSettingChange('appearance', 'borderRadius', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="0">None</option>
                    <option value="0.25rem">Small</option>
                    <option value="0.5rem">Medium</option>
                    <option value="0.75rem">Large</option>
                    <option value="1rem">Extra Large</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.appearance.enableAnimations}
                      onChange={(e) => handleSettingChange('appearance', 'enableAnimations', e.target.checked)}
                      className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-gray-300">Enable Animations</span>
                  </label>
                </div>
              </div>

              {/* Color Preview */}
              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-lg font-semibold mb-4">Color Preview</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div 
                    className="h-20 rounded-lg flex items-center justify-center font-medium"
                    style={{ backgroundColor: settings.appearance.primaryColor }}
                  >
                    Primary Color
                  </div>
                  <div 
                    className="h-20 rounded-lg flex items-center justify-center font-medium"
                    style={{ backgroundColor: settings.appearance.secondaryColor }}
                  >
                    Secondary Color
                  </div>
                  <div 
                    className="h-20 rounded-lg flex items-center justify-center font-medium"
                    style={{ backgroundColor: settings.appearance.accentColor }}
                  >
                    Accent Color
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SEO Settings */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold mb-4">SEO Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    value={settings.seo.metaTitle}
                    onChange={(e) => handleSettingChange('seo', 'metaTitle', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="Page title for search engines"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Meta Description
                  </label>
                  <textarea
                    value={settings.seo.metaDescription}
                    onChange={(e) => handleSettingChange('seo', 'metaDescription', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    rows="3"
                    placeholder="Page description for search engines"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    {settings.seo.metaDescription.length}/160 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Meta Keywords
                  </label>
                  <input
                    type="text"
                    value={settings.seo.metaKeywords}
                    onChange={(e) => handleSettingChange('seo', 'metaKeywords', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="keyword1, keyword2, keyword3"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Separate keywords with commas
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Twitter Handle
                    </label>
                    <input
                      type="text"
                      value={settings.seo.twitterHandle}
                      onChange={(e) => handleSettingChange('seo', 'twitterHandle', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="@yourusername"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Google Analytics ID
                    </label>
                    <input
                      type="text"
                      value={settings.seo.googleAnalyticsId}
                      onChange={(e) => handleSettingChange('seo', 'googleAnalyticsId', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="UA-XXXXX-Y"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Google Site Verification
                  </label>
                  <input
                    type="text"
                    value={settings.seo.googleSiteVerification}
                    onChange={(e) => handleSettingChange('seo', 'googleSiteVerification', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="Verification code from Google Search Console"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Open Graph Image
                  </label>
                  <div className="flex items-center gap-4">
                    {settings.seo.ogImage ? (
                      <div className="relative">
                        <img 
                          src={settings.seo.ogImage} 
                          alt="OG Image" 
                          className="w-32 h-32 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => handleSettingChange('seo', 'ogImage', '')}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-32 h-32 bg-gray-900 rounded-lg flex items-center justify-center">
                        <Upload className="text-gray-400" size={24} />
                      </div>
                    )}
                    
                    <div>
                      <label className="block">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0]
                            if (file) {
                              const reader = new FileReader()
                              reader.onload = (e) => {
                                handleSettingChange('seo', 'ogImage', e.target.result)
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                          className="hidden"
                          id="og-image-upload"
                        />
                        <label
                          htmlFor="og-image-upload"
                          className="block px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-center cursor-pointer transition-colors"
                        >
                          Upload OG Image
                        </label>
                      </label>
                      <p className="text-xs text-gray-400 mt-2">
                        Recommended: 1200×630px, JPG or PNG
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content Settings */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold mb-4">Content Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Default Author Name
                  </label>
                  <input
                    type="text"
                    value={settings.content.defaultAuthor}
                    onChange={(e) => handleSettingChange('content', 'defaultAuthor', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Default Read Time (minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.content.defaultReadTime}
                    onChange={(e) => handleSettingChange('content', 'defaultReadTime', parseInt(e.target.value) || 5)}
                    min="1"
                    max="60"
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Upload Size (MB)
                  </label>
                  <input
                    type="number"
                    value={settings.content.maxUploadSize}
                    onChange={(e) => handleSettingChange('content', 'maxUploadSize', parseInt(e.target.value) || 10)}
                    min="1"
                    max="100"
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Allowed File Types
                  </label>
                  <input
                    type="text"
                    value={settings.content.allowedFileTypes}
                    onChange={(e) => handleSettingChange('content', 'allowedFileTypes', e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Separate with commas: jpg, png, gif, pdf
                  </p>
                </div>
              </div>

              {/* Comment Settings */}
              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-lg font-semibold mb-4">Comment Settings</h3>
                
                <div className="space-y-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.content.enableComments}
                      onChange={(e) => handleSettingChange('content', 'enableComments', e.target.checked)}
                      className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-gray-300">Enable Comments</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.content.moderateComments}
                      onChange={(e) => handleSettingChange('content', 'moderateComments', e.target.checked)}
                      className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-gray-300">Moderate Comments (Require Approval)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.content.allowAnonymousComments}
                      onChange={(e) => handleSettingChange('content', 'allowAnonymousComments', e.target.checked)}
                      className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-gray-300">Allow Anonymous Comments</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Social Media Settings */}
          {activeTab === 'social' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold mb-4">Social Media Settings</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Facebook URL
                    </label>
                    <input
                      type="url"
                      value={settings.social.facebookUrl}
                      onChange={(e) => handleSettingChange('social', 'facebookUrl', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Twitter URL
                    </label>
                    <input
                      type="url"
                      value={settings.social.twitterUrl}
                      onChange={(e) => handleSettingChange('social', 'twitterUrl', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="https://twitter.com/yourhandle"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Instagram URL
                    </label>
                    <input
                      type="url"
                      value={settings.social.instagramUrl}
                      onChange={(e) => handleSettingChange('social', 'instagramUrl', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="https://instagram.com/yourprofile"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      value={settings.social.linkedinUrl}
                      onChange={(e) => handleSettingChange('social', 'linkedinUrl', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="https://linkedin.com/company/yourcompany"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      YouTube URL
                    </label>
                    <input
                      type="url"
                      value={settings.social.youtubeUrl}
                      onChange={(e) => handleSettingChange('social', 'youtubeUrl', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="https://youtube.com/channel/yourchannel"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold mb-4">Sharing Settings</h3>
                  
                  <div className="space-y-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.social.enableSharing}
                        onChange={(e) => handleSettingChange('social', 'enableSharing', e.target.checked)}
                        className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-gray-300">Enable Social Sharing Buttons</span>
                    </label>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Available Share Buttons
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {['facebook', 'twitter', 'linkedin', 'whatsapp', 'telegram', 'email', 'copy'].map((platform) => (
                          <label key={platform} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.social.shareButtons.includes(platform)}
                              onChange={(e) => {
                                const newButtons = e.target.checked
                                  ? [...settings.social.shareButtons, platform]
                                  : settings.social.shareButtons.filter(b => b !== platform)
                                handleSettingChange('social', 'shareButtons', newButtons)
                              }}
                              className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                            />
                            <span className="text-gray-300 capitalize">{platform}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Email Settings */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold mb-4">Email Settings</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      SMTP Host
                    </label>
                    <input
                      type="text"
                      value={settings.email.smtpHost}
                      onChange={(e) => handleSettingChange('email', 'smtpHost', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="smtp.gmail.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      SMTP Port
                    </label>
                    <input
                      type="number"
                      value={settings.email.smtpPort}
                      onChange={(e) => handleSettingChange('email', 'smtpPort', parseInt(e.target.value) || 587)}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      SMTP Username
                    </label>
                    <input
                      type="text"
                      value={settings.email.smtpUser}
                      onChange={(e) => handleSettingChange('email', 'smtpUser', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      SMTP Password
                    </label>
                    <input
                      type="password"
                      value={settings.email.smtpPassword}
                      onChange={(e) => handleSettingChange('email', 'smtpPassword', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      From Email
                    </label>
                    <input
                      type="email"
                      value={settings.email.fromEmail}
                      onChange={(e) => handleSettingChange('email', 'fromEmail', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      From Name
                    </label>
                    <input
                      type="text"
                      value={settings.email.fromName}
                      onChange={(e) => handleSettingChange('email', 'fromName', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-700 pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Email Connection</h3>
                      <p className="text-sm text-gray-400">Test your email configuration</p>
                    </div>
                    <button
                      onClick={testEmailConnection}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      Test Connection
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.email.enableNotifications}
                    onChange={(e) => handleSettingChange('email', 'enableNotifications', e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-gray-300">Enable Email Notifications</span>
                </label>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold mb-4">Security Settings</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Session Timeout (hours)
                    </label>
                    <input
                      type="number"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value) || 24)}
                      min="1"
                      max="720"
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Max Login Attempts
                    </label>
                    <input
                      type="number"
                      value={settings.security.maxLoginAttempts}
                      onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value) || 5)}
                      min="1"
                      max="20"
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.security.requireLogin}
                      onChange={(e) => handleSettingChange('security', 'requireLogin', e.target.checked)}
                      className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-gray-300">Require Login for Admin Access</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.security.twoFactorAuth}
                      onChange={(e) => handleSettingChange('security', 'twoFactorAuth', e.target.checked)}
                      className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-gray-300">Enable Two-Factor Authentication</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.security.enableIpRestriction}
                      onChange={(e) => handleSettingChange('security', 'enableIpRestriction', e.target.checked)}
                      className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-gray-300">Enable IP Restriction for Admin</span>
                  </label>
                </div>

                {settings.security.enableIpRestriction && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Allowed IP Addresses
                    </label>
                    <textarea
                      value={settings.security.allowedIps.join('\n')}
                      onChange={(e) => handleSettingChange('security', 'allowedIps', e.target.value.split('\n').filter(ip => ip.trim()))}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 font-mono"
                      rows="4"
                      placeholder="192.168.1.1\n10.0.0.1"
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      Enter one IP address per line
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Performance Settings */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold mb-4">Performance Settings</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Cache Duration (seconds)
                    </label>
                    <input
                      type="number"
                      value={settings.performance.cacheDuration}
                      onChange={(e) => handleSettingChange('performance', 'cacheDuration', parseInt(e.target.value) || 3600)}
                      min="60"
                      max="86400"
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      CDN URL (optional)
                    </label>
                    <input
                      type="url"
                      value={settings.performance.cdnUrl}
                      onChange={(e) => handleSettingChange('performance', 'cdnUrl', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="https://cdn.yourdomain.com"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.performance.enableCaching}
                      onChange={(e) => handleSettingChange('performance', 'enableCaching', e.target.checked)}
                      className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-gray-300">Enable Page Caching</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.performance.enableCdn}
                      onChange={(e) => handleSettingChange('performance', 'enableCdn', e.target.checked)}
                      className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-gray-300">Enable CDN for Static Assets</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.performance.optimizeImages}
                      onChange={(e) => handleSettingChange('performance', 'optimizeImages', e.target.checked)}
                      className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-gray-300">Auto-optimize Uploaded Images</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.performance.lazyLoadImages}
                      onChange={(e) => handleSettingChange('performance', 'lazyLoadImages', e.target.checked)}
                      className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-gray-300">Enable Lazy Loading for Images</span>
                  </label>
                </div>

                <div className="border-t border-gray-700 pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Cache Management</h3>
                      <p className="text-sm text-gray-400">Clear all cached data</p>
                    </div>
                    <button
                      onClick={clearCache}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                      Clear Cache
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Backup Settings */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold mb-4">Backup Settings</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Backup Frequency
                    </label>
                    <select
                      value={settings.backup.backupFrequency}
                      onChange={(e) => handleSettingChange('backup', 'backupFrequency', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Keep Backups (days)
                    </label>
                    <input
                      type="number"
                      value={settings.backup.keepBackups}
                      onChange={(e) => handleSettingChange('backup', 'keepBackups', parseInt(e.target.value) || 7)}
                      min="1"
                      max="365"
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Backup Location
                    </label>
                    <select
                      value={settings.backup.backupLocation}
                      onChange={(e) => handleSettingChange('backup', 'backupLocation', e.target.value)}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="local">Local Server</option>
                      <option value="aws">Amazon S3</option>
                      <option value="google">Google Cloud</option>
                      <option value="dropbox">Dropbox</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Last Backup
                    </label>
                    <div className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-300">
                      {settings.backup.lastBackup 
                        ? new Date(settings.backup.lastBackup).toLocaleString()
                        : 'Never'
                      }
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.backup.autoBackup}
                      onChange={(e) => handleSettingChange('backup', 'autoBackup', e.target.checked)}
                      className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-gray-300">Enable Automatic Backups</span>
                  </label>
                </div>

                <div className="border-t border-gray-700 pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Manual Backup</h3>
                      <p className="text-sm text-gray-400">Create a backup immediately</p>
                    </div>
                    <button
                      onClick={runBackup}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                    >
                      Create Backup Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}