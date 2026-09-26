import type { Building, BuildingMember, BuildingUnit, Invitation } from '../types'
import { apiErrorMessage, apiFetch } from '../utils/api'

export const useBuildings = () => {
  const auth = useAuth()
  const buildings = useState<Building[]>('bs-buildings', () => [])
  const units = useState<Record<string, BuildingUnit[]>>('bs-units', () => ({}))
  const members = useState<Record<string, BuildingMember[]>>('bs-members', () => ({}))
  const invitations = useState<Record<string, Invitation[]>>('bs-invitations', () => ({}))
  const loading = useState('bs-loading', () => false)
  const loadError = useState<string | null>('bs-error', () => null)
  const actionError = useState<string | null>('bs-action-error', () => null)

  const clear = () => {
    buildings.value = []
    units.value = {}
    members.value = {}
    invitations.value = {}
  }

  const refresh = async () => {
    if (!auth.isAuthenticated) {
      clear()
      return
    }
    loading.value = true
    loadError.value = null
    try {
      const list = await apiFetch<Building[]>('/api/buildings')
      const canReadInvites = auth.user?.role === 'admin' || auth.isManager
      const details = await Promise.all(list.map(async (building) => {
        const [unitList, memberList, invitationList] = await Promise.all([
          apiFetch<BuildingUnit[]>(`/api/buildings/${building.id}/units`),
          apiFetch<BuildingMember[]>(`/api/buildings/${building.id}/members`),
          canReadInvites || building.managerId === auth.user?.id
            ? apiFetch<Invitation[]>(`/api/buildings/${building.id}/invitations`).catch(() => [] as Invitation[])
            : Promise.resolve([] as Invitation[]),
        ])
        return { id: building.id, unitList, memberList, invitationList }
      }))
      buildings.value = list
      units.value = Object.fromEntries(details.map((item) => [item.id, item.unitList]))
      members.value = Object.fromEntries(details.map((item) => [item.id, item.memberList]))
      invitations.value = Object.fromEntries(details.map((item) => [item.id, item.invitationList]))
    } catch (error) {
      loadError.value = apiErrorMessage(error, 'بارگذاری ساختمان‌ها ناموفق بود')
      clear()
    } finally {
      loading.value = false
    }
  }

  const getBuilding = (id: string) => buildings.value.find((building) => building.id === id) || null

  const createBuilding = async (data: { name: string, address: string, description?: string, unitCount?: number, residentCount?: number }) => {
    actionError.value = null
    try {
    const building = await apiFetch<Building>('/api/buildings', { method: 'POST', body: data })
    buildings.value = [building, ...buildings.value.filter((item) => item.id !== building.id)]
    units.value = { ...units.value, [building.id]: [] }
    members.value = { ...members.value, [building.id]: [] }
    invitations.value = { ...invitations.value, [building.id]: [] }
    return building
    } catch (error) {
      actionError.value = apiErrorMessage(error, 'ساخت ساختمان ناموفق بود')
      throw error
    }
  }

  const updateBuilding = async (id: string, updates: Partial<Building>) => {
    actionError.value = null
    try {
      const building = await apiFetch<Building>(`/api/buildings/${id}`, {
        method: 'PATCH',
        body: { name: updates.name, address: updates.address, description: updates.description },
      })
      const index = buildings.value.findIndex((item) => item.id === id)
      if (index >= 0) buildings.value[index] = building
      return building
    } catch (error) {
      actionError.value = apiErrorMessage(error, 'ذخیره ساختمان ناموفق بود')
      throw error
    }
  }

  const addUnit = async (buildingId: string, unit: Omit<BuildingUnit, 'id' | 'buildingId'>) => {
    actionError.value = null
    try {
      const existing = units.value[buildingId] || []
      let number = unit.number
      if (existing.some((item) => item.number === number)) {
        let next = existing.length + 1
        while (existing.some((item) => item.number === String(next))) next += 1
        number = String(next)
      }
      const created = await apiFetch<BuildingUnit>(`/api/buildings/${buildingId}/units`, {
        method: 'POST',
        body: { ...unit, number },
      })
      const next = [...existing, created]
      units.value = { ...units.value, [buildingId]: next }
      const building = buildings.value.find((item) => item.id === buildingId)
      if (building) building.unitCount = next.length
      return created
    } catch (error) {
      actionError.value = apiErrorMessage(error, 'افزودن واحد ناموفق بود')
    }
  }

  const updateUnit = async (buildingId: string, unitId: string, updates: Partial<BuildingUnit>) => {
    const updated = await apiFetch<BuildingUnit>(`/api/buildings/${buildingId}/units/${unitId}`, { method: 'PATCH', body: updates })
    const list = units.value[buildingId] || []
    units.value = { ...units.value, [buildingId]: list.map((item) => item.id === unitId ? updated : item) }
    return updated
  }

  const removeUnit = async (buildingId: string, unitId: string) => {
    actionError.value = null
    try {
      await apiFetch(`/api/buildings/${buildingId}/units/${unitId}`, { method: 'DELETE' })
      const next = (units.value[buildingId] || []).filter((item) => item.id !== unitId)
      units.value = { ...units.value, [buildingId]: next }
      const building = buildings.value.find((item) => item.id === buildingId)
      if (building) building.unitCount = next.length
    } catch (error) {
      actionError.value = apiErrorMessage(error, 'حذف واحد ناموفق بود')
    }
  }

  const addMember = async (buildingId: string, member: Omit<BuildingMember, 'id' | 'buildingId'>) => {
    const created = await apiFetch<BuildingMember>(`/api/buildings/${buildingId}/members`, { method: 'POST', body: member })
    const next = [...(members.value[buildingId] || []), created]
    members.value = { ...members.value, [buildingId]: next }
    const building = buildings.value.find((item) => item.id === buildingId)
    if (building) building.residentCount = next.length
    return created
  }

  const removeMember = async (buildingId: string, memberId: string) => {
    await apiFetch(`/api/buildings/${buildingId}/members/${memberId}`, { method: 'DELETE' })
    const next = (members.value[buildingId] || []).filter((item) => item.id !== memberId)
    members.value = { ...members.value, [buildingId]: next }
    const building = buildings.value.find((item) => item.id === buildingId)
    if (building) building.residentCount = next.length
  }

  const invite = async (buildingId: string) => {
    actionError.value = null
    try {
      const invitation = await apiFetch<Invitation>(`/api/buildings/${buildingId}/invitations`, { method: 'POST' })
      invitations.value = { ...invitations.value, [buildingId]: [invitation, ...(invitations.value[buildingId] || [])] }
      return invitation
    } catch (error) {
      actionError.value = apiErrorMessage(error, 'ایجاد دعوت ناموفق بود')
    }
  }

  const joinByCode = async (code: string) => {
    try {
      await apiFetch('/api/invitations/join', { method: 'POST', body: { code } })
      await refresh()
      return true
    } catch {
      return false
    }
  }

  return {
    buildings,
    units,
    members,
    invitations,
    loading,
    loadError,
    actionError,
    createBuilding,
    getBuilding,
    updateBuilding,
    addUnit,
    updateUnit,
    removeUnit,
    addMember,
    removeMember,
    invite,
    joinByCode,
    refresh,
    clear,
    save: refresh,
  }
}
