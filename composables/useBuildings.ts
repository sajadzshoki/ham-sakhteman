import type { Building, BuildingUnit, BuildingMember, Invitation } from '../types'

export const useBuildings = () => {
  const { user, isManager } = useAuth()

  const buildings = useState<Building[]>('bs-buildings', () => {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem('hs-buildings')
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  })

  const units = useState<Record<string, BuildingUnit[]>>('bs-units', () => ({}))
  const members = useState<Record<string, BuildingMember[]>>('bs-members', () => ({}))
  const invitations = useState<Record<string, Invitation[]>>('bs-invitations', () => ({}))

  const save = () => {
    if (typeof window !== 'undefined') localStorage.setItem('hs-buildings', JSON.stringify(buildings.value))
  }

  const createBuilding = (data: Omit<Building, 'id' | 'invitationCode' | 'invitationLink' | 'createdAt' | 'managerId'>) => {
    const id = 'b-' + Date.now()
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const b: Building = {
      ...data,
      id,
      invitationCode: code,
      invitationLink: 'https://hamsakhteman.app/join?code=' + code,
      createdAt: new Date().toISOString(),
      unitCount: data.unitCount || 0,
      residentCount: 0,
      managerId: user.value?.id || 'u-1',
    }
    buildings.value.push(b)
    save()
    return b
  }

  const getBuilding = (id: string) => buildings.value.find(b => b.id === id) || null

  const updateBuilding = (id: string, updates: Partial<Building>) => {
    const idx = buildings.value.findIndex(b => b.id === id)
    if (idx >= 0) { buildings.value[idx] = { ...buildings.value[idx], ...updates }; save() }
  }

  const addUnit = (buildingId: string, unit: Omit<BuildingUnit, 'id' | 'buildingId'>) => {
    if (!units.value[buildingId]) units.value[buildingId] = []
    units.value[buildingId].push({ ...unit, id: 'u-' + Date.now(), buildingId })
    const b = getBuilding(buildingId)
    if (b) { b.unitCount = units.value[buildingId].length; save() }
  }

  const updateUnit = (buildingId: string, unitId: string, updates: Partial<BuildingUnit>) => {
    const list = units.value[buildingId] || []
    const idx = list.findIndex(u => u.id === unitId)
    if (idx >= 0) { list[idx] = { ...list[idx], ...updates } }
  }

  const removeUnit = (buildingId: string, unitId: string) => {
    if (!units.value[buildingId]) return
    units.value[buildingId] = units.value[buildingId].filter(u => u.id !== unitId)
    const b = getBuilding(buildingId)
    if (b) { b.unitCount = units.value[buildingId].length; save() }
  }

  const addMember = (buildingId: string, member: Omit<BuildingMember, 'id' | 'buildingId'>) => {
    if (!members.value[buildingId]) members.value[buildingId] = []
    members.value[buildingId].push({ ...member, id: 'm-' + Date.now(), buildingId })
    const b = getBuilding(buildingId)
    if (b) { b.residentCount = members.value[buildingId].length; save() }
  }

  const removeMember = (buildingId: string, memberId: string) => {
    if (!members.value[buildingId]) return
    members.value[buildingId] = members.value[buildingId].filter(m => m.id !== memberId)
    const b = getBuilding(buildingId)
    if (b) { b.residentCount = members.value[buildingId].length; save() }
  }

  const invite = (buildingId: string) => {
    const b = getBuilding(buildingId)
    if (!b) return
    const inv: Invitation = {
      id: 'i-' + Date.now(),
      buildingId,
      code: b.invitationCode,
      link: b.invitationLink,
      createdBy: user.value?.id || 'u-1',
      used: false,
      createdAt: new Date().toISOString(),
    }
    if (!invitations.value[buildingId]) invitations.value[buildingId] = []
    invitations.value[buildingId].push(inv)
    return inv
  }

  const joinByCode = (code: string, userName?: string) => {
    const b = buildings.value.find(x => x.invitationCode.toLowerCase() === code.toLowerCase())
    if (!b) return false
    addMember(b.id, {
      userId: 'u-' + Date.now(),
      role: 'resident',
      joinedAt: new Date().toISOString(),
      invitedBy: b.managerId,
    })
    return true
  }

  // Seed mock data if empty
  if (buildings.value.length === 0 && typeof window !== 'undefined') {
    const mockB = createBuilding({
      name: 'ساختمان شمالی هم‌ساختمان',
      address: 'تهران، خیابان ولیعصر، برج شمالی',
      description: 'ساختمان مدرن با ۲۴ واحد مسکونی',
      unitCount: 4,
      residentCount: 0,
    })
    addUnit(mockB.id, { number: '۴۰۱', floor: '۴', status: 'occupied', residentName: 'سارا محمدی', residentId: 'u-101' })
    addUnit(mockB.id, { number: '۴۰۲', floor: '۴', status: 'occupied', residentName: 'علی رضایی', residentId: 'u-102' })
    addUnit(mockB.id, { number: '۴۰۳', floor: '۴', status: 'vacant' })
    addUnit(mockB.id, { number: '۴۰۴', floor: '۴', status: 'maintenance' })
    addMember(mockB.id, { userId: 'u-102', role: 'manager', joinedAt: new Date().toISOString(), invitedBy: 'system', unitId: 'u-102' })
    addMember(mockB.id, { userId: 'u-101', role: 'resident', joinedAt: new Date().toISOString(), invitedBy: 'u-102', unitId: 'u-101' })
  }

  return { buildings, units, members, invitations, createBuilding, getBuilding, updateBuilding, addUnit, updateUnit, removeUnit, addMember, removeMember, invite, joinByCode, save }
}
