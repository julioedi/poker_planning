'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { PlusCircle, Users, BarChart3, TrendingUp, Calendar, Clock } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
          Welcome back, {user.name}!
        </h1>
        <p className="mt-2" style={{ color: 'var(--muted-foreground)' }}>
          Here's what's happening with your poker planning sessions
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Total Sessions</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>24</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Active Projects</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>8</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Team Members</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>12</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Hours Saved</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>156</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Quick Actions</h3>
            </div>
            <div className="card-content space-y-3">
              <button className="btn-primary btn-md w-full flex items-center justify-center">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Planning
              </button>
              <button className="btn-outline btn-md w-full">
                Join Planning Session
              </button>
              <button className="btn-outline btn-md w-full">
                View All Projects
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Recent Activity</h3>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>New planning session created</p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Project: E-commerce Platform • 2 hours ago</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Team member joined session</p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Sarah Johnson joined "Mobile App Planning" • 4 hours ago</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
                  <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Planning session completed</p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>"API Integration Planning" completed • 1 day ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div className="mt-8">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Upcoming Sessions</h3>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium" style={{ color: 'var(--foreground)' }}>Mobile App Planning</h4>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Today</span>
                </div>
                <p className="text-sm mb-2" style={{ color: 'var(--muted-foreground)' }}>Planning session for mobile app features</p>
                <div className="flex items-center text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  <Clock className="mr-1 h-3 w-3" />
                  2:00 PM - 3:30 PM
                </div>
              </div>

              <div className="p-4 border rounded-lg" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium" style={{ color: 'var(--foreground)' }}>Backend Architecture</h4>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Tomorrow</span>
                </div>
                <p className="text-sm mb-2" style={{ color: 'var(--muted-foreground)' }}>System architecture planning session</p>
                <div className="flex items-center text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  <Clock className="mr-1 h-3 w-3" />
                  10:00 AM - 11:30 AM
                </div>
              </div>

              <div className="p-4 border rounded-lg" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium" style={{ color: 'var(--foreground)' }}>UI/UX Review</h4>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Friday</span>
                </div>
                <p className="text-sm mb-2" style={{ color: 'var(--muted-foreground)' }}>User interface design review</p>
                <div className="flex items-center text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  <Clock className="mr-1 h-3 w-3" />
                  1:00 PM - 2:00 PM
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 