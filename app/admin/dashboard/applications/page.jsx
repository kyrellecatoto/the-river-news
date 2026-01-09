'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../../lib/supabase/client'
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Mail,
  User,
  AlertCircle,
  Link as LinkIcon 
} from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([])
  const [filteredApplications, setFilteredApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all') 
  const [filterDepartment, setFilterDepartment] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const departments = [
    "News Desk", "Opinion Desk", "Feature Desk", "Scitech/Devcom Desk", 
    "Sports Desk", "Layout Desk", "Editorial Cartooning Desk", 
    "Copyediting & Fact-checking Desk", "Literary Desk", 
    "Photojournalism Desk", "Mobile Journalism Desk"
  ]

  useEffect(() => {
    fetchApplications()
  }, [])

  useEffect(() => {
    filterData()
  }, [searchTerm, filterStatus, filterDepartment, applications])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('volunteer_applications')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setApplications(data || [])
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const filterData = () => {
    let result = [...applications]

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase()
      result = result.filter(app => 
        app.full_name.toLowerCase().includes(lowerTerm) ||
        app.email.toLowerCase().includes(lowerTerm)
      )
    }

    if (filterStatus !== 'all') {
      result = result.filter(app => app.status === filterStatus)
    }

    if (filterDepartment !== 'all') {
      result = result.filter(app => app.department === filterDepartment)
    }

    setFilteredApplications(result)
    setCurrentPage(1)
  }

  const updateStatus = async (id, newStatus) => {
    const previousApplications = [...applications]
    
    setApplications(prev => prev.map(app => 
      app.id === id ? { ...app, status: newStatus } : app
    ))

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('volunteer_applications')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error
      
      const message = newStatus === 'accepted' ? 'Application accepted' : 
                      newStatus === 'rejected' ? 'Application rejected' : 
                      'Application reset to pending'
      toast.success(message)
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
      setApplications(previousApplications) 
    }
  }

  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentItems = filteredApplications.slice(startIndex, startIndex + itemsPerPage)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 text-gray-100 p-6">
      <Toaster position="top-right" />
      
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Volunteer Applications
          </h1>
          <p className="text-gray-400 mt-1">
            Review and manage incoming team applications
          </p>
        </div>
        <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700 flex items-center gap-2">
          <User size={16} className="text-blue-400"/>
          <span className="text-sm text-gray-400">Total Applications: </span>
          <span className="font-bold text-white">{filteredApplications.length}</span>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4 shadow-lg">
        
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Search name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors text-sm text-white"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-3 text-gray-500" size={18} />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors appearance-none text-sm text-gray-300"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="relative">
          <div className="absolute left-3 top-3 text-gray-500 pointer-events-none">
             <User size={18} /> 
          </div>
          <select 
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500 transition-colors appearance-none text-sm text-gray-300"
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/80 text-gray-400 text-xs uppercase font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-4 text-left">Applicant Info</th>
                <th className="px-6 py-4 text-left">Department</th>
                <th className="px-6 py-4 text-left">Answers</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Docs</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {currentItems.length > 0 ? (
                currentItems.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-700/30 transition-colors">
                    
                    {/* Applicant Info */}
                    <td className="px-6 py-4 align-top">
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-base mb-1">{app.full_name}</span>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Mail size={12} /> {app.email}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Age: {app.age} • Grade/Year Level: {app.grade_level}
                        </div>
                        {app.facebook_link && (
                          <a 
                            href={app.facebook_link} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300 mt-2 flex items-center gap-1 w-fit"
                          >
                            <ExternalLink size={10} /> Facebook Profile
                          </a>
                        )}
                        {app.affiliations && (
                            <div className="mt-2 text-xs text-gray-500 max-w-[200px] truncate">
                                <span className="text-gray-600 font-semibold">Affiliations:</span> {app.affiliations}
                            </div>
                        )}
                      </div>
                    </td>

                    {/* Department */}
                    <td className="px-6 py-4 align-top">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {app.department}
                      </span>
                      <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                         <Clock size={10} /> {new Date(app.created_at).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Answers (Truncated) */}
                    <td className="px-6 py-4 align-top max-w-xs">
                       <div className="space-y-3">
                         <div>
                           <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Motivation</span>
                           <p className="text-sm text-gray-300 line-clamp-2 hover:line-clamp-none transition-all cursor-help" title={app.motivation}>
                             "{app.motivation}"
                           </p>
                         </div>
                         <div>
                           <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Skills</span>
                           <p className="text-sm text-gray-300 line-clamp-2 hover:line-clamp-none transition-all cursor-help" title={app.skills}>
                             {app.skills}
                           </p>
                         </div>
                       </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4 text-center align-top">
                      {app.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                          <AlertCircle size={12} /> Pending
                        </span>
                      )}
                      {app.status === 'accepted' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                          <CheckCircle size={12} /> Accepted
                        </span>
                      )}
                      {app.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                          <XCircle size={12} /> Rejected
                        </span>
                      )}
                    </td>

                    {/* Attachments (Updated for GDrive Links) */}
                    <td className="px-6 py-4 text-center align-top">
                      <div className="flex flex-col gap-2 items-center w-32">
                        {/* CV Link */}
                        {app.cv_url ? (
                          <a 
                            href={app.cv_url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg transition-colors text-xs font-medium w-full justify-center border border-blue-500/30"
                            title="Open CV Link"
                          >
                            <FileText size={14} /> View CV
                            <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span className="text-xs text-red-400">No CV</span>
                        )}
                        
                        {/* Sample Works Link */}
                        {app.sample_works_urls && app.sample_works_urls.length > 0 && (
                          <a 
                            href={app.sample_works_urls[0]}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 rounded-lg transition-colors text-xs font-medium w-full justify-center border border-purple-500/30"
                            title="Open Samples Folder"
                          >
                            <LinkIcon size={14} /> View Samples
                            <ExternalLink size={10} />
                          </a>
                        )}
                        
                        {(!app.sample_works_urls || app.sample_works_urls.length === 0) && (
                            <span className="text-xs text-gray-600 italic">No samples</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right align-top">
                      <div className="flex flex-col items-end gap-2 w-28 ml-auto">
                        {app.status !== 'accepted' && (
                          <button
                            onClick={() => updateStatus(app.id, 'accepted')}
                            className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500 hover:text-white transition-all text-xs font-medium w-full justify-center"
                          >
                            <CheckCircle size={14} /> Accept
                          </button>
                        )}
                        
                        {app.status !== 'rejected' && (
                          <button
                            onClick={() => updateStatus(app.id, 'rejected')}
                            className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500 hover:text-white transition-all text-xs font-medium w-full justify-center"
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        )}

                        {app.status !== 'pending' && (
                            <button
                            onClick={() => updateStatus(app.id, 'pending')}
                            className="text-xs text-gray-500 hover:text-white underline mt-1 text-center w-full"
                          >
                            Reset to Pending
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                       <div className="bg-gray-800 p-4 rounded-full">
                         <User size={32} className="opacity-40" />
                       </div>
                       <p className="text-lg font-medium text-gray-400">No applications found</p>
                       <p className="text-sm">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="bg-gray-900/80 px-6 py-4 border-t border-gray-700 flex justify-between items-center">
            <span className="text-sm text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}