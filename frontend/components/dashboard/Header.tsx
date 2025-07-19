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
    <header className="dashboard-header">
      <div className="header-container">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="header-menu-btn"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Search */}
        <div className="header-search-container">
          <div className="header-search-wrapper">
            <div className="header-search-icon">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              placeholder="Search projects, sessions..."
              className="header-search-input"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="header-actions">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="header-notification-btn"
            >
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="header-notification-badge">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications dropdown */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-lg shadow-lg border py-1 z-50 dropdown-menu">
                <div className="header-dropdown-header">
                  <h3 className="header-dropdown-title">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`header-notification-item ${
                          notification.unread ? 'unread' : ''
                        }`}
                      >
                        <div className="header-notification-content">
                          <div className="header-notification-text">
                            <p className="header-notification-title">
                              {notification.title}
                            </p>
                            <p className="header-notification-message">
                              {notification.message}
                            </p>
                            <p className="header-notification-time">
                              {notification.time}
                            </p>
                          </div>
                          {notification.unread && (
                            <div className="header-notification-dot"></div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm header-dropdown-subtitle">
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
              className="header-profile-btn"
            >
              <div className="header-avatar">
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
                <span className={`header-avatar-text ${user?.profile_picture ? 'hidden' : ''}`}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="header-profile-info">
                <p className="header-profile-name">{user?.name}</p>
                <p className="header-profile-email">{user?.email}</p>
              </div>
            </button>

            {/* Profile dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg border py-1 z-50 dropdown-menu">
                <div className="header-dropdown-header">
                  <p className="header-dropdown-title">{user?.name}</p>
                  <p className="header-dropdown-subtitle">{user?.email}</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/dashboard/profile"
                    className="header-dropdown-item"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <User className="header-dropdown-icon" />
                    Profile
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="header-dropdown-item"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <Settings className="header-dropdown-icon" />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="header-dropdown-item"
                  >
                    <LogOut className="header-dropdown-icon" />
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
          className="header-overlay"
          onClick={() => {
            setIsProfileOpen(false)
            setIsNotificationsOpen(false)
          }}
        />
      )}
    </header>
  )
} 