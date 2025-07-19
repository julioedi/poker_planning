'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { 
  Home, 
  PlusCircle, 
  Users, 
  Folder, 
  BarChart3,
  Settings,
  X
} from 'lucide-react'

interface SidebarProps {
  onClose?: () => void
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Create Planning', href: '/dashboard/create', icon: PlusCircle },
    { name: 'My Sessions', href: '/dashboard/sessions', icon: BarChart3 },
    { name: 'Projects', href: '/dashboard/projects', icon: Folder },
    { name: 'Team', href: '/dashboard/team', icon: Users },
    ...(user?.role === 'admin' ? [{ name: 'Users', href: '/dashboard/users', icon: Users }] : []),
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="flex h-full flex-col bg-white shadow-lg">
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">PP</span>
          </div>
          <span className="ml-3 text-lg font-semibold text-gray-900">Poker Planning</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
              onClick={onClose}
            >
              <item.icon
                className={`mr-3 h-5 w-5 flex-shrink-0 ${
                  isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-gray-200 p-4">
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex w-full items-center space-x-3 rounded-lg p-2 text-sm hover:bg-gray-50 focus:outline-none"
          >
            <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center overflow-hidden">
                             {user?.profile_picture ? (
                 <img
                   src={`http://localhost:5000/uploads/${user.profile_picture}`}
                   alt={user.name}
                   className="h-full w-full object-cover"
                   onError={(e) => {
                     const target = e.target as HTMLImageElement
                     target.style.display = 'none'
                     target.nextElementSibling?.classList.remove('hidden')
                   }}
                 />
               ) : null}
              <span className={`text-white text-sm font-medium ${user?.profile_picture ? 'hidden' : ''}`}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </button>

          {/* Profile Dropdown */}
          {isProfileOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
              <Link
                href="/dashboard/profile"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setIsProfileOpen(false)}
              >
                Profile Settings
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 