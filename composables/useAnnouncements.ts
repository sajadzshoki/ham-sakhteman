import type { Announcement } from '../types'
import { apiErrorMessage, apiFetch } from '../utils/api'

export const useAnnouncements = () => {
  const announcements = useState<Announcement[]>('hs-announcements', () => [])
  const loading = useState('hs-ann-loading', () => false)
  const loadError = useState<string | null>('hs-ann-error', () => null)

  const refresh = async () => {
    const { buildings } = useBuildings()
    if (!buildings.value.length) {
      announcements.value = []
      return
    }
    loading.value = true
    loadError.value = null
    try {
      const groups = await Promise.all(buildings.value.map((building) => apiFetch<Announcement[]>(`/api/buildings/${building.id}/announcements`)))
      announcements.value = groups.flat()
    } catch (error) {
      loadError.value = apiErrorMessage(error, 'بارگذاری اطلاعیه‌ها ناموفق بود')
      announcements.value = []
    } finally {
      loading.value = false
    }
  }

  const clear = () => { announcements.value = [] }

  const getByBuilding = (buildingId: string) => announcements.value
    .filter((item) => item.buildingId === buildingId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const getById = (id: string) => announcements.value.find((item) => item.id === id) || null

  const create = async (data: Omit<Announcement, 'id' | 'createdAt'>) => {
    const created = await apiFetch<Announcement>(`/api/buildings/${data.buildingId}/announcements`, { method: 'POST', body: data })
    announcements.value = [created, ...announcements.value.filter((item) => item.id !== created.id)]
    return created
  }

  const update = async (id: string, updates: Partial<Announcement>) => {
    const current = getById(id)
    if (!current) return
    const updated = await apiFetch<Announcement>(`/api/announcements/${id}`, { method: 'PATCH', body: updates })
    announcements.value = announcements.value.map((item) => item.id === id ? updated : item)
    return updated
  }

  const remove = async (id: string) => {
    await apiFetch(`/api/announcements/${id}`, { method: 'DELETE' })
    announcements.value = announcements.value.filter((item) => item.id !== id)
  }

  return { announcements, loading, loadError, getByBuilding, getById, create, update, remove, refresh, clear, save: refresh }
}
