'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { 
  BarChart3, 
  Users, 
  Calendar, 
  Clock, 
  Copy, 
  ArrowLeft,
  Play,
  Square,
  Edit,
  Eye
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
  project_description: string
  created_by_name: string
  created_by_email: string
}

interface Participant {
  id: number
  joined_at: string
  user_id: number
  name: string
  email: string
  role: string
}

interface Topic {
  id: number
  title: string
  description: string
  parent_id: number | null
  order_index: number
  created_at: string
}

export default function SessionDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string
  
  const [session, setSession] = useState<PlanningSession | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionId) {
      fetchSessionDetails()
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
      setParticipants(data.participants)
      setTopics(data.topics)
    } catch (error) {
      console.error('Error fetching session details:', error)
      toast.error('Failed to load session details')
    } finally {
      setLoading(false)
    }
  }

  const handleStartSession = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/poker-planning/${sessionId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to start session')
      }

      toast.success('Session started successfully')
      fetchSessionDetails()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleEndSession = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/poker-planning/${sessionId}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to end session')
      }

      toast.success('Session ended successfully')
      fetchSessionDetails()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const copyRoomCode = (roomCode: string) => {
    navigator.clipboard.writeText(roomCode)
    toast.success('Room code copied to clipboard')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard/sessions"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{session.title}</h1>
              <p className="text-gray-600 mt-1">{session.project_name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(session.status)}`}>
              {session.status}
            </span>
            {session.status === 'draft' && (
              <>
                <button
                  onClick={handleStartSession}
                  className="btn-primary btn-md flex items-center"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start Session
                </button>
                <Link
                  href={`/dashboard/sessions/${sessionId}/edit`}
                  className="btn-outline btn-md flex items-center"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </>
            )}
            {session.status === 'active' && (
              <>
                <Link
                  href={`/room/${session.room_code}`}
                  className="btn-primary btn-md flex items-center"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Join Session
                </Link>
                <button
                  onClick={handleEndSession}
                  className="btn-outline btn-md flex items-center"
                >
                  <Square className="mr-2 h-4 w-4" />
                  End Session
                </button>
              </>
            )}
            {session.status === 'scheduled' && (
              <Link
                href={`/room/${session.room_code}`}
                className="btn-primary btn-md flex items-center"
              >
                <Eye className="mr-2 h-4 w-4" />
                Join Session
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Session Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Session Details */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Session Information</h3>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <p className="text-gray-900">{session.title}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                    <p className="text-gray-900">{session.project_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
                    <p className="text-gray-900">{session.created_by_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Metrics</label>
                    <p className="text-gray-900">{session.metrics || 'Not specified'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled At</label>
                    <div className="flex items-center text-gray-900">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(session.scheduled_at)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Started At</label>
                    <div className="flex items-center text-gray-900">
                      <Play className="h-4 w-4 mr-2" />
                      {formatDate(session.started_at)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ended At</label>
                    <div className="flex items-center text-gray-900">
                      <Square className="h-4 w-4 mr-2" />
                      {formatDate(session.ended_at)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                    <div className="flex items-center text-gray-900">
                      <Clock className="h-4 w-4 mr-2" />
                      {formatDate(session.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Topics */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Topics ({topics.length})</h3>
            </div>
            <div className="card-content">
              {topics.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No topics added to this session yet.</p>
              ) : (
                <div className="space-y-3">
                  {topics.map((topic) => (
                    <div key={topic.id} className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-1">{topic.title}</h4>
                      {topic.description && (
                        <p className="text-sm text-gray-600">{topic.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          Order: {topic.order_index}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(topic.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Room Code */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Room Code</h3>
            </div>
            <div className="card-content">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Share this code with participants</p>
                    <p className="text-lg font-mono text-gray-900">{session.room_code}</p>
                  </div>
                  <button
                    onClick={() => copyRoomCode(session.room_code)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <Copy className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Session Settings */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Session Settings</h3>
            </div>
            <div className="card-content">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Allow Chat</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    session.allow_chat ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {session.allow_chat ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Allow Emoticons</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    session.allow_emoticons ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {session.allow_emoticons ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Email Notifications</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    session.notify_email ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {session.notify_email ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Participants ({participants.length})</h3>
            </div>
            <div className="card-content">
              {participants.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No participants yet.</p>
              ) : (
                <div className="space-y-3">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center overflow-hidden">
                        {/* Note: We don't have profile_picture in the participant data from the API */}
                        <span className="text-white text-sm font-medium">
                          {participant.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{participant.name}</p>
                        <p className="text-xs text-gray-500">{participant.email}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(participant.joined_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 