import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 w-full max-w-md text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">⛔</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400">
            You don't have permission to access this page.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            href="/admin/dashboard"
            className="block bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
          >
            Go to Dashboard
          </Link>
          
          <Link
            href="/admin/login"
            className="block border border-gray-700 text-gray-300 hover:bg-gray-800 py-3 px-4 rounded-lg font-semibold transition-colors"
          >
            Sign in with different account
          </Link>
          
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors inline-block"
          >
            ← Back to website
          </Link>
        </div>
      </div>
    </div>
  )
}