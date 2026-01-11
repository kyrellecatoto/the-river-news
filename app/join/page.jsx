'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { createClient } from '../lib/supabase/client'
import { toast, Toaster } from 'react-hot-toast'
import { 
  Send, 
  User, 
  Mail, 
  Facebook, 
  School,
  Briefcase,
  Link as LinkIcon,
  Loader2,
  CheckCircle,
  X
} from 'lucide-react'

export default function VolunteerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    email: '',
    grade_level: '',
    facebook_link: '',
    affiliations: '',
    department: '',
    motivation: '',
    skills: '',
    cv_link: '',          
    sample_works_link: '', 
    privacy_consent: false
  })

  // Departments List
  const departments = [
    "News Writer", "Opinion Writer", "Feature Writer", 
    "Sports Writer", "Layout Artist", "Editorial Cartoonist", 
    "Photojournalist"
  ]

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.privacy_consent) {
      toast.error('You must acknowledge the Data Privacy Act to proceed.')
      return
    }

    try {
      setLoading(true)
      const supabase = createClient()

      const { error } = await supabase
        .from('volunteer_applications')
        .insert({
          full_name: formData.full_name,
          age: parseInt(formData.age),
          email: formData.email,
          grade_level: formData.grade_level,
          facebook_link: formData.facebook_link,
          affiliations: formData.affiliations,
          department: formData.department,
          motivation: formData.motivation,
          skills: formData.skills,
          cv_url: formData.cv_link, 
          sample_works_urls: [formData.sample_works_link], 
          privacy_consent: formData.privacy_consent,
          status: 'pending'
        })

      if (error) throw error

      setShowSuccessModal(true)
      
      setFormData({
        full_name: '',
        age: '',
        email: '',
        grade_level: '',
        facebook_link: '',
        affiliations: '',
        department: '',
        motivation: '',
        skills: '',
        cv_link: '',
        sample_works_link: '',
        privacy_consent: false
      })

    } catch (error) {
      console.error('Submission error:', error)
      toast.error('Failed to submit application. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans relative">
      <Toaster position="top-right" />
      <Navbar siteSettings={{}} /> 

      <main className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-6">
              Join The River
            </h1>
            <p className="text-gray-400">
              Be part of a dynamic team committed to delivering truthful and impactful stories.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 bg-gray-900/50 p-8 rounded-2xl border border-gray-800">
            
            {/* Privacy Consent */}
            <div className="bg-blue-900/20 p-6 rounded-xl border border-blue-500/30">
              <label className="flex items-start gap-4 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="privacy_consent"
                  checked={formData.privacy_consent}
                  onChange={handleChange}
                  className="mt-1 w-5 h-5 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-300">
                  Do you acknowledge that the information provided will be kept confidential, 
                  following the <strong>Republic Act No. 10173 (Data Privacy Act of 2012)</strong>? *
                </span>
              </label>
            </div>

            {/* Personal Info */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold flex items-center gap-2 text-blue-400">
                <User size={20} /> Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Full Name *</label>
                  <input
                    required
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Last Name, First Name, M.I."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Age *</label>
                  <input
                    required
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 text-gray-500" size={18} />
                    <input
                      required
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 bg-gray-800 border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Grade / Year Level *</label>
                  <div className="relative">
                    <School className="absolute left-3 top-3.5 text-gray-500" size={18} />
                    <input
                      required
                      name="grade_level"
                      value={formData.grade_level}
                      onChange={handleChange}
                      className="w-full pl-10 bg-gray-800 border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Facebook Profile Link *</label>
                  <div className="relative">
                    <Facebook className="absolute left-3 top-3.5 text-gray-500" size={18} />
                    <input
                      required
                      name="facebook_link"
                      value={formData.facebook_link}
                      onChange={handleChange}
                      placeholder="https://facebook.com/..."
                      className="w-full pl-10 bg-gray-800 border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Affiliations *</label>
                  <input
                    required
                    name="affiliations"
                    value={formData.affiliations}
                    onChange={handleChange}
                    placeholder="Other organizations or groups"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-800 my-8" />

            {/* Application Details */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold flex items-center gap-2 text-purple-400">
                <Briefcase size={20} /> Application Details
              </h3>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Department *</label>
                <select
                  required
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition-colors text-white"
                >
                  <option value="" disabled>Select a department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Why do you want to join The River? *</label>
                <textarea
                  required
                  name="motivation"
                  value={formData.motivation}
                  onChange={handleChange}
                  rows={4}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">What skills can you contribute? *</label>
                <textarea
                  required
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  rows={4}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="h-px bg-gray-800 my-8" />

            {/* Google Drive Links - Updated Section */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold flex items-center gap-2 text-green-400">
                <LinkIcon size={20} /> Portfolio & CV Links
              </h3>
              
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg mb-4">
                <p className="text-yellow-400 text-sm">
                  <strong>Important:</strong> Please ensure your Google Drive links are set to 
                  <strong> "Anyone with the link"</strong> so our team can access your files.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Link to CV (Google Drive / PDF Link) *</label>
                  <input
                    required
                    type="url"
                    name="cv_link"
                    value={formData.cv_link}
                    onChange={handleChange}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-green-500 transition-colors"
                  />
                  <p className="text-xs text-gray-500">Make sure this link is accessible for all.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Link to Sample Works Folder *</label>
                  <input
                    required
                    type="url"
                    name="sample_works_link"
                    value={formData.sample_works_link}
                    onChange={handleChange}
                    placeholder="https://drive.google.com/drive/folders/..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-green-500 transition-colors"
                  />
                  <p className="text-xs text-gray-500">
                    Upload your 2-3 sample outputs to a folder and paste the link here. Ensure it is accessible.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <> <Loader2 className="animate-spin" /> Submitting... </>
              ) : (
                <> <Send size={20} /> Submit Application </>
              )}
            </button>
          </form>
        </div>
      </main>
      
      <Footer siteSettings={{}} />

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-md w-full p-6 relative shadow-2xl animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => {
                setShowSuccessModal(false)
                router.push('/')
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
            
            <div className="text-center space-y-4 pt-4">
              <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mb-4">
                <CheckCircle size={40} />
              </div>
              
              <h2 className="text-2xl font-bold text-white">Thank You!</h2>
              
              <p className="text-gray-300">
                Your application has been successfully submitted. We appreciate your interest in joining The River.
              </p>
              
              <p className="text-sm text-gray-400">
                Our team will review your application, and you will receive an email notification regarding the results soon.
              </p>

              <button
                onClick={() => router.push('/')}
                className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors mt-6"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}