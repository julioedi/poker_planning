'use client'

import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Users } from 'lucide-react'

export default function TeamPage() {
  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Team</h1>
        <p className="text-gray-600 mt-2">
          Manage your team members and their roles
        </p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Team Members</h3>
        </div>
        <div className="card-content">
          <p className="text-gray-500">
            Team management interface will be implemented here.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
} 