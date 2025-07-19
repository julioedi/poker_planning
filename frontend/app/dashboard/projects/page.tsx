'use client'

import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Folder } from 'lucide-react'

export default function ProjectsPage() {
  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        <p className="text-gray-600 mt-2">
          Manage your projects and their planning sessions
        </p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Your Projects</h3>
        </div>
        <div className="card-content">
          <p className="text-gray-500">
            Project management interface will be implemented here.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
} 