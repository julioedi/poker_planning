'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'
import { useSettings } from '@/hooks/useSettings'
import { t } from '@/lib/i18n'
import { 
  BarChart3, 
  Plus, 
  Search, 
  Play, 
  Square, 
  Edit, 
  Eye, 
  Copy,
  Calendar,
  Users,
  Clock,
  Filter
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
  user_role: 'creator' | 'participant'
  participant_count: number
  topic_count: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export default function SessionsPage() {
  const { user } = useAuth()
  const { settings } = useSettings()
  const [sessions, setSessions] = useState<PlanningSession[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [projects, setProjects] = useState<Array<{id: number, name: string}>>([])

  useEffect(() => {
    fetchSessions()
    fetchProjects()
  }, [pagination.page, search, statusFilter, projectFilter])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(projectFilter && { project_id: projectFilter })
      })

      const response = await fetch(`/api/poker-planning/my-sessions?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch sessions')
      }

      const data = await response.json()
      setSessions(data.planningSessions)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching sessions:', error)
      toast.error(t('failedToLoadSessions', settings.language))
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

  const handleStartSession = async (sessionId: number) => {
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
        throw new Error(error.error || t('failedToStartSession', settings.language))
      }

      toast.success(t('sessionStarted', settings.language))
      fetchSessions()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleEndSession = async (sessionId: number) => {
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
        throw new Error(error.error || t('failedToEndSession', settings.language))
      }

      toast.success(t('sessionEnded', settings.language))
      fetchSessions()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const copyRoomCode = (roomCode: string) => {
    navigator.clipboard.writeText(roomCode)
    toast.success(t('roomCodeCopied', settings.language))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'completed':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getRoleColor = (role: string) => {
    return role === 'creator' 
      ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' 
      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
  }

  const getStatusLabel = (status: string) => {
    return t(`sessionStatuses.${status}` as any, settings.language) || status
  }

  const getRoleLabel = (role: string) => {
    return t(`userRoles.${role}` as any, settings.language) || role
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return t('notSet', settings.language)
    return new Date(dateString).toLocaleDateString(settings.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('mySessions', settings.language)}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {t('viewAndManageSessions', settings.language)}
            </p>
          </div>
          <Link
            href="/dashboard/create"
            className="btn-primary btn-md flex items-center"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('createSession', settings.language)}
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-content" style={{ paddingTop: '1.5rem' }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
              <input
                type="text"
                placeholder={t('searchSessions', settings.language)}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input"
                style={{ paddingLeft: '3rem' }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">{t('allStatus', settings.language)}</option>
              <option value="draft">{t('sessionStatuses.draft', settings.language)}</option>
              <option value="scheduled">{t('sessionStatuses.scheduled', settings.language)}</option>
              <option value="active">{t('sessionStatuses.active', settings.language)}</option>
              <option value="completed">{t('sessionStatuses.completed', settings.language)}</option>
            </select>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="input"
            >
              <option value="">{t('allProjects', settings.language)}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setSearch('')
                setStatusFilter('')
                setProjectFilter('')
              }}
              className="btn-outline btn-md flex items-center justify-center"
            >
              <Filter className="mr-2 h-4 w-4" />
              {t('clear', settings.language)}
            </button>
          </div>
        </div>
      </div>

      {/* Sessions Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pfrimary-600"></div>
        </div>
      ) : sessions.length === 0 ? (
        <div className="card">
          <div className="card-content text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t('noSessionsFound', settings.language)}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {search || statusFilter || projectFilter 
                ? t('tryAdjustingFilters', settings.language)
                : t('noSessionsYet', settings.language)
              }
            </p>
            <Link href="/dashboard/create" className="btn-primary btn-md">
              {t('createFirstSession', settings.language)}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <div key={session.id} className="card hover:shadow-md transition-shadow">
              <div className="card-content pt-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                      {session.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{session.project_name}</p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                      {getStatusLabel(session.status)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(session.user_role)}`}>
                      {getRoleLabel(session.user_role)}
                    </span>
                  </div>
                </div>

                {/* Session Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{formatDate(session.scheduled_at)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{session.participant_count} {t('participants', settings.language)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    <span>{session.topic_count} {t('topics', settings.language)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{t('created', settings.language)} {formatDate(session.created_at)}</span>
                  </div>
                </div>

                {/* Room Code */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('roomCode', settings.language)}
                      </p>
                      <p className="text-sm font-mono text-gray-900 dark:text-white">{session.room_code}</p>
                    </div>
                    <button
                      onClick={() => copyRoomCode(session.room_code)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {session.status === 'draft' && session.user_role === 'creator' && (
                    <>
                      <button
                        onClick={() => handleStartSession(session.id)}
                        className="btn-primary btn-sm flex items-center flex-1"
                      >
                        <Play className="mr-1 h-3 w-3" />
                        {t('start', settings.language)}
                      </button>
                      <Link
                        href={`/dashboard/sessions/${session.id}/edit`}
                        className="btn-outline btn-sm p-2"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                    </>
                  )}
                  
                  {session.status === 'active' && session.user_role === 'creator' && (
                    <>
                      <Link
                        href={`/room/${session.room_code}`}
                        className="btn-primary btn-sm flex items-center flex-1"
                      >
                        <Eye className="mr-1 h-3 w-3" />
                        {t('join', settings.language)}
                      </Link>
                      <button
                        onClick={() => handleEndSession(session.id)}
                        className="btn-outline btn-sm flex items-center"
                      >
                        <Square className="mr-1 h-3 w-3" />
                        {t('end', settings.language)}
                      </button>
                    </>
                  )}

                  {session.status === 'scheduled' && (
                    <Link
                      href={`/room/${session.room_code}`}
                      className="btn-primary btn-sm flex items-center w-full"
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      {t('join', settings.language)}
                    </Link>
                  )}

                  {session.status === 'completed' && (
                    <Link
                      href={`/dashboard/sessions/${session.id}`}
                      className="btn-outline btn-sm flex items-center w-full"
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      {t('viewResults', settings.language)}
                    </Link>
                  )}

                  {session.user_role === 'participant' && session.status !== 'completed' && (
                    <Link
                      href={`/room/${session.room_code}`}
                      className="btn-primary btn-sm flex items-center w-full"
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      {t('joinSession', settings.language)}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {t('showingSessions', settings.language, {
              from: ((pagination.page - 1) * pagination.limit) + 1,
              to: Math.min(pagination.page * pagination.limit, pagination.total),
              total: pagination.total
            })}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="btn-outline btn-sm disabled:opacity-50"
            >
              {t('previous', settings.language)}
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="btn-outline btn-sm disabled:opacity-50"
            >
              {t('next', settings.language)}
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
} 