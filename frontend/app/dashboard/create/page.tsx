'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'
import { useSettings } from '@/hooks/useSettings'
import { t } from '@/lib/i18n'
import { PlusCircle, Plus, X, Calendar, Clock, Users, FileText, Settings, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Project {
  id: number
  name: string
  description: string
}

interface Participant {
  email: string
  role: 'observer' | 'voter' | 'moderator'
}

interface Topic {
  title: string
  description: string
}

interface FormData {
  title: string
  description: string
  project_id: number | null
  scheduled_date: string
  scheduled_time: string
  allow_chat: boolean
  allow_emoticons: boolean
  notify_email: boolean
  voting_system: 'fibonacci' | 't-shirt' | 'custom'
  custom_values: string
  participants: Participant[]
  topics: Topic[]
}

interface ValidationErrors {
  title?: string
  project_id?: string
  scheduled_date?: string
  scheduled_time?: string
  participants?: string
  topics?: string
  custom_values?: string
}

export default function CreatePlanningPage() {
  const { user } = useAuth()
  const { settings } = useSettings()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    project_id: null,
    scheduled_date: '',
    scheduled_time: '',
    allow_chat: true,
    allow_emoticons: true,
    notify_email: true,
    voting_system: 'fibonacci',
    custom_values: '',
    participants: [{ email: '', role: 'voter' }],
    topics: [{ title: '', description: '' }]
  })

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = t('titleRequired', settings.language)
    }

    if (!formData.project_id) {
      newErrors.project_id = t('projectRequired', settings.language)
    }

    if (!formData.scheduled_date) {
      newErrors.scheduled_date = t('scheduledDateRequired', settings.language)
    }

    if (!formData.scheduled_time) {
      newErrors.scheduled_time = t('scheduledTimeRequired', settings.language)
    }

    if (formData.participants.length === 0 || formData.participants.every(p => !p.email.trim())) {
      newErrors.participants = t('atLeastOneParticipant', settings.language)
    }

    if (formData.topics.length === 0 || formData.topics.every(t => !t.title.trim())) {
      newErrors.topics = t('atLeastOneTopic', settings.language)
    }

    // Validate custom values if custom voting system is selected
    if (formData.voting_system === 'custom' && !formData.custom_values.trim()) {
      newErrors.custom_values = t('invalidCustomValues', settings.language)
    }

    // Validate email addresses
    const emails = formData.participants.map(p => p.email.trim()).filter(Boolean)
    const uniqueEmails = new Set(emails)
    if (emails.length !== uniqueEmails.size) {
      newErrors.participants = t('duplicateEmail', settings.language)
    }

    // Check for invalid emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    for (const email of emails) {
      if (!emailRegex.test(email)) {
        newErrors.participants = t('invalidEmail', settings.language)
        break
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error(t('validationErrors', settings.language))
      return
    }

    try {
      setSubmitting(true)
      const token = localStorage.getItem('token')
      
      const payload = {
        ...formData,
        participants: formData.participants.filter(p => p.email.trim()),
        topics: formData.topics.filter(t => t.title.trim())
      }

      const response = await fetch('/api/poker-planning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || t('failedToCreateSession', settings.language))
      }

      toast.success(t('sessionCreated', settings.language))
      router.push('/dashboard/sessions')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const addParticipant = () => {
    setFormData(prev => ({
      ...prev,
      participants: [...prev.participants, { email: '', role: 'voter' }]
    }))
  }

  const removeParticipant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter((_, i) => i !== index)
    }))
  }

  const updateParticipant = (index: number, field: keyof Participant, value: string) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.map((p, i) => 
        i === index ? { ...p, [field]: value } : p
      )
    }))
  }

  const addTopic = () => {
    setFormData(prev => ({
      ...prev,
      topics: [...prev.topics, { title: '', description: '' }]
    }))
  }

  const removeTopic = (index: number) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.filter((_, i) => i !== index)
    }))
  }

  const updateTopic = (index: number, field: keyof Topic, value: string) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.map((t, i) => 
        i === index ? { ...t, [field]: value } : t
      )
    }))
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('createPlanningSession', settings.language)}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {t('startNewPlanningSession', settings.language)}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              {t('newPlanningSession', settings.language)}
            </h3>
          </div>
          <div className="card-content space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('sessionTitle', settings.language)} *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className={`input ${errors.title ? 'border-red-500' : ''}`}
                placeholder={t('sessionTitle', settings.language)}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('sessionDescription', settings.language)}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="input"
                rows={3}
                placeholder={t('sessionDescription', settings.language)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('selectProject', settings.language)} *
              </label>
              {loading ? (
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-10 rounded"></div>
              ) : projects.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 dark:text-gray-400 mb-2">
                    {t('noProjectsAvailable', settings.language)}
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    {t('createProjectFirst', settings.language)}
                  </p>
                </div>
              ) : (
                <select
                  value={formData.project_id || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, project_id: Number(e.target.value) || null }))}
                  className={`input ${errors.project_id ? 'border-red-500' : ''}`}
                >
                  <option value="">{t('selectProject', settings.language)}</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.project_id && <p className="text-red-500 text-sm mt-1">{errors.project_id}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('scheduledDate', settings.language)} *
                </label>
                <input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                  className={`input ${errors.scheduled_date ? 'border-red-500' : ''}`}
                />
                {errors.scheduled_date && <p className="text-red-500 text-sm mt-1">{errors.scheduled_date}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('scheduledTime', settings.language)} *
                </label>
                <input
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                  className={`input ${errors.scheduled_time ? 'border-red-500' : ''}`}
                />
                {errors.scheduled_time && <p className="text-red-500 text-sm mt-1">{errors.scheduled_time}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Session Settings */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              {t('sessionSettings', settings.language)}
            </h3>
          </div>
          <div className="card-content space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{t('allowChat', settings.language)}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('allowChatDescription', settings.language)}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allow_chat}
                    onChange={(e) => setFormData(prev => ({ ...prev, allow_chat: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{t('allowEmoticons', settings.language)}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('allowEmoticonsDescription', settings.language)}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allow_emoticons}
                    onChange={(e) => setFormData(prev => ({ ...prev, allow_emoticons: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{t('notifyEmail', settings.language)}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('notifyEmailDescription', settings.language)}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.notify_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, notify_email: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('votingSystem', settings.language)}
              </label>
              <select
                value={formData.voting_system}
                onChange={(e) => setFormData(prev => ({ ...prev, voting_system: e.target.value as any }))}
                className="input"
              >
                <option value="fibonacci">{t('fibonacci', settings.language)}</option>
                <option value="t-shirt">{t('tShirt', settings.language)}</option>
                <option value="custom">{t('custom', settings.language)}</option>
              </select>
            </div>

            {formData.voting_system === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('customValues', settings.language)}
                </label>
                <input
                  type="text"
                  value={formData.custom_values}
                  onChange={(e) => setFormData(prev => ({ ...prev, custom_values: e.target.value }))}
                  className={`input ${errors.custom_values ? 'border-red-500' : ''}`}
                  placeholder={t('customValuesPlaceholder', settings.language)}
                />
                {errors.custom_values && <p className="text-red-500 text-sm mt-1">{errors.custom_values}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Participants */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title flex items-center">
              <Users className="mr-2 h-5 w-5" />
              {t('participants', settings.language)}
            </h3>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              {formData.participants.map((participant, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="flex-1">
                    <input
                      type="email"
                      value={participant.email}
                      onChange={(e) => updateParticipant(index, 'email', e.target.value)}
                      className="input"
                      placeholder={t('participantEmail', settings.language)}
                    />
                  </div>
                  <select
                    value={participant.role}
                    onChange={(e) => updateParticipant(index, 'role', e.target.value)}
                    className="input w-32"
                  >
                    <option value="observer">{t('participantRoleObserver', settings.language)}</option>
                    <option value="voter">{t('participantRoleVoter', settings.language)}</option>
                    <option value="moderator">{t('participantRoleModerator', settings.language)}</option>
                  </select>
                  {formData.participants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeParticipant(index)}
                      className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              {errors.participants && <p className="text-red-500 text-sm">{errors.participants}</p>}
              <button
                type="button"
                onClick={addParticipant}
                className="btn-outline btn-sm flex items-center"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('addParticipant', settings.language)}
              </button>
            </div>
          </div>
        </div>

        {/* Topics */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              {t('topics', settings.language)}
            </h3>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              {formData.topics.map((topic, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center space-x-4">
                    <input
                      type="text"
                      value={topic.title}
                      onChange={(e) => updateTopic(index, 'title', e.target.value)}
                      className="input flex-1"
                      placeholder={t('topicTitle', settings.language)}
                    />
                    {formData.topics.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTopic(index)}
                        className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <textarea
                    value={topic.description}
                    onChange={(e) => updateTopic(index, 'description', e.target.value)}
                    className="input"
                    rows={2}
                    placeholder={t('topicDescription', settings.language)}
                  />
                </div>
              ))}
              {errors.topics && <p className="text-red-500 text-sm">{errors.topics}</p>}
              <button
                type="button"
                onClick={addTopic}
                className="btn-outline btn-sm flex items-center"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('addTopic', settings.language)}
              </button>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-outline btn-md"
          >
            {t('cancel', settings.language)}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary btn-md flex items-center"
          >
            {submitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            {t('createSession', settings.language)}
          </button>
        </div>
      </form>
    </DashboardLayout>
  )
} 