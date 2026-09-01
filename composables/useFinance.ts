import type { Charge, Expense } from '../types'

export const useFinance = () => {
  const auth = useAuth()
  const { buildings } = useBuildings()

  const charges = useState<Charge[]>('hs-charges', () => {
    if (typeof window === 'undefined') return []
    try { const r = localStorage.getItem('hs-charges'); return r ? JSON.parse(r) : [] } catch { return [] }
  })

  const expenses = useState<Expense[]>('hs-expenses', () => {
    if (typeof window === 'undefined') return []
    try { const r = localStorage.getItem('hs-expenses'); return r ? JSON.parse(r) : [] } catch { return [] }
  })

  const saveCharges = () => { if (typeof window !== 'undefined') localStorage.setItem('hs-charges', JSON.stringify(charges.value)) }
  const saveExpenses = () => { if (typeof window !== 'undefined') localStorage.setItem('hs-expenses', JSON.stringify(expenses.value)) }

  const getByBuilding = (bId: string) => charges.value.filter(c => c.buildingId === bId).sort((a,b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
  const getExpensesByBuilding = (bId: string) => expenses.value.filter(e => e.buildingId === bId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const createCharge = (data: Omit<Charge, 'id' | 'createdAt' | 'status'>) => {
    const c: Charge = { ...data, id: 'ch-' + Date.now(), status: 'unpaid', createdAt: new Date().toISOString(), createdBy: (auth.user as any)?.id || 'system' }
    charges.value.push(c); saveCharges(); return c
  }

  const updateCharge = (id: string, updates: Partial<Charge>) => {
    const idx = charges.value.findIndex(c => c.id === id)
    if (idx >= 0) { charges.value[idx] = { ...charges.value[idx], ...updates }; saveCharges() }
  }

  const createExpense = (data: Omit<Expense, 'id' | 'createdAt'>) => {
    const e: Expense = { ...data, id: 'ex-' + Date.now(), createdAt: new Date().toISOString(), createdBy: (auth.user as any)?.id || 'system' }
    expenses.value.push(e); saveExpenses(); return e
  }

  const removeExpense = (id: string) => { expenses.value = expenses.value.filter(e => e.id !== id); saveExpenses() }

  // Seed mock if empty
  if (charges.value.length === 0 && typeof window !== 'undefined') {
    const b = buildings.value[0]?.id || 'b-1'
    charges.value.push({ id: 'ch-1', buildingId: b, title: 'شارژ ماهانه اردیبهشت', amount: 1250000, period: 'اردیبهشت ۱۴۰۵', dueDate: '۱۴۰۵/۰۳/۰۵', description: 'شارژ ماهانه شامل نگهداری و نظافت', status: 'paid', paidAt: '۱۴۰۵/۰۳/۰۳', paidBy: 'u-102', createdAt: new Date(Date.now()-86400000*3).toISOString(), createdBy: 'u-102' })
    charges.value.push({ id: 'ch-2', buildingId: b, title: 'شارژ ماهانه خرداد', amount: 1250000, period: 'خرداد ۱۴۰۵', dueDate: '۱۴۰۵/۰۴/۰۵', description: 'شارژ ماهانه', status: 'unpaid', createdAt: new Date(Date.now()-86400000).toISOString(), createdBy: 'u-102' })
    saveCharges()
  }
  if (expenses.value.length === 0 && typeof window !== 'undefined') {
    const b = buildings.value[0]?.id || 'b-1'
    expenses.value.push({ id: 'ex-1', buildingId: b, title: 'هزینه برق پارکینگ', amount: 450000, category: 'electricity', date: '۱۴۰۵/۰۳/۰۲', description: 'صورت‌حساب برق پارکینگ', createdAt: new Date(Date.now()-86400000*2).toISOString(), createdBy: 'u-102' })
    expenses.value.push({ id: 'ex-2', buildingId: b, title: 'تعمیر آسانسور', amount: 890000, category: 'repair', date: '۱۴۰۵/۰۳/۰۱', description: 'تعمیر آسیسور طبقه ۴', createdAt: new Date(Date.now()-86400000*4).toISOString(), createdBy: 'u-102' })
    saveExpenses()
  }

  return { charges, expenses, getByBuilding, getExpensesByBuilding, createCharge, updateCharge, createExpense, removeExpense, saveCharges, saveExpenses }
}
