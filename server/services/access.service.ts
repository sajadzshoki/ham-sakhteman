import type { User } from '../../types'
import { findBuildingById, findMembership } from '../repositories/lookup.repo'
import { ApiError } from '../utils/errors'

export async function requireBuildingReader(user: User, buildingId: string) {
  const building = await findBuildingById(buildingId)
  if (!building) throw new ApiError(404, 'NOT_FOUND', 'ساختمان پیدا نشد')
  if (user.role === 'admin') return { building, isManager: true, member: null }
  const member = await findMembership(buildingId, user.id)
  if (!member) throw new ApiError(403, 'FORBIDDEN', 'به این ساختمان دسترسی ندارید')
  return { building, isManager: member.role === 'manager', member }
}

export async function requireBuildingManager(user: User, buildingId: string) {
  const access = await requireBuildingReader(user, buildingId)
  if (!access.isManager) throw new ApiError(403, 'FORBIDDEN', 'فقط مدیر ساختمان می‌تواند این کار را انجام دهد')
  return access
}

export function requirePlatformManager(user: User) {
  if (user.role !== 'manager' && user.role !== 'admin') {
    throw new ApiError(403, 'FORBIDDEN', 'فقط مدیر می‌تواند این کار را انجام دهد')
  }
}

export function requireAdmin(user: User) {
  if (user.role !== 'admin') throw new ApiError(403, 'FORBIDDEN', 'این بخش فقط برای مدیر کل است')
}
