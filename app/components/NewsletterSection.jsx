'use client'

import { useState } from 'react'
import { createClient } from '../lib/supabase/client'

export default function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    const supabase = createClient()

    try {
      // 1. Insert email into Supabase
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert([{ email: email }])

      if (error) {
        // Handle specific error for duplicates
        if (error.code === '23505') { // Postgres code for unique violation
           throw new Error('This email is already subscribed.')
        }
        throw error
      }

      // 2. Success
      setStatus('success')
      setEmail('') // Clear input
      
    } catch (error) {
      console.error('Newsletter error:', error)
      setStatus('error')
      setErrorMessage(error.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <section className="bg-gradient-to-br from-[#667eea] to-[#764ba2] py-12 md:py-16 px-6">
      <div className="max-w-[800px] mx-auto text-center">
        <h3 className="text-3xl md:text-[40px] font-black mb-4 text-white">
          Stay In The Loop
        </h3>

        <p className="text-lg mb-8 text-white/90">
          Get the latest news and exclusive content delivered to your inbox
        </p>

        {status === 'success' ? (
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 animate-fade-in">
            <p className="text-white font-bold text-xl mb-2">
              ✓ You're on the list!
            </p>
            <p className="text-white/80 text-sm">
              Thanks for subscribing. Watch your inbox for updates.
            </p>
            <button 
              onClick={() => setStatus('idle')}
              className="mt-4 text-xs text-white/70 hover:text-white underline"
            >
              Subscribe another email
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col md:flex-row gap-4 max-w-[500px] mx-auto relative"
          >
            <label htmlFor="email-input" className="sr-only">
              Email address
            </label>

            <input
              id="email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              required
              disabled={status === 'loading'}
              className="flex-1 px-6 py-4 rounded-2xl text-sm bg-white/95 text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-70"
            />

            <button
              type="submit"
              disabled={status === 'loading'}
              className="bg-black text-white px-9 py-4 rounded-2xl text-sm font-bold hover:bg-gray-900 whitespace-nowrap disabled:bg-gray-800 disabled:cursor-not-allowed transition-all"
            >
              {status === 'loading' ? 'Joining...' : 'Subscribe'}
            </button>

            {/* Error Message Display */}
            {status === 'error' && (
              <div className="absolute -bottom-8 left-0 right-0 text-center">
                <p className="text-red-200 text-xs font-bold bg-red-900/50 py-1 px-3 rounded-full inline-block">
                   ⚠ {errorMessage}
                </p>
              </div>
            )}
          </form>
        )}
      </div>
    </section>
  )
}