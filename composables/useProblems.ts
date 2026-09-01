import type { ProblemReport } from '../types'

export const useProblems = () => {
  const auth = useAuth()
  const { buildings } = useBuildings()

  const problems = useState<ProblemReport[]>('hs-problems', () => {
    if (typeof window === 'undefined') return []
    try { const r = localStorage.getItem('hs-problems'); return r ? JSON.parse(r) : [] } catch { return [] }
  })

  const save = () => { if (typeof window !== 'undefined') localStorage.setItem('hs-problems', JSON.stringify(problems.value)) }

  const getByBuilding = (buildingId: string) => problems.value.filter(p => p.buildingId === buildingId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const getById = (id: string) => problems.value.find(p => p.id === id) || null

  const create = (data: Omit<ProblemReport, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    const p: ProblemReport = { ...data, status: 'new', id: 'pr-' + Date.now(), createdAt: new Date().toISOString() }
    problems.value.push(p)
    save()
    return p
  }

  const update = (id: string, updates: Partial<ProblemReport>) => {
    const idx = problems.value.findIndex(p => p.id === id)
    if (idx >= 0) { problems.value[idx] = { ...problems.value[idx], ...updates, updatedAt: new Date().toISOString() }; save() }
  }

  const remove = (id: string) => { problems.value = problems.value.filter(p => p.id !== id); save() }

  const categoryLabels: Record<string, string> = {
    water: 'آب', electricity: 'برق', elevator: 'آسانسور', gas: 'گاز', common: 'مشاعات', cleaning: 'نظافت', other: 'سایر'
  }

  const statusLabels: Record<string, string> = { new: 'جدید', 'in-progress': 'در حال پیگیری', resolved: 'حل شده' }

  // Seed mock if empty
  if (problems.value.length === 0 && typeof window !== 'undefined') {
    problems.value.push({
      id: 'pr-1', buildingId: 'b-1', category: 'elevator', title: 'آسانسور طبقه ۴ کار نمی‌کند', description: 'دکمه آسانسور در طبقه ۴ پاسخ نمی‌دهد.', status: 'in-progress', createdBy: 'u-101', createdAt: new Date(Date.now() - 3600000).toISOString(), updatedAt: new Date(Date.now() - 1800000).toISOString()
    }, {
      id: 'pr-2', buildingId: 'b-1', category: 'water', title: 'نشت آب در پارکینگ', description: 'نشت آب درون پارکینگ طبقه همکف مشاهده شد.', status: 'new', createdBy: 'u-101', createdAt: new Date(Date.now() - 7200000).toISOString()
    })
    save()
  }

  return { problems, getByBuilding, getById, create, update, remove, save, categoryLabels, statusLabels }
}
