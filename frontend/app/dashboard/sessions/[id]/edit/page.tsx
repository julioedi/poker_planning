'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { 
  ArrowLeft, 
  Save, 
  Calendar,
  Clock,
  Settings,
  Plus,
  X
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface PlanningSession {
  id: number
  title: string
  room_code: string
  metrics: string
  scheduled_at: string
  started_at: string
  ended_at: string
  status: string
  allow_chat: boolean
  allow_emoticons: boolean
  notify_email: boolean
  created_at: string
  updated_at: string
  project_name: string
  created_by_name: string
}

interface Project {
  id: number
  name: string
  description: string
}

export default function EditSessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [session, setSession] = useState<PlanningSession | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [formData, setFormData] = useState({
    title: '',
    project_id: '',
    metrics: '',
    scheduled_at: '',
    allow_chat: true,
    allow_emoticons: true,
    notify_email: false
  })

  useEffect(() => {
    if (sessionId) {
      fetchSessionDetails()
      fetchProjects()
    }
  }, [sessionId])

  const fetchSessionDetails = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/poker-planning/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch session details')
      }

      const data = await response.json()
      setSession(data.planning)
      
      // Set form data
      setFormData({
        title: data.planning.title || '',
        project_id: data.planning.project_id?.toString() || '',
        metrics: data.planning.metrics || '',
        scheduled_at: data.planning.scheduled_at ? new Date(data.planning.scheduled_at).toISOString().slice(0, 16) : '',
        allow_chat: data.planning.allow_chat,
        allow_emoticons: data.planning.allow_emoticons,
        notify_email: data.planning.notify_email
      })
    } catch (error) {
      console.error('Error fetching session details:', error)
      toast.error('Failed to load session details')
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch(`/api/poker-planning/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update session')
      }

      toast.success('Session updated successfully')
      router.push(`/dashboard/sessions/${sessionId}`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!session) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Session not found</h2>
          <p className="text-gray-600 mb-4">The session you're looking for doesn't exist or you don't have access to it.</p>
          <Link href="/dashboard/sessions" className="btn-primary btn-md">
            Back to Sessions
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  if (session.status !== 'draft') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Cannot Edit Session</h2>
          <p className="text-gray-600 mb-4">Only draft sessions can be edited. This session is currently {session.status}.</p>
          <Link href={`/dashboard/sessions/${sessionId}`} className="btn-primary btn-md">
            View Session
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <Link
            href={`/dashboard/sessions/${sessionId}`}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Session</h1>
            <p className="text-gray-600 mt-1">Update your planning session details</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Basic Information</h3>
            </div>
            <div className="card-content space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="input"
                  placeholder="Enter session title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project *
                </label>
                <select
                  required
                  value={formData.project_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, project_id: e.target.value }))}
                  className="input"
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Metrics
                </label>
                <textarea
                  value={formData.metrics}
                  onChange={(e) => setFormData(prev => ({ ...prev, metrics: e.target.value }))}
                  className="input min-h-[100px]"
                  placeholder="Describe the metrics or criteria for this planning session"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Schedule</h3>
            </div>
            <div className="card-content">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_at: e.target.value }))}
                  className="input"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Leave empty to start immediately when you begin the session
                </p>
              </div>
            </div>
          </div>

          {/* Session Settings */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Session Settings</h3>
            </div>
            <div className="card-content space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Allow Chat</label>
                  <p className="text-sm text-gray-500">Enable chat functionality during the session</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allow_chat}
                    onChange={(e) => setFormData(prev => ({ ...prev, allow_chat: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Allow Emoticons</label>
                  <p className="text-sm text-gray-500">Enable emoticon reactions during voting</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allow_emoticons}
                    onChange={(e) => setFormData(prev => ({ ...prev, allow_emoticons: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email Notifications</label>
                  <p className="text-sm text-gray-500">Send email notifications to participants</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.notify_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, notify_email: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4">
            <Link
              href={`/dashboard/sessions/${sessionId}`}
              className="btn-outline btn-md"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary btn-md flex items-center"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
} 