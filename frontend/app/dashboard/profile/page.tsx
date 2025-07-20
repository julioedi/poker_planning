'use client'

import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'
import { User, Mail, Lock, Save, Camera, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface ProfileFormData {
  name: string
  email: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploadingPicture, setUploadingPicture] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }))
    }
  }, [user])

  const handlePictureUpload = async (file: File) => {
    // Validate file type
    if (!file.type.match(/image\/(jpeg|webp)/)) {
      toast.error('Only JPG and WebP files are allowed')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    // Validate image dimensions
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    img.onload = async () => {
      if (img.width < 256 || img.height < 256) {
        toast.error('Image must be at least 256x256 pixels')
        return
      }

      try {
        setUploadingPicture(true)
        const token = localStorage.getItem('token')
        const formData = new FormData()
        formData.append('profile_picture', file)

        const response = await fetch('/api/users/profile/picture', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to upload profile picture')
        }

        const result = await response.json()
        toast.success('Profile picture updated successfully')
        
        // Update user context with new profile picture
        updateUser({ profile_picture: result.filename })
      } catch (error: any) {
        toast.error(error.message)
      } finally {
        setUploadingPicture(false)
      }
    }

    img.onerror = () => {
      toast.error('Invalid image file')
    }

    img.src = URL.createObjectURL(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handlePictureUpload(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate password confirmation
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const updateData: any = {
        name: formData.name,
        email: formData.email
      }

      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword
        updateData.newPassword = formData.newPassword
      }

      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update profile')
      }

      const result = await response.json()
      toast.success('Profile updated successfully')
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))

      // Update user context with new data
      if (result.user) {
        updateUser(result.user)
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold ">Profile Settings</h1>
        <p className="mt-2">
          Update your personal information and account settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Personal Information</h3>
            </div>
            <div className="card-content">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium  mb-2">
                    <User className="inline h-4 w-4 mr-2" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="input"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium  mb-2">
                    <Mail className="inline h-4 w-4 mr-2" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="input"
                    placeholder="Enter your email address"
                  />
                </div>

                {/* Password Change Section */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-lg font-medium  mb-4">Change Password</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium  mb-2">
                        <Lock className="inline h-4 w-4 mr-2" />
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={formData.currentPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="input"
                        placeholder="Enter current password (required to change password)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium  mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="input"
                        placeholder="Enter new password (min 6 characters)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium  mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="input"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary btn-md flex items-center"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {loading ? 'Updating...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Profile Summary */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Profile Summary</h3>
            </div>
            <div className="card-content">
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="h-24 w-24 rounded-full overflow-hidden bg-primary-600 flex items-center justify-center mx-auto mb-4">
                                         {user.profile_picture ? (
                       <img
                         src={`http://localhost:5000/uploads/${user.profile_picture}`}
                         alt={user.name}
                         className="h-full w-full object-cover"
                         onError={(e) => {
                           // Fallback to initials if image fails to load
                           const target = e.target as HTMLImageElement
                           target.style.display = 'none'
                           target.nextElementSibling?.classList.remove('hidden')
                         }}
                       />
                     ) : null}
                    <span className={`text-white text-2xl font-bold ${user.profile_picture ? 'hidden' : ''}`}>
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPicture}
                    className="absolute bottom-0 right-0 h-8 w-8 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {uploadingPicture ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <h4 className="text-lg font-semibold ">{user.name}</h4>
                <p className="">{user.email}</p>
                <p className="text-xs  mt-2">
                  Click the camera icon to upload a profile picture
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm ">Role</span>
                  <span className="text-sm font-medium  capitalize">
                    {user.role?.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm ">Status</span>
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                    user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.status}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm ">Member Since</span>
                  <span className="text-sm font-medium ">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="card mt-6">
            <div className="card-header">
              <h3 className="card-title">Account Actions</h3>
            </div>
            <div className="card-content">
              <div className="space-y-3">
                <button
                  onClick={logout}
                  className="w-full btn-outline btn-md  hover:bg-red-50 hover:border-red-300"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 