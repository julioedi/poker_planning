'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'
import { useSettings } from '@/hooks/useSettings'
import { Settings, Palette, Globe, Clock, Bell, Code, Save } from 'lucide-react'
import toast from 'react-hot-toast'

interface UserSettings {
  skillset: string
  color_scheme: 'light' | 'dark' | 'auto'
  language: 'en' | 'es' | 'fr' | 'de'
  timezone: string
  notifications: 'all' | 'important' | 'none'
}

const colorSchemes = [
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'auto', label: 'Auto', icon: '🔄' }
]

const languages = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'de', label: 'Deutsch', flag: '🇩🇪' }
]

const notificationOptions = [
  { value: 'all', label: 'All notifications', description: 'Receive all notifications' },
  { value: 'important', label: 'Important only', description: 'Only important notifications' },
  { value: 'none', label: 'No notifications', description: 'Disable all notifications' }
]

const timezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney'
]

export default function SettingsPage() {
  const { user } = useAuth()
  const { settings, updateSettings } = useSettings()
  const [loading, setLoading] = useState(false)
  const [localSettings, setLocalSettings] = useState(settings)

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      const result = await updateSettings(localSettings)
      
      if (result.success) {
        toast.success('Settings updated successfully')
      } else {
        toast.error(result.error || 'Failed to update settings')
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleColorSchemeChange = (scheme: 'light' | 'dark' | 'auto') => {
    setLocalSettings(prev => ({ ...prev, color_scheme: scheme }))
  }

  const previewColorScheme = (scheme: 'light' | 'dark' | 'auto') => {
    const root = document.documentElement
    if (scheme === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else if (scheme === 'light') {
      root.classList.remove('dark')
      root.classList.add('light')
    } else {
      // Auto - check system preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark')
        root.classList.remove('light')
      } else {
        root.classList.remove('dark')
        root.classList.add('light')
      }
    }
  }

  const resetColorScheme = () => {
    // Reset to current settings
    const root = document.documentElement
    if (localSettings.color_scheme === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else if (localSettings.color_scheme === 'light') {
      root.classList.remove('dark')
      root.classList.add('light')
    } else {
      // Auto - check system preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark')
        root.classList.remove('light')
      } else {
        root.classList.remove('dark')
        root.classList.add('light')
      }
    }
  }

  if (!user) {
    return null
  }
  const skillset =  localSettings.skillset && typeof localSettings.skillset === 'string' ? localSettings.skillset : '';
  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Configure your account preferences and application settings
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Skillset Section */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center">
              <Code className="h-5 w-5 mr-2 text-primary-600" />
              <h3 className="card-title">Skillset</h3>
            </div>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              <div>
                <label htmlFor="skillset" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Skills & Expertise
                </label>
                <textarea
                  id="skillset"
                  value={skillset}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, skillset: e.target.value }))}
                  placeholder="e.g., React, Node.js, TypeScript, Agile, Scrum Master..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  rows={4}
                  maxLength={500}
                />
                                 <p className="text-xs text-gray-500 mt-1">
                   {skillset.length}/500 characters
                 </p>
              </div>
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center">
              <Palette className="h-5 w-5 mr-2 text-primary-600" />
              <h3 className="card-title">Appearance</h3>
            </div>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Color Scheme
                </label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {colorSchemes.map((scheme) => (
                    <button
                      key={scheme.value}
                      type="button"
                      onClick={() => previewColorScheme(scheme.value as 'light' | 'dark' | 'auto')}
                      // onMouseEnter={() => previewColorScheme(scheme.value as 'light' | 'dark' | 'auto')}
                      // onMouseLeave={resetColorScheme}
                      className={`p-4 border rounded-lg text-center transition-colors ${
                        localSettings.color_scheme === scheme.value
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                      }`}
                      style={{
                        backgroundColor: scheme.value === 'dark' ? '#1f2937' : 
                                       scheme.value === 'light' ? '#ffffff' : 
                                       'transparent',
                        color: scheme.value === 'dark' ? '#ffffff' : '#000000'
                      }}
                    >
                      <div className="text-2xl mb-2">{scheme.icon}</div>
                      <div className="font-medium">{scheme.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Language & Region Section */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center">
              <Globe className="h-5 w-5 mr-2 text-primary-600" />
              <h3 className="card-title">Language & Region</h3>
            </div>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Language
                </label>
                <select
                  id="language"
                  value={localSettings.language}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, language: e.target.value as 'en' | 'es' | 'fr' | 'de' }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                >
                  {languages.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.flag} {lang.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Timezone
                </label>
                <select
                  id="timezone"
                  value={localSettings.timezone}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, timezone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                >
                  {timezones.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center">
              <Bell className="h-5 w-5 mr-2 text-primary-600" />
              <h3 className="card-title">Notifications</h3>
            </div>
          </div>
          <div className="card-content">
            <div className="space-y-3">
              {notificationOptions.map((option) => (
                <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="notifications"
                    value={option.value}
                                         checked={localSettings.notifications === option.value}
                     onChange={(e) => setLocalSettings(prev => ({ ...prev, notifications: e.target.value as 'all' | 'important' | 'none' }))}
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {option.label}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {option.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary btn-lg flex items-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </DashboardLayout>
  )
} 