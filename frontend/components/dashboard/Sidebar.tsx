'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useSettings } from '@/hooks/useSettings'
import { t } from '@/lib/i18n'
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
  const { settings } = useSettings()
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const navigation = [
    { name: t('dashboard' as any, settings.language), href: '/dashboard', icon: Home },
    { name: t('createPlanning' as any, settings.language), href: '/dashboard/create', icon: PlusCircle },
    { name: t('mySessions' as any, settings.language), href: '/dashboard/sessions', icon: BarChart3 },
    { name: t('projects' as any, settings.language), href: '/dashboard/projects', icon: Folder },
    { name: t('team' as any, settings.language), href: '/dashboard/team', icon: Users },
    ...(user?.role === 'admin' ? [{ name: t('users', settings.language), href: '/dashboard/users', icon: Users }] : []),
    { name: t('settings', settings.language), href: '/dashboard/settings', icon: Settings },
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
          <span className="sidebar-title">{t('pokerPlanning', settings.language)}</span>
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
                {t('profileSettings', settings.language)}
              </Link>
              <button
                onClick={handleLogout}
                className="dropdown-item w-full text-left"
              >
                {t('signOut', settings.language)}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 