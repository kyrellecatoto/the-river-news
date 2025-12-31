'use client'

import { useState } from 'react'
import Link from 'next/link'
import { resetPassword } from '../../lib/supabase/auth'
import { toast, Toaster } from 'react-hot-toast'
import { Mail } from 'lucide-react'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await resetPassword(email)
      setEmailSent(true)
      toast.success('Password reset email sent! Check your inbox.')
    } catch (error) {
      console.error('Reset password error:', error)
      toast.error(error.message || 'Failed to send reset email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
      <Toaster position="top-right" />
      
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-sm text-gray-400">
            {emailSent 
              ? 'Check your email for reset instructions' 
              : 'Enter your email to reset your password'
            }
          </p>
        </div>
        
        {!emailSent ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="admin@example.com"
                  required
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset Instructions'}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-400">
                Password reset instructions have been sent to {email}
              </p>
            </div>
            <p className="text-sm text-gray-400">
              The link in the email will expire in 24 hours.
            </p>
          </div>
        )}
        
        <div className="mt-8 text-center space-y-4">
          <Link 
            href="/admin/login" 
            className="text-sm text-blue-400 hover:text-blue-300 font-semibold transition-colors block"
          >
            ← Back to login
          </Link>
          
          <div>
            <Link 
              href="/"
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              Back to website
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}