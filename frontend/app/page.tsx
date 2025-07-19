'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LoginForm from '@/components/auth/LoginForm'
import JoinRoomForm from '@/components/auth/JoinRoomForm'
import { useAuth } from '@/hooks/useAuth'

export default function HomePage() {
  const [showJoinForm, setShowJoinForm] = useState(false)
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-900 mb-2">
            Poker Planning
          </h1>
          <p className="text-secondary-600">
            Real-time collaborative planning sessions
          </p>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              {showJoinForm ? 'Join Planning Session' : 'Welcome Back'}
            </h2>
            <p className="card-description">
              {showJoinForm 
                ? 'Enter your room code to join a planning session'
                : 'Sign in to your account to continue'
              }
            </p>
          </div>
          
          <div className="card-content">
            {showJoinForm ? (
              <JoinRoomForm />
            ) : (
              <LoginForm />
            )}
          </div>

          <div className="card-footer">
            <button
              onClick={() => setShowJoinForm(!showJoinForm)}
              className="text-sm text-primary-600 hover:text-primary-700 underline"
            >
              {showJoinForm 
                ? 'Sign in to your account' 
                : 'Join with room code'
              }
            </button>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-secondary-500">
          <p>Default admin credentials:</p>
          <p>Email: admin@pokerplanning.com</p>
          <p>Password: admin123</p>
        </div>
      </div>
    </div>
  )
} 