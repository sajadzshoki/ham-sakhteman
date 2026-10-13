import type {
  Announcement,
  Building,
  BuildingMember,
  BuildingUnit,
  Charge,
  Expense,
  Invitation,
  NotificationItem,
  ProblemReport,
  ServiceProvider,
  User,
} from '../../types'
import type {
  announcements,
  buildingMembers,
  buildingUnits,
  buildings,
  charges,
  expenses,
  invitations,
  notifications,
  problemReports,
  serviceProviders,
  users,
} from '../database/schema'
import type { InferSelectModel } from 'drizzle-orm'
import { invitationLink } from './env'

type UserRow = InferSelectModel<typeof users>
type BuildingRow = InferSelectModel<typeof buildings>
type UnitRow = InferSelectModel<typeof buildingUnits>
type MemberRow = InferSelectModel<typeof buildingMembers>
type InvitationRow = InferSelectModel<typeof invitations>
type AnnouncementRow = InferSelectModel<typeof announcements>
type ProblemRow = InferSelectModel<typeof problemReports>
type ChargeRow = InferSelectModel<typeof charges>
type ExpenseRow = InferSelectModel<typeof expenses>
type ProviderRow = InferSelectModel<typeof serviceProviders>
type NotificationRow = InferSelectModel<typeof notifications>

export function presentUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? '',
    role: row.role,
    avatarInitials: row.avatarInitials ?? undefined,
    createdAt: row.createdAt.toISOString(),
  }
}

export function presentBuilding(row: BuildingRow, unitCount: number, residentCount: number): Building {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    description: row.description ?? undefined,
    unitCount,
    residentCount,
    managerId: row.managerId,
    invitationCode: row.invitationCode,
    invitationLink: invitationLink(row.invitationCode),
    createdAt: row.createdAt.toISOString(),
  }
}

export function presentUnit(row: UnitRow): BuildingUnit {
  return {
    id: row.id,
    buildingId: row.buildingId,
    number: row.number,
    floor: row.floor,
    status: row.status,
    residentName: row.residentName ?? undefined,
    residentId: row.residentUserId ?? undefined,
  }
}

export function presentMember(row: MemberRow, user?: { id: string, name: string, avatarInitials: string | null }): BuildingMember {
  return {
    id: row.id,
    buildingId: row.buildingId,
    userId: row.userId,
    unitId: row.unitId ?? undefined,
    role: row.role,
    joinedAt: row.joinedAt.toISOString(),
    invitedBy: row.invitedBy ?? undefined,
    user: user
      ? { id: user.id, name: user.name, email: '', role: row.role, avatarInitials: user.avatarInitials ?? undefined, createdAt: row.joinedAt.toISOString() }
      : undefined,
  }
}

export function presentInvitation(row: InvitationRow): Invitation {
  return {
    id: row.id,
    buildingId: row.buildingId,
    code: row.code,
    link: invitationLink(row.code),
    createdBy: row.createdBy,
    used: row.used,
    usedBy: row.usedBy ?? undefined,
    usedAt: row.usedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
  }
}

export function presentAnnouncement(row: AnnouncementRow): Announcement {
  return {
    id: row.id,
    buildingId: row.buildingId,
    title: row.title,
    description: row.description,
    importance: row.importance,
    imageUrl: row.imageUrl ?? undefined,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
  }
}

export function presentProblem(row: ProblemRow): ProblemReport {
  return {
    id: row.id,
    buildingId: row.buildingId,
    category: row.category,
    title: row.title,
    description: row.description,
    imageUrl: row.imageUrl ?? undefined,
    status: row.status,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt?.toISOString(),
    assignedTo: row.assignedTo ?? undefined,
  }
}

export function presentCharge(row: ChargeRow): Charge {
  return {
    id: row.id,
    buildingId: row.buildingId,
    title: row.title,
    amount: row.amount,
    period: row.period,
    dueDate: row.dueDate,
    description: row.description ?? undefined,
    status: row.status,
    paidAt: row.paidAt ?? undefined,
    paidBy: row.paidBy ?? undefined,
    note: row.note ?? undefined,
    createdAt: row.createdAt.toISOString(),
    createdBy: row.createdBy,
  }
}

export function presentExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    buildingId: row.buildingId,
    title: row.title,
    amount: row.amount,
    category: row.category,
    date: row.date,
    description: row.description ?? undefined,
    receiptUrl: row.receiptUrl ?? undefined,
    createdAt: row.createdAt.toISOString(),
    createdBy: row.createdBy,
  }
}

export function presentProvider(row: ProviderRow): ServiceProvider {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    rating: Number(row.rating),
    phone: row.phone,
    area: row.area,
    workingHours: row.workingHours,
    imageUrl: row.imageUrl ?? undefined,
    trusted: row.trusted,
    createdAt: row.createdAt.toISOString(),
    createdBy: row.createdBy ?? undefined,
  }
}

export function presentNotification(row: NotificationRow): NotificationItem {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    time: row.createdAt.toISOString().slice(0, 10),
    unread: row.unread,
    link: row.link ?? undefined,
    type: row.type,
  }
}
