'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'

interface UserSettings {
  skillset: string
  color_scheme: 'light' | 'dark' | 'auto'
  language: 'en' | 'es' | 'fr' | 'de'
  timezone: string
  notifications: 'all' | 'important' | 'none'
}

export function useSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<UserSettings>({
    skillset: '',
    color_scheme: 'light',
    language: 'en',
    timezone: 'UTC',
    notifications: 'all'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchSettings()
    }
  }, [user])

  // Apply color scheme when settings change
  useEffect(() => {
    if (settings.color_scheme) {
      applyColorScheme(settings.color_scheme)
    }
  }, [settings.color_scheme])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/users/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Settings loaded:', data.settings)
        setSettings(data.settings)
        applyColorScheme(data.settings.color_scheme)
      } else {
        console.error('Failed to fetch settings:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/users/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newSettings)
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Settings updated:', data.settings)
        // Update settings with the response data
        setSettings(data.settings)
        
        // Apply color scheme if it changed
        if (newSettings.color_scheme) {
          applyColorScheme(newSettings.color_scheme)
        }
        
        return { success: true }
      } else {
        const error = await response.json()
        console.error('Settings update failed:', error)
        return { success: false, error: error.error }
      }
    } catch (error) {
      return { success: false, error: 'Failed to update settings' }
    }
  }

  const applyColorScheme = (scheme: string) => {
    const root = document.documentElement
    
    // Remove existing classes
    root.classList.remove('dark', 'light')
    
    if (scheme === 'dark') {
      root.classList.add('dark')
    } else if (scheme === 'light') {
      root.classList.add('light')
    } else {
      // Auto - check system preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark')
      } else {
        root.classList.add('light')
      }
    }
  }

  const getLocalizedText = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        'welcome': 'Welcome',
        'dashboard': 'Dashboard',
        'settings': 'Settings',
        'profile': 'Profile',
        'logout': 'Logout'
      },
      es: {
        'welcome': 'Bienvenido',
        'dashboard': 'Panel',
        'settings': 'Configuración',
        'profile': 'Perfil',
        'logout': 'Cerrar sesión'
      },
      fr: {
        'welcome': 'Bienvenue',
        'dashboard': 'Tableau de bord',
        'settings': 'Paramètres',
        'profile': 'Profil',
        'logout': 'Déconnexion'
      },
      de: {
        'welcome': 'Willkommen',
        'dashboard': 'Dashboard',
        'settings': 'Einstellungen',
        'profile': 'Profil',
        'logout': 'Abmelden'
      }
    }

    return translations[settings.language]?.[key] || translations.en[key] || key
  }

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    try {
      return new Intl.DateTimeFormat(settings.language, {
        timeZone: settings.timezone,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj)
    } catch (error) {
      // Fallback to default formatting
      return dateObj.toLocaleDateString()
    }
  }

  return {
    settings,
    loading,
    updateSettings,
    getLocalizedText,
    formatDate,
    applyColorScheme
  }
} 