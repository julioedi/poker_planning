'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSettings } from '@/hooks/useSettings'
import { t } from '@/lib/i18n'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import StatsCard from '@/components/dashboard/StatsCard'
import styles from '@/components/dashboard/Dashboard.module.scss'
import { 
  BarChart3, 
  Users, 
  Folder, 
  Calendar, 
  Plus, 
  Eye, 
  Settings as SettingsIcon,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalSessions: number
  activeProjects: number
  teamMembers: number
  completedSessions: number
}

interface RecentActivity {
  id: number
  type: 'session_created' | 'project_updated' | 'member_joined' | 'session_completed'
  title: string
  description: string
  timestamp: string
  color: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { settings } = useSettings()
  const [stats, setStats] = useState<DashboardStats>({
    totalSessions: 0,
    activeProjects: 0,
    teamMembers: 0,
    completedSessions: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      // Fetch stats
      const statsResponse = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Fetch recent activity
      const activityResponse = await fetch('/api/dashboard/activity', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (activityResponse.ok) {
        const activityData = await activityResponse.json()
        setRecentActivity(activityData.activities || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const activityTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return t('minutesAgo', settings.language, { minutes: diffInMinutes })
    } else if (diffInMinutes < 120) {
      return t('hourAgo', settings.language, { hour: 1 })
    } else {
      const hours = Math.floor(diffInMinutes / 60)
      return t('hoursAgo', settings.language, { hours })
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'session_created':
        return <BarChart3 className={styles.activityIcon} />
      case 'project_updated':
        return <Folder className={styles.activityIcon} />
      case 'member_joined':
        return <Users className={styles.activityIcon} />
      case 'session_completed':
        return <CheckCircle className={styles.activityIcon} />
      default:
        return <Clock className={styles.activityIcon} />
    }
  }

  // Stats cards configuration
  const statsCards = [
    {
      title: t('totalSessions', settings.language),
      value: stats.totalSessions,
      icon: BarChart3,
      color: 'primary' as const
    },
    {
      title: t('activeProjects', settings.language),
      value: stats.activeProjects,
      icon: Folder,
      color: 'green' as const
    },
    {
      title: t('teamMembers', settings.language),
      value: stats.teamMembers,
      icon: Users,
      color: 'blue' as const
    },
    {
      title: t('completedSessions', settings.language),
      value: stats.completedSessions,
      icon: CheckCircle,
      color: 'purple' as const
    }
  ]

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className={styles.dashboardHeader}>
        <h1 className={styles.dashboardTitle}>
          {t('welcomeBack', settings.language, { name: user.name })}
        </h1>
        <p className={styles.dashboardSubtitle}>
          {t('configurePreferences', settings.language)}
        </p>
      </div>

      {/* Quick Stats */}
      <div className={styles.statsGrid}>
        {statsCards.map((card, index) => (
          <StatsCard
            key={index}
            title={card.title}
            value={card.value}
            icon={card.icon}
            color={card.color}
            loading={loading}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className={styles.mainContentGrid}>
        {/* Recent Activity */}
        <div className={styles.activitySection}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                <TrendingUp className={styles.cardTitleIcon} />
                {t('recentActivity', settings.language)}
              </h3>
            </div>
            <div className={styles.cardContent}>
              {loading ? (
                <div className={styles.loadingSkeleton}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={styles.skeletonItem}>
                      <div className={styles.skeletonDot}></div>
                      <div className={styles.skeletonContent}>
                        <div className={styles.skeletonLine}></div>
                        <div className={styles.skeletonTime}></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length === 0 ? (
                <div className={styles.emptyState}>
                  <Clock className={styles.emptyStateIcon} />
                  <h3 className={styles.emptyStateTitle}>
                    {t('noRecentActivity', settings.language)}
                  </h3>
                  <p className={styles.emptyStateDescription}>
                    {t('getStarted', settings.language)}
                  </p>
                </div>
              ) : (
                <div className={styles.activityList}>
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className={styles.activityItem}>
                      <div className={`${styles.activityDot} ${activity.color}`}></div>
                      <div className={styles.activityContent}>
                        <p className={styles.activityTitle}>
                          {activity.title}
                        </p>
                        <p className={styles.activityTime}>
                          {formatTimeAgo(activity.timestamp)}
                        </p>
                      </div>
                      {getActivityIcon(activity.type)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.actionsSection}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                <Plus className={styles.cardTitleIcon} />
                {t('quickActions', settings.language)}
              </h3>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.actionsList}>
                <Link
                  href="/dashboard/create"
                  className={styles.actionButton}
                >
                  <Plus className={styles.actionButtonIcon} />
                  {t('createNewSession', settings.language)}
                </Link>
                
                <Link
                  href="/dashboard/sessions"
                  className={styles.actionButtonOutline}
                >
                  <Eye className={styles.actionButtonIcon} />
                  {t('viewSessions', settings.language)}
                </Link>
                
                <Link
                  href="/dashboard/projects"
                  className={styles.actionButtonOutline}
                >
                  <Folder className={styles.actionButtonIcon} />
                  {t('viewProjects', settings.language)}
                </Link>
                
                <Link
                  href="/dashboard/team"
                  className={styles.actionButtonOutline}
                >
                  <Users className={styles.actionButtonIcon} />
                  {t('viewTeam', settings.language)}
                </Link>
                
                <Link
                  href="/dashboard/settings"
                  className={styles.actionButtonOutline}
                >
                  <SettingsIcon className={styles.actionButtonIcon} />
                  {t('viewSettings', settings.language)}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Empty States */}
      {!loading && stats.totalSessions === 0 && (
        <div className={styles.emptyDashboard}>
          <div className={styles.card}>
            <div className={styles.emptyDashboardContent}>
              <BarChart3 className={styles.emptyDashboardIcon} />
              <h3 className={styles.emptyDashboardTitle}>
                {t('noSessionsYet', settings.language)}
              </h3>
              <p className={styles.emptyDashboardDescription}>
                {t('createFirstSession', settings.language)}
              </p>
              <Link href="/dashboard/create" className={styles.emptyDashboardButton}>
                {t('getStarted', settings.language)}
              </Link>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
} 