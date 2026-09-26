import type { ProblemReport } from '../types'
import { apiErrorMessage, apiFetch } from '../utils/api'

export const useProblems = () => {
  const problems = useState<ProblemReport[]>('hs-problems', () => [])
  const loading = useState('hs-problems-loading', () => false)
  const loadError = useState<string | null>('hs-problems-error', () => null)

  const categoryLabels: Record<string, string> = {
    water: 'آب', electricity: 'برق', elevator: 'آسانسور', gas: 'گاز', common: 'مشاعات', cleaning: 'نظافت', other: 'سایر',
  }
  const statusLabels: Record<string, string> = { new: 'جدید', 'in-progress': 'در حال پیگیری', resolved: 'حل شده' }

  const refresh = async () => {
    const { buildings } = useBuildings()
    if (!buildings.value.length) {
      problems.value = []
      return
    }
    loading.value = true
    loadError.value = null
    try {
      const groups = await Promise.all(buildings.value.map((building) => apiFetch<ProblemReport[]>(`/api/buildings/${building.id}/problems`)))
      problems.value = groups.flat()
    } catch (error) {
      loadError.value = apiErrorMessage(error, 'بارگذاری گزارش‌ها ناموفق بود')
      problems.value = []
    } finally {
      loading.value = false
    }
  }

  const clear = () => { problems.value = [] }

  const getByBuilding = (buildingId: string) => problems.value
    .filter((item) => item.buildingId === buildingId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const getById = (id: string) => problems.value.find((item) => item.id === id) || null

  const create = async (data: Omit<ProblemReport, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    const created = await apiFetch<ProblemReport>(`/api/buildings/${data.buildingId}/problems`, { method: 'POST', body: data })
    problems.value = [created, ...problems.value.filter((item) => item.id !== created.id)]
    return created
  }

  const update = async (id: string, updates: Partial<ProblemReport>) => {
    const updated = await apiFetch<ProblemReport>(`/api/problems/${id}`, {
      method: 'PATCH',
      body: { status: updates.status },
    })
    problems.value = problems.value.map((item) => item.id === id ? updated : item)
    return updated
  }

  const remove = async (id: string) => {
    await apiFetch(`/api/problems/${id}`, { method: 'DELETE' })
    problems.value = problems.value.filter((item) => item.id !== id)
  }

  return { problems, loading, loadError, getByBuilding, getById, create, update, remove, refresh, clear, save: refresh, categoryLabels, statusLabels }
}
