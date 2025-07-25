'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import axios from 'axios'

interface User {
  id: number
  email: string
  name: string
  role: string
  status: string
  profile_picture?: string
  skillset?: string
  color_scheme?: 'light' | 'dark' | 'auto'
  language?: 'en' | 'es' | 'fr' | 'de' | 'ja'
  timezone?: string
  notifications?: 'all' | 'important' | 'none'
  created_at: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (email: string, name: string, password: string) => Promise<void>
  updateUser: (userData: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingAuth, setLoadingAuth] = useState(false)

  useEffect(() => {
    if (!loadingAuth) {
      checkAuth()
    }
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        const response = await axios.get('/api/auth/me')
        setUser(response.data.user)
      }
    } catch (error) {
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
    } finally {
      setLoadingAuth(false)
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password })
      const { token, user } = response.data
      
      localStorage.setItem('token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed')
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
  }

  const register = async (email: string, name: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/register', { 
        email, 
        name, 
        password 
      })
      const { token, user } = response.data
      
      localStorage.setItem('token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed')
    }
  }

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 