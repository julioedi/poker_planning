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
    <div className="flex h-full flex-col shadow-lg" style={{ backgroundColor: 'var(--sidebar-bg)' }}>
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
        <div className="flex items-center">
          <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">PP</span>
          </div>
          <span className="ml-3 text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Poker Planning</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            style={{ color: 'var(--muted-foreground)' }}
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
                isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'
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
      <div className="border-t p-4" style={{ borderColor: 'var(--sidebar-border)' }}>
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex w-full items-center space-x-3 rounded-lg p-2 text-sm focus:outline-none"
            style={{ color: 'var(--foreground)' }}
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
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{user?.name}</p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{user?.email}</p>
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