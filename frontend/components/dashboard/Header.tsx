'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { 
  Menu, 
  Search, 
  Bell, 
  User,
  Settings,
  LogOut
} from 'lucide-react'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
  }

  // Mock notifications data
  const notifications = [
    {
      id: 1,
      title: 'New planning session created',
      message: 'Team Alpha has started a new planning session',
      time: '2 minutes ago',
      unread: true
    },
    {
      id: 2,
      title: 'Session reminder',
      message: 'Your planning session starts in 30 minutes',
      time: '1 hour ago',
      unread: true
    },
    {
      id: 3,
      title: 'Project updated',
      message: 'Project "E-commerce Platform" has been updated',
      time: '3 hours ago',
      unread: false
    }
  ]

  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <header className="shadow-sm border-b" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Search */}
        <div className="flex-1 max-w-lg mx-4 lg:mx-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5" style={{ color: 'var(--muted-foreground)' }} />
            </div>
            <input
              type="text"
              placeholder="Search projects, sessions..."
              className="block w-full pl-10 pr-3 py-2 border rounded-md leading-5 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              style={{ 
                backgroundColor: 'var(--input)', 
                borderColor: 'var(--border)', 
                color: 'var(--foreground)' 
              }}
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2 rounded-md hover:bg-gray-100 relative"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications dropdown */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-lg shadow-lg border py-1 z-50 dropdown-menu">
                <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                  <h3 className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`px-4 py-3 cursor-pointer dropdown-item ${
                          notification.unread ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <div className="flex items-start">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                              {notification.title}
                            </p>
                            <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                              {notification.message}
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                              {notification.time}
                            </p>
                          </div>
                          {notification.unread && (
                            <div className="ml-2 h-2 w-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      No notifications
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User profile */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 focus:outline-none"
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
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{user?.name}</p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{user?.email}</p>
              </div>
            </button>

            {/* Profile dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg border py-1 z-50 dropdown-menu">
                <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{user?.name}</p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{user?.email}</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/dashboard/profile"
                    className="flex w-full items-center px-4 py-2 text-sm dropdown-item"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <User className="mr-3 h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="flex w-full items-center px-4 py-2 text-sm dropdown-item"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <Settings className="mr-3 h-4 w-4" />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center px-4 py-2 text-sm dropdown-item"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(isProfileOpen || isNotificationsOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsProfileOpen(false)
            setIsNotificationsOpen(false)
          }}
        />
      )}
    </header>
  )
} 