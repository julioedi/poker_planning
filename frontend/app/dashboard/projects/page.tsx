'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'
import { useSettings } from '@/hooks/useSettings'
import { t } from '@/lib/i18n'
import { Folder, Plus, Search, Edit, Trash2, Calendar, Users, Clock, CheckCircle, XCircle, Pause } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Project {
  id: number
  name: string
  description: string
  type: string
  status: string
  start_date: string
  end_date?: string
  owner: string
  members_count: number
  sessions_count: number
  created_at: string
  updated_at?: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

const projectTypes = [
  { value: 'web', label: 'projectTypes.web' },
  { value: 'mobile', label: 'projectTypes.mobile' },
  { value: 'desktop', label: 'projectTypes.desktop' },
  { value: 'api', label: 'projectTypes.api' },
  { value: 'database', label: 'projectTypes.database' },
  { value: 'infrastructure', label: 'projectTypes.infrastructure' },
  { value: 'other', label: 'projectTypes.other' }
]

const projectStatuses = [
  { value: 'planning', label: 'projectStatuses.planning', icon: Clock, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
  { value: 'active', label: 'projectStatuses.active', icon: CheckCircle, color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
  { value: 'onHold', label: 'projectStatuses.onHold', icon: Pause, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
  { value: 'completed', label: 'projectStatuses.completed', icon: CheckCircle, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' },
  { value: 'cancelled', label: 'projectStatuses.cancelled', icon: XCircle, color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' }
]

export default function ProjectsPage() {
  const { user } = useAuth()
  const { settings } = useSettings()
  const [projects, setProjects] = useState<Project[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'web',
    customType: '',
    status: 'planning',
    start_date: '',
    end_date: ''
  })

  useEffect(() => {
    fetchProjects()
  }, [pagination.page, search, typeFilter, statusFilter])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(typeFilter && { type: typeFilter }),
        ...(statusFilter && { status: statusFilter })
      })

      const response = await fetch(`/api/projects?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }

      const data = await response.json()
      setProjects(data.projects)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast.error(t('failedToLoadProjects', settings.language))
    } finally {
      setLoading(false)
    }
  }

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || t('failedToCreateProject', settings.language))
      }

      toast.success(t('projectCreated', settings.language))
      setShowAddModal(false)
      setFormData({ name: '', description: '', type: 'web', customType: '', status: 'planning', start_date: '', end_date: '' })
      fetchProjects()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/projects/${selectedProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || t('failedToUpdateProject', settings.language))
      }

      toast.success(t('projectUpdated', settings.language))
      setShowEditModal(false)
      setSelectedProject(null)
      setFormData({ name: '', description: '', type: 'web', customType: '', status: 'planning', start_date: '', end_date: '' })
      fetchProjects()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleDeleteProject = async (projectId: number) => {
    if (!confirm(t('confirmDeleteProject', settings.language))) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || t('failedToDeleteProject', settings.language))
      }

      toast.success(t('projectDeleted', settings.language))
      fetchProjects()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const openEditModal = (project: Project) => {
    // Check if this is a custom type by seeing if it's not in the predefined types
    const isCustomType = !projectTypes.find(t => t.value === project.type);
    
    setSelectedProject(project)
    setFormData({
      name: project.name,
      description: project.description,
      type: isCustomType ? 'other' : project.type,
      customType: isCustomType ? project.type : '',
      status: project.status,
      start_date: project.start_date,
      end_date: project.end_date || ''
    })
    setShowEditModal(true)
  }

  const resetForm = () => {
    setFormData({ name: '', description: '', type: 'web', customType: '', status: 'planning', start_date: '', end_date: '' })
    setSelectedProject(null)
  }

  const getTypeLabel = (type: string) => {
    // Check if this is a custom type by seeing if it's not in the predefined types
    const isCustomType = !projectTypes.find(t => t.value === type);
    
    if (isCustomType) {
      return type; // Return the custom type name directly
    }
    
    const typeObj = projectTypes.find(t => t.value === type)
    return typeObj ? t(typeObj.label as any, settings.language) : type
  }

  const getStatusLabel = (status: string) => {
    const statusObj = projectStatuses.find(s => s.value === status)
    return statusObj ? t(statusObj.label as any, settings.language) : status
  }

  const getStatusIcon = (status: string) => {
    const statusObj = projectStatuses.find(s => s.value === status)
    return statusObj ? statusObj.icon : Clock
  }

  const getStatusColor = (status: string) => {
    const statusObj = projectStatuses.find(s => s.value === status)
    return statusObj ? statusObj.color : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('projects', settings.language)}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {t('manageProjects', settings.language)}
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary btn-md flex items-center"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('addProject', settings.language)}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('searchProjects', settings.language)}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input"
            >
              <option value="">{t('allTypes', settings.language)}</option>
              {projectTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {t(type.label as any, settings.language)}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">{t('allStatus', settings.language)}</option>
              {projectStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {t(status.label as any, settings.language)}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setSearch('')
                setTypeFilter('')
                setStatusFilter('')
              }}
              className="btn-outline btn-md"
            >
              {t('clearFilters', settings.language)}
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Folder className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              {t('noProjects', settings.language)}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('getStartedByCreating', settings.language)}
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary btn-md"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('addProject', settings.language)}
              </button>
            </div>
          </div>
        ) : (
          projects.map((project) => {
            const StatusIcon = getStatusIcon(project.status)
            return (
              <Link href={`/dashboard/projects/${project.id}`} key={project.id} className="card hover:shadow-lg transition-shadow block">
                <div className="card-content">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-lg bg-primary-600 flex items-center justify-center mr-3">
                        <Folder className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{project.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{getTypeLabel(project.type)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={e => { e.preventDefault(); e.stopPropagation(); openEditModal(project); }}
                        className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        title={t('editProject', settings.language)}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={e => { e.preventDefault(); e.stopPropagation(); handleDeleteProject(project.id); }}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        title={t('deleteProject', settings.language)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {project.description}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('projectStatus', settings.language)}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                        <StatusIcon className="inline h-3 w-3 mr-1" />
                        {getStatusLabel(project.status)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('startDate', settings.language)}</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {new Date(project.start_date).toLocaleDateString()}
                      </span>
                    </div>

                    {project.end_date ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('endDate', settings.language)}</span>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {new Date(project.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('endDate', settings.language)}</span>
                        <span className="text-sm text-gray-900 dark:text-white italic opacity-70">
                          {t('on_going', settings.language)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('projectMembers', settings.language)}</span>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white">{project.members_count}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('planningSessions', settings.language)}</span>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white">{project.sessions_count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {t('showingResults', settings.language, {
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

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('addProject', settings.language)}</h3>
            <form onSubmit={handleAddProject}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('projectName', settings.language)}</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('projectDescription', settings.language)}</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="input"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('projectType', settings.language)}</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="input"
                  >
                    {projectTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {t(type.label as any, settings.language)}
                      </option>
                    ))}
                  </select>
                </div>
                {formData.type === 'other' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('customType', settings.language)}</label>
                    <input
                      type="text"
                      required
                      placeholder={t('enterCustomType', settings.language)}
                      value={formData.customType}
                      onChange={(e) => setFormData(prev => ({ ...prev, customType: e.target.value }))}
                      className="input"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('projectStatus', settings.language)}</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="input"
                  >
                    {projectStatuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {t(status.label as any, settings.language)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('startDate', settings.language)}</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('endDate', settings.language)}</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    resetForm()
                  }}
                  className="btn-outline btn-md flex-1"
                >
                  {t('cancel', settings.language)}
                </button>
                <button type="submit" className="btn-primary btn-md flex-1">
                  {t('addProject', settings.language)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('editProject', settings.language)}</h3>
            <form onSubmit={handleEditProject}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('projectName', settings.language)}</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('projectDescription', settings.language)}</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="input"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('projectType', settings.language)}</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="input"
                  >
                    {projectTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {t(type.label as any, settings.language)}
                      </option>
                    ))}
                  </select>
                </div>
                {formData.type === 'other' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('customType', settings.language)}</label>
                    <input
                      type="text"
                      required
                      placeholder={t('enterCustomType', settings.language)}
                      value={formData.customType}
                      onChange={(e) => setFormData(prev => ({ ...prev, customType: e.target.value }))}
                      className="input"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('projectStatus', settings.language)}</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="input"
                  >
                    {projectStatuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {t(status.label as any, settings.language)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('startDate', settings.language)}</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('endDate', settings.language)}</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    resetForm()
                  }}
                  className="btn-outline btn-md flex-1"
                >
                  {t('cancel', settings.language)}
                </button>
                <button type="submit" className="btn-primary btn-md flex-1">
                  {t('updateProject', settings.language)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
} 