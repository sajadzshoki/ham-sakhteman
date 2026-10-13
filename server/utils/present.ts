import type { InferSelectModel } from 'drizzle-orm'
import type {
  Announcement,
  AppNotification,
  Building,
  BuildingCharge,
  BuildingMember,
  BuildingUnit,
  ChargePayment,
  ChargeWithPayments,
  Expense,
  Invitation,
  InvitationStatus,
  ProblemReport,
  ServiceProvider,
  User,
} from '../../shared/types'
import type {
  announcements,
  buildingMembers,
  buildingUnits,
  buildings,
  chargePayments,
  charges,
  expenses,
  invitations,
  notifications,
  problemReports,
  serviceProviders,
  users,
} from '../database/schema'
import { deriveChargeStatus } from '../../shared/utils/charge'
import { invitationLink } from './env'

type UserRow = InferSelectModel<typeof users>
type BuildingRow = InferSelectModel<typeof buildings>
type UnitRow = InferSelectModel<typeof buildingUnits>
type MemberRow = InferSelectModel<typeof buildingMembers>
type InvitationRow = InferSelectModel<typeof invitations>
type AnnouncementRow = InferSelectModel<typeof announcements>
type ProblemRow = InferSelectModel<typeof problemReports>
type ChargeRow = InferSelectModel<typeof charges>
type PaymentRow = InferSelectModel<typeof chargePayments>
type ExpenseRow = InferSelectModel<typeof expenses>
type ProviderRow = InferSelectModel<typeof serviceProviders>
type NotificationRow = InferSelectModel<typeof notifications>

type Names = Map<string, string>

const nameOf = (names: Names, id: string) => names.get(id) ?? ''

export function presentUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email ?? undefined,
    role: row.role,
    avatarInitials: row.avatarInitials ?? undefined,
    createdAt: row.createdAt.toISOString(),
  }
}

export function presentBuilding(
  row: BuildingRow,
  counts: { unitsCount: number, memberCount: number },
  options: { includeInvitation: boolean },
): Building {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    description: row.description ?? undefined,
    unitsCount: counts.unitsCount,
    memberCount: counts.memberCount,
    managerId: row.managerId,
    createdAt: row.createdAt.toISOString(),
    ...(options.includeInvitation
      ? { invitationCode: row.invitationCode, invitationLink: invitationLink(row.invitationCode) }
      : {}),
  }
}

export function presentUnit(row: UnitRow): BuildingUnit {
  return {
    id: row.id,
    buildingId: row.buildingId,
    number: row.number,
    floor: row.floor,
  }
}

export function presentMember(row: MemberRow): BuildingMember {
  return {
    id: row.id,
    buildingId: row.buildingId,
    userId: row.userId ?? undefined,
    name: row.name,
    phone: row.phone ?? undefined,
    role: row.role,
    unitId: row.unitId ?? undefined,
    unitStatus: row.unitStatus ?? undefined,
    joinedAt: row.joinedAt.toISOString(),
    invitedBy: row.invitedBy ?? undefined,
  }
}

export function invitationStatus(row: Pick<InvitationRow, 'used' | 'expiresAt'>, now = new Date()): InvitationStatus {
  if (row.used) return 'used'
  return row.expiresAt.getTime() <= now.getTime() ? 'expired' : 'active'
}

export function presentInvitation(row: InvitationRow): Invitation {
  return {
    id: row.id,
    buildingId: row.buildingId,
    code: row.code,
    role: row.role,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    status: invitationStatus(row),
    link: invitationLink(row.code),
    usedBy: row.usedBy ?? undefined,
    usedAt: row.usedAt?.toISOString(),
  }
}

export function presentAnnouncement(row: AnnouncementRow, names: Names): Announcement {
  return {
    id: row.id,
    buildingId: row.buildingId,
    title: row.title,
    body: row.body,
    importance: row.importance,
    image: row.imageUrl ?? undefined,
    createdBy: row.createdBy,
    createdByName: nameOf(names, row.createdBy),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function presentProblem(row: ProblemRow, names: Names): ProblemReport {
  return {
    id: row.id,
    buildingId: row.buildingId,
    category: row.category,
    title: row.title,
    description: row.description,
    image: row.imageUrl ?? undefined,
    status: row.status,
    reportedBy: row.createdBy,
    reportedByName: nameOf(names, row.createdBy),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export function presentCharge(row: ChargeRow, names: Names): BuildingCharge {
  return {
    id: row.id,
    buildingId: row.buildingId,
    title: row.title,
    period: row.period,
    amount: row.amount,
    dueAt: row.dueAt.toISOString(),
    notes: row.notes || undefined,
    createdBy: row.createdBy,
    createdByName: nameOf(names, row.createdBy),
    createdAt: row.createdAt.toISOString(),
  }
}

export function presentPayment(row: PaymentRow): ChargePayment {
  return {
    id: row.id,
    chargeId: row.chargeId,
    memberId: row.memberId,
    memberName: row.memberName,
    amount: row.amount,
    paidAt: row.paidAt.toISOString(),
    note: row.note || undefined,
    method: row.method,
    recordedBy: row.recordedBy,
  }
}

/**
 * شارژ + پرداخت‌ها + خلاصه‌ی وصول.
 * `viewerMemberId` عضو کاربر جاری است؛ وضعیت (paid/unpaid/overdue) فقط برای او محاسبه می‌شود.
 */
export function presentChargeWithPayments(
  row: ChargeRow,
  payments: PaymentRow[],
  options: { names: Names, memberCount: number, viewerMemberId?: string | null },
): ChargeWithPayments {
  const base = presentCharge(row, options.names)
  const result: ChargeWithPayments = {
    ...base,
    payments: payments.map(presentPayment),
    paidCount: payments.length,
    memberCount: options.memberCount,
    collectedAmount: payments.reduce((sum, payment) => sum + payment.amount, 0),
  }
  if (options.viewerMemberId) {
    result.status = deriveChargeStatus({
      dueAt: row.dueAt,
      paid: payments.some((payment) => payment.memberId === options.viewerMemberId),
    })
  }
  return result
}

export function presentExpense(row: ExpenseRow, names: Names): Expense {
  return {
    id: row.id,
    buildingId: row.buildingId,
    title: row.title,
    amount: row.amount,
    category: row.category,
    date: row.date,
    notes: row.notes || undefined,
    receipt: row.receiptUrl ?? undefined,
    createdBy: row.createdBy,
    createdByName: nameOf(names, row.createdBy),
    createdAt: row.createdAt.toISOString(),
  }
}

export function presentProvider(row: ProviderRow, trusted?: boolean): ServiceProvider {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    rating: Number(row.rating),
    phone: row.phone,
    serviceArea: row.serviceArea,
    workingHours: row.workingHours,
    image: row.imageUrl ?? undefined,
    ...(trusted === undefined ? {} : { trusted }),
  }
}

export function presentNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type,
    title: row.title,
    body: row.body || undefined,
    link: row.link ?? undefined,
    createdAt: row.createdAt.toISOString(),
    readAt: row.readAt?.toISOString(),
  }
}
