import { LucideIcon } from 'lucide-react'
import styles from './StatsCard.module.scss'

interface StatsCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  color: 'primary' | 'green' | 'blue' | 'purple' | 'red' | 'yellow' | 'indigo' | 'pink'
  loading?: boolean
}

export default function StatsCard({ title, value, icon: Icon, color, loading = false }: StatsCardProps) {
  return (
    <div className={`${styles.statsCard} ${styles[color]} ${loading ? styles.loading : ''}`}>
      <div className={styles.cardContent}>
        <div className={styles.cardLayout}>
          <div className={styles.textContent}>
            <p className={styles.title}>
              {title}
            </p>
            <p className={styles.value}>
              {loading ? '...' : value}
            </p>
          </div>
          <div className={styles.iconContainer}>
            <Icon className={styles.icon} />
          </div>
        </div>
      </div>
    </div>
  )
} 