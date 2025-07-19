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
    <div className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <span className="text-white font-bold text-sm">PP</span>
          </div>
          <span className="sidebar-title">Poker Planning</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="sidebar-close-btn"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group sidebar-link ${
                isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'
              }`}
              onClick={onClose}
            >
              <item.icon
                className={`sidebar-icon ${
                  isActive ? 'sidebar-icon-active' : 'sidebar-icon-inactive'
                }`}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="sidebar-footer">
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="sidebar-profile-btn"
          >
            <div className="sidebar-avatar">
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
              <span className={`sidebar-avatar-text ${user?.profile_picture ? 'hidden' : ''}`}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="sidebar-profile-info">
              <p className="sidebar-profile-name">{user?.name}</p>
              <p className="sidebar-profile-email">{user?.email}</p>
            </div>
          </button>

          {/* Profile Dropdown */}
          {isProfileOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 rounded-lg shadow-lg border py-1 dropdown-menu">
              <Link
                href="/dashboard/profile"
                className="dropdown-item"
                onClick={() => setIsProfileOpen(false)}
              >
                Profile Settings
              </Link>
              <button
                onClick={handleLogout}
                className="dropdown-item w-full text-left"
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