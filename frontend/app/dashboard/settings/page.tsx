'use client'

import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Configure your account and application preferences
        </p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Account Settings</h3>
        </div>
        <div className="card-content">
          <p className="text-gray-500">
            Settings interface will be implemented here.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
} 