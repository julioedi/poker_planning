'use client'

import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { PlusCircle } from 'lucide-react'

export default function CreatePlanningPage() {
  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create Planning Session</h1>
        <p className="text-gray-600 mt-2">
          Start a new poker planning session for your team
        </p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">New Planning Session</h3>
        </div>
        <div className="card-content">
          <p className="text-gray-500">
            Planning session creation form will be implemented here.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
} 