import type { NotificationItem } from '../types'
import { apiErrorMessage, apiFetch } from '../utils/api'

export const useNotifications = () => {
  const auth = useAuth()
  const notifications = useState<NotificationItem[]>('hs-notifications', () => [])
  const loading = useState('hs-notifications-loading', () => false)
  const loadError = useState<string | null>('hs-notifications-error', () => null)

  const refresh = async () => {
    if (!auth.isAuthenticated) {
      notifications.value = []
      return
    }
    loading.value = true
    loadError.value = null
    try {
      notifications.value = await apiFetch<NotificationItem[]>('/api/notifications')
    } catch (error) {
      loadError.value = apiErrorMessage(error, 'بارگذاری اعلان‌ها ناموفق بود')
      notifications.value = []
    } finally {
      loading.value = false
    }
  }

  const clear = () => { notifications.value = [] }

  const markRead = async (id: string) => {
    const updated = await apiFetch<NotificationItem>(`/api/notifications/${id}`, {
      method: 'PATCH',
      body: { unread: false },
    })
    notifications.value = notifications.value.map((item) => item.id === id ? updated : item)
  }

  const markAllRead = async () => {
    await apiFetch('/api/notifications/read-all', { method: 'POST' })
    notifications.value = notifications.value.map((item) => ({ ...item, unread: false }))
  }

  return { notifications, loading, loadError, refresh, markRead, markAllRead, clear, save: refresh }
}
