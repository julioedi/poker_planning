'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'
import { useSettings } from '@/hooks/useSettings'
import { t } from '@/lib/i18n'
import { Users, Plus, Search, Edit, Trash2, UserPlus, Crown, Shield, User, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

interface TeamMember {
  id: number
  name: string
  email: string
  role: string
  status: string
  profile_picture?: string
  skillset?: string[]
  project_count: number
  session_count: number
  created_at: string
  updated_at: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

const roles = [
  { value: 'member', label: 'member', icon: User },
  { value: 'lead', label: 'lead', icon: Shield },
  { value: 'admin', label: 'admin', icon: Crown }
]

const statuses = [
  { value: 'active', label: 'active' },
  { value: 'inactive', label: 'inactive' },
  { value: 'pending', label: 'pending' }
]

export default function TeamPage() {
  const { user } = useAuth()
  const { settings } = useSettings()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'member',
    status: 'active'
  })

  useEffect(() => {
    fetchTeamMembers()
  }, [pagination.page, search, roleFilter, statusFilter])

  const fetchTeamMembers = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { status: statusFilter })
      })

      const response = await fetch(`http://localhost:5000/api/team?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch team members')
      }

      const data = await response.json()
      setTeamMembers(data.team_members || [])
      setPagination(data.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        total_pages: 0,
        has_next: false,
        has_prev: false
      })
    } catch (error) {
      console.error('Error fetching team members:', error)
      toast.error(t('failedToLoadTeam', settings.language))
      setTeamMembers([])
      setPagination({
        page: 1,
        limit: 10,
        total: 0,
        total_pages: 0,
        has_next: false,
        has_prev: false
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.password.trim()) {
      toast.error(t('passwordRequired', settings.language))
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || t('failedToAddMember', settings.language))
      }

      toast.success(t('teamMemberAdded', settings.language))
      setShowAddModal(false)
      setFormData({ name: '', email: '', password: '', role: 'member', status: 'active' })
      setShowPassword(false)
      fetchTeamMembers()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMember) return

    try {
      const token = localStorage.getItem('token')
      const updateData = { ...formData }
      
      // Only include password if it's been changed
      if (!updateData.password.trim()) {
        delete updateData.password
      }

      const response = await fetch(`http://localhost:5000/api/team/${selectedMember.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || t('failedToUpdateMember', settings.language))
      }

      toast.success(t('teamMemberUpdated', settings.language))
      setShowEditModal(false)
      setSelectedMember(null)
      setFormData({ name: '', email: '', password: '', role: 'member', status: 'active' })
      setShowPassword(false)
      fetchTeamMembers()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm(t('confirmRemoveMember', settings.language))) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/team/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || t('failedToRemoveMember', settings.language))
      }

      toast.success(t('teamMemberRemoved', settings.language))
      fetchTeamMembers()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const openEditModal = (member: TeamMember) => {
    setSelectedMember(member)
    setFormData({
      name: member.name,
      email: member.email,
      password: '', // Don't populate password for security
      role: member.role,
      status: member.status
    })
    setShowPassword(false)
    setShowEditModal(true)
  }

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', role: 'member', status: 'active' })
    setShowPassword(false)
    setSelectedMember(null)
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData(prev => ({ ...prev, password }))
  }

  const getRoleLabel = (role: string) => {
    const roleObj = roles.find(r => r.value === role)
    return roleObj ? t(roleObj.label as any, settings.language) : role
  }

  const getStatusLabel = (status: string) => {
    const statusObj = statuses.find(s => s.value === status)
    return statusObj ? t(statusObj.label as any, settings.language) : status
  }

  const getRoleIcon = (role: string) => {
    const roleObj = roles.find(r => r.value === role)
    return roleObj ? roleObj.icon : User
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('teamMembers', settings.language)}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {t('manageTeam', settings.language)}
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary btn-md flex items-center"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {t('addTeamMember', settings.language)}
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
                placeholder={t('searchTeamMembers', settings.language)}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input"
            >
              <option value="">{t('allRoles', settings.language)}</option>
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {t(role.label as any, settings.language)}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">{t('allStatuses', settings.language)}</option>
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {t(status.label as any, settings.language)}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setSearch('')
                setRoleFilter('')
                setStatusFilter('')
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className="btn-outline btn-md"
            >
              {t('clearFilters', settings.language)}
            </button>
          </div>
        </div>
      </div>

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : teamMembers && teamMembers.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              {t('noTeamMembers', settings.language)}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('getStartedByAdding', settings.language)}
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary btn-md"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {t('addTeamMember', settings.language)}
              </button>
            </div>
          </div>
        ) : (
          teamMembers && teamMembers.map((member) => {
            const RoleIcon = getRoleIcon(member.role)
            return (
              <div key={member.id} className="card hover:shadow-lg transition-shadow">
                <div className="card-content">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-full bg-primary-600 flex items-center justify-center mr-3 overflow-hidden">
                        {member.profile_picture ? (
                          <img
                            src={`http://localhost:5000/uploads/${member.profile_picture}`}
                            alt={member.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              target.nextElementSibling?.classList.remove('hidden')
                            }}
                          />
                        ) : null}
                        <span className={`text-white font-medium ${member.profile_picture ? 'hidden' : ''}`}>
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{member.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditModal(member)}
                        className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        title={t('editTeamMember', settings.language)}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        title={t('removeTeamMember', settings.language)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('memberRole', settings.language)}</span>
                      <div className="flex items-center">
                        <RoleIcon className="h-4 w-4 mr-1 text-primary-600" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {getRoleLabel(member.role)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('memberStatus', settings.language)}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        member.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                        member.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                        'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {getStatusLabel(member.status)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('projects', settings.language)}</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {member.project_count}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('sessions', settings.language)}</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {member.session_count}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('joinDate', settings.language)}</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {new Date(member.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {member.skillset && member.skillset.length > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{t('skills', settings.language)}</span>
                        <div className="flex flex-wrap gap-1">
                          {member.skillset.slice(0, 3).map((skill, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 text-xs rounded">
                              {skill}
                            </span>
                          ))}
                          {member.skillset.length > 3 && (
                            <span className="text-xs text-gray-500">+{member.skillset.length - 3}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
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
              disabled={!pagination.has_prev}
              className="btn-outline btn-sm disabled:opacity-50"
            >
              {t('previous', settings.language)}
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={!pagination.has_next}
              className="btn-outline btn-sm disabled:opacity-50"
            >
              {t('next', settings.language)}
            </button>
          </div>
        </div>
      )}

      {/* Add Team Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('addTeamMember', settings.language)}</h3>
            <form onSubmit={handleAddMember}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('name', settings.language)}</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('email', settings.language)}</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('password', settings.language)} *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="input pr-10"
                      placeholder={t('enterPassword', settings.language)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {t('generatePassword', settings.language)}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('memberRole', settings.language)}</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="input"
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {t(role.label as any, settings.language)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('memberStatus', settings.language)}</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="input"
                  >
                    {statuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {t(status.label as any, settings.language)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-outline btn-md"
                >
                  {t('cancel', settings.language)}
                </button>
                <button
                  type="submit"
                  className="btn-primary btn-md"
                >
                  {t('addTeamMember', settings.language)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Team Member Modal */}
      {showEditModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('editTeamMember', settings.language)}</h3>
            <form onSubmit={handleEditMember}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('name', settings.language)}</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('email', settings.language)}</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('password', settings.language)} ({t('leaveBlankToKeep', settings.language)})
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="input pr-10"
                      placeholder={t('enterNewPassword', settings.language)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {t('generatePassword', settings.language)}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('memberRole', settings.language)}</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="input"
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {t(role.label as any, settings.language)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('memberStatus', settings.language)}</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="input"
                  >
                    {statuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {t(status.label as any, settings.language)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn-outline btn-md"
                >
                  {t('cancel', settings.language)}
                </button>
                <button
                  type="submit"
                  className="btn-primary btn-md"
                >
                  {t('updateTeamMember', settings.language)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
} 