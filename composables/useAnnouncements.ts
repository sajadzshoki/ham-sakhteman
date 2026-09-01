import type { Announcement } from '../types'

export const useAnnouncements = () => {
  const auth = useAuth()
  const { buildings, getBuilding } = useBuildings()

  const announcements = useState<Announcement[]>('hs-announcements', () => {
    if (typeof window === 'undefined') return []
    try { const r = localStorage.getItem('hs-announcements'); return r ? JSON.parse(r) : [] } catch { return [] }
  })

  const save = () => { if (typeof window !== 'undefined') localStorage.setItem('hs-announcements', JSON.stringify(announcements.value)) }

  const getByBuilding = (buildingId: string) => announcements.value.filter(a => a.buildingId === buildingId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const getById = (id: string) => announcements.value.find(a => a.id === id) || null

  const create = (data: Omit<Announcement, 'id' | 'createdAt'>) => {
    const a: Announcement = { ...data, id: 'ann-' + Date.now(), createdAt: new Date().toISOString() }
    announcements.value.push(a)
    save()
    return a
  }

  const update = (id: string, updates: Partial<Announcement>) => {
    const idx = announcements.value.findIndex(a => a.id === id)
    if (idx >= 0) { announcements.value[idx] = { ...announcements.value[idx], ...updates }; save() }
  }

  const remove = (id: string) => {
    announcements.value = announcements.value.filter(a => a.id !== id)
    save()
  }

  // Seed mock if empty
  if (announcements.value.length === 0 && typeof window !== 'undefined') {
    const b = getByBuilding('b-1')
    const mockB = buildings.value.find(x => x.id === 'b-1')
    if (mockB) {
      announcements.value.push({
        id: 'ann-1', buildingId: 'b-1', title: 'تعمیر آسانسور', description: 'تعمیر آسانسور طبقه ۵ در ساعت ۱۰ صبح انجام می‌شود.', importance: 'important', createdBy: 'u-102', createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
      }, {
        id: 'ann-2', buildingId: 'b-1', title: 'اجتماع ساکنان', description: 'اجتماع هفتگی در سالن اجتماعات در ساعت ۱۸.', importance: 'normal', createdBy: 'u-102', createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
      })
      save()
    }
  }

  return { announcements, getByBuilding, getById, create, update, remove, save }
}
