'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'
import { useSettings } from '@/hooks/useSettings'
import { t } from '@/lib/i18n'
import { Users, Plus, Search, Edit, Trash2, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

interface User {
  id: number
  email: string
  name: string
  role: string
  status: string
  profile_picture?: string
  skillset?: string
  color_scheme?: string
  language?: string
  timezone?: string
  notifications?: string
  created_at: string
  updated_at?: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

const roles = [
  { value: 'user', label: 'user' },
  { value: 'admin', label: 'admin' },
  { value: 'product_owner', label: 'productOwner' },
  { value: 'product_manager', label: 'productManager' }
]

const statuses = [
  { value: 'active', label: 'active' },
  { value: 'inactive', label: 'inactive' }
]

export default function UsersPage() {
  const { user } = useAuth()
  const { settings } = useSettings()
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    status: 'active'
  })

  useEffect(() => {
    fetchUsers()
  }, [pagination.page, search, roleFilter, statusFilter])

  const fetchUsers = async () => {
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

      const response = await fetch(`/api/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      setUsers(data.users)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error(t('failedToLoadUsers', settings.language))
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || t('failedToCreateUser', settings.language))
      }

      toast.success(t('userCreatedSuccessfully', settings.language))
      setShowAddModal(false)
      setFormData({ name: '', email: '', password: '', role: 'user', status: 'active' })
      fetchUsers()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || t('failedToUpdateUser', settings.language))
      }

      toast.success(t('userUpdatedSuccessfully', settings.language))
      setShowEditModal(false)
      setSelectedUser(null)
      setFormData({ name: '', email: '', password: '', role: 'user', status: 'active' })
      fetchUsers()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm(t('confirmDeleteUser', settings.language))) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || t('failedToDeleteUser', settings.language))
      }

      toast.success(t('userDeletedSuccessfully', settings.language))
      fetchUsers()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      status: user.status
    })
    setShowEditModal(true)
  }

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', role: 'user', status: 'active' })
    setSelectedUser(null)
  }

  const getRoleLabel = (role: string) => {
    const roleObj = roles.find(r => r.value === role)
    return roleObj ? t(roleObj.label as any, settings.language) : role
  }

  const getStatusLabel = (status: string) => {
    const statusObj = statuses.find(s => s.value === status)
    return statusObj ? t(statusObj.label as any, settings.language) : status
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('usersManagement', settings.language)}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {t('manageTeamMembers', settings.language)}
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary btn-md flex items-center"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('addUser', settings.language)}
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
                placeholder={t('searchUsers', settings.language)}
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
              <option value="">{t('allStatus', settings.language)}</option>
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
              }}
              className="btn-outline btn-md"
            >
              {t('clearFilters', settings.language)}
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-content">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">{t('name', settings.language)}</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">{t('email', settings.language)}</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">{t('role', settings.language)}</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">{t('status', settings.language)}</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">{t('created', settings.language)}</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">{t('actions', settings.language)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center mr-3 overflow-hidden">
                              {user.profile_picture ? (
                                <img
                                  src={`/api/uploads/${user.profile_picture}`}
                                  alt={user.name}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                    target.nextElementSibling?.classList.remove('hidden')
                                  }}
                                />
                              ) : null}
                              <span className={`text-white text-sm font-medium ${user.profile_picture ? 'hidden' : ''}`}>
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">{user.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{user.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                            user.role === 'product_owner' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                            user.role === 'product_manager' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {getRoleLabel(user.role)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {getStatusLabel(user.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => openEditModal(user)}
                              className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                              title={t('editUser', settings.language)}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                              title={t('deleteUser', settings.language)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-6">
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
            </>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('addNewUser', settings.language)}</h3>
            <form onSubmit={handleAddUser}>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('password', settings.language)}</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('role', settings.language)}</label>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('status', settings.language)}</label>
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
                  {t('addUser', settings.language)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('editUser', settings.language)}</h3>
            <form onSubmit={handleEditUser}>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('role', settings.language)}</label>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('status', settings.language)}</label>
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
                  {t('updateUser', settings.language)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
} 