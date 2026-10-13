import { and, asc, eq } from 'drizzle-orm'
import type { User } from '../../shared/types'
import { getDb } from '../database/client'
import { buildingMembers } from '../database/schema'
import { listBuildings, listInvitations, listMembers, listUnits } from './buildings.service'
import { listAnnouncements, listCharges, listExpenses, listProblems } from './content.service'
import { adminOverview, listNotifications } from './directory.service'
import { listProviders } from './providers.service'

/**
 * ساختمان فعال کاربر: اگر `preferredId` عضویت معتبر داشته باشد همان،
 * وگرنه قدیمی‌ترین عضویت کاربر.
 */
async function resolveBuildingId(user: User, preferredId: string | undefined) {
  const rows = await getDb()
    .select({ buildingId: buildingMembers.buildingId })
    .from(buildingMembers)
    .where(eq(buildingMembers.userId, user.id))
    .orderBy(asc(buildingMembers.joinedAt))
  if (preferredId && rows.some((row) => row.buildingId === preferredId)) return preferredId
  return rows[0]?.buildingId ?? null
}

/** هر مجموعه‌ی ساختمان‌محور یک‌جا؛ برای ساکن، دعوت‌نامه‌ها (فقط مدیر) خالی است. */
async function loadBuildingScope(user: User, buildingId: string, isManager: boolean) {
  const [units, members, invitations, announcements, problems, charges, expenses, providers] = await Promise.all([
    listUnits(user, buildingId),
    listMembers(user, buildingId),
    isManager ? listInvitations(user, buildingId) : Promise.resolve([]),
    listAnnouncements(user, buildingId),
    listProblems(user, buildingId, {}),
    listCharges(user, buildingId),
    listExpenses(user, buildingId),
    listProviders({ buildingId }, user),
  ])
  return { units, members, invitations, announcements, problems, charges, expenses, providers }
}

/**
 * بسته‌ی آغازین UI برای کاربر وارد‌شده.
 * - سوپرادمین: خلاصه‌ی پلتفرم + مجموعه‌های ساختمانی خالی
 * - سایرین: ساختمان‌های کاربر و تمام داده‌ی ساختمان فعال
 */
export async function buildBootstrap(user: User, query: { buildingId?: unknown } = {}) {
  const notifications = await listNotifications(user)

  if (user.role === 'superadmin') {
    const [admin, providers] = await Promise.all([
      adminOverview(user),
      listProviders({}, user),
    ])
    return {
      user,
      buildings: [],
      buildingId: null,
      units: [],
      members: [],
      invitations: [],
      announcements: [],
      problems: [],
      charges: [],
      expenses: [],
      notifications,
      providers,
      admin,
    }
  }

  const preferred = typeof query.buildingId === 'string' ? query.buildingId : undefined
  const [buildings, buildingId] = await Promise.all([
    listBuildings(user),
    resolveBuildingId(user, preferred),
  ])

  if (!buildingId) {
    return {
      user,
      buildings,
      buildingId: null,
      units: [],
      members: [],
      invitations: [],
      announcements: [],
      problems: [],
      charges: [],
      expenses: [],
      notifications,
      providers: await listProviders({}, user),
      admin: null,
    }
  }

  const [membership] = await getDb()
    .select({ role: buildingMembers.role })
    .from(buildingMembers)
    .where(and(eq(buildingMembers.buildingId, buildingId), eq(buildingMembers.userId, user.id)))
    .limit(1)

  const scope = await loadBuildingScope(user, buildingId, membership?.role === 'manager')
  return { user, buildings, buildingId, ...scope, notifications, admin: null }
}
