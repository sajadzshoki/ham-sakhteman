import type { Charge, Expense } from '../types'
import { apiErrorMessage, apiFetch } from '../utils/api'

export const useFinance = () => {
  const charges = useState<Charge[]>('hs-charges', () => [])
  const expenses = useState<Expense[]>('hs-expenses', () => [])
  const loading = useState('hs-finance-loading', () => false)
  const loadError = useState<string | null>('hs-finance-error', () => null)

  const refresh = async () => {
    const { buildings } = useBuildings()
    if (!buildings.value.length) {
      charges.value = []
      expenses.value = []
      return
    }
    loading.value = true
    loadError.value = null
    try {
      const rows = await Promise.all(buildings.value.map(async (building) => {
        const [chargeRows, expenseRows] = await Promise.all([
          apiFetch<Charge[]>(`/api/buildings/${building.id}/charges`),
          apiFetch<Expense[]>(`/api/buildings/${building.id}/expenses`),
        ])
        return { chargeRows, expenseRows }
      }))
      charges.value = rows.flatMap((row) => row.chargeRows)
      expenses.value = rows.flatMap((row) => row.expenseRows)
    } catch (error) {
      loadError.value = apiErrorMessage(error, 'بارگذاری اطلاعات مالی ناموفق بود')
      charges.value = []
      expenses.value = []
    } finally {
      loading.value = false
    }
  }

  const clear = () => {
    charges.value = []
    expenses.value = []
  }

  const getByBuilding = (buildingId: string) => charges.value
    .filter((item) => item.buildingId === buildingId)
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate))

  const getExpensesByBuilding = (buildingId: string) => expenses.value
    .filter((item) => item.buildingId === buildingId)
    .sort((a, b) => b.date.localeCompare(a.date))

  const createCharge = async (data: Omit<Charge, 'id' | 'createdAt' | 'status'>) => {
    const created = await apiFetch<Charge>(`/api/buildings/${data.buildingId}/charges`, { method: 'POST', body: data })
    charges.value = [created, ...charges.value]
    return created
  }

  const updateCharge = async (id: string, updates: Partial<Charge>) => {
    const updated = await apiFetch<Charge>(`/api/charges/${id}`, { method: 'PATCH', body: updates })
    charges.value = charges.value.map((item) => item.id === id ? updated : item)
    return updated
  }

  const createExpense = async (data: Omit<Expense, 'id' | 'createdAt'>) => {
    const created = await apiFetch<Expense>(`/api/buildings/${data.buildingId}/expenses`, { method: 'POST', body: data })
    expenses.value = [created, ...expenses.value]
    return created
  }

  const removeExpense = async (id: string) => {
    await apiFetch(`/api/expenses/${id}`, { method: 'DELETE' })
    expenses.value = expenses.value.filter((item) => item.id !== id)
  }

  return { charges, expenses, loading, loadError, getByBuilding, getExpensesByBuilding, createCharge, updateCharge, createExpense, removeExpense, refresh, clear, saveCharges: refresh, saveExpenses: refresh }
}
