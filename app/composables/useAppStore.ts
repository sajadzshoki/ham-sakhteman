import type {
  Announcement,
  AnnouncementImportance,
  AppNotification,
  AuthUser,
  Building,
  BuildingCharge,
  BuildingMember,
  BuildingUnit,
  BuildingRole,
  ChargePayment,
  ChargeStatus,
  Expense,
  ExpenseCategory,
  Invitation,
  NotificationType,
  ProblemCategory,
  ProblemReport,
  ProblemStatus,
  ServiceProvider,
  UnitStatus,
} from '~/types'
import { serviceProviders } from '~/data/providers'
import {
  DEMO_ADMIN_ID,
  DEMO_BUILDING_ID,
  DEMO_MANAGER_ID,
  DEMO_RESIDENT_ID,
  seedAnnouncements,
  seedBuildings,
  seedCharges,
  seedExpenses,
  seedInvitations,
  seedMembers,
  seedPayments,
  seedProblems,
  seedTrustedProviderIds,
  seedUnits,
} from '~/data/seed'

/**
 * استور دامنه (ساختمان/واحدها/اعضا/دعوت‌نامه‌ها/شارژ/هزینه‌ها) با ذخیره‌سازی در کوکی.
 * کوکی‌ها در SSR هم قابل خواندن‌اند تا رندر سرور و کلاینت هم‌خوان بمانند.
 * در فاز بک‌اند واقعی، این لایه با فراخوانی API جایگزین می‌شود.
 */
export function useAppStore() {
  const refs = useStoreRefs()
  const buildings = refs.buildings
  const units = refs.units
  const members = refs.members
  const invitations = refs.invitations
  const announcements = refs.announcements
  const problems = refs.problems
  const charges = refs.charges
  const payments = refs.payments
  const expenses = refs.expenses
  const trustedProviders = refs.trustedProviders
  const notifications = refs.notifications
  const seeded = refs.seeded

  // ——— بذرپاشی دیتای دمو ———

  function ensureSeeded() {
    if (seeded.value) return

    const demoUsers: AuthUser[] = [
      {
        id: DEMO_MANAGER_ID,
        name: 'رضا احمدی',
        phone: '09121112233',
        role: 'manager',
        password: '1234',
        createdAt: daysAgo(200).toISOString(),
      },
      {
        id: DEMO_RESIDENT_ID,
        name: 'سارا محمدی',
        phone: '09123456789',
        role: 'resident',
        password: '1234',
        createdAt: daysAgo(200).toISOString(),
      },
      {
        id: DEMO_ADMIN_ID,
        name: 'نگار توکلی',
        phone: '09120000000',
        role: 'superadmin',
        password: '1234',
        createdAt: daysAgo(300).toISOString(),
      },
    ]

    const knownIds = new Set(refs.users.value.map(item => item.id))
    const knownPhones = new Set(refs.users.value.map(item => normalizePhone(item.phone)))
    const missingUsers = demoUsers.filter(item => !knownIds.has(item.id) && !knownPhones.has(item.phone))
    if (missingUsers.length > 0) {
      refs.users.value = [...missingUsers, ...refs.users.value]
    }

    // فقط وقتی داده‌ای وجود ندارد بذر بکار؛ از دست رفتن کوکیِ «بذرپاشی‌شده» نباید ساختمان کاربر را پاک کند
    if (buildings.value.length === 0) {
      buildings.value = [...seedBuildings]
      units.value = [...seedUnits]
      members.value = [...seedMembers]
      invitations.value = [...seedInvitations]
      announcements.value = [...seedAnnouncements]
      problems.value = [...seedProblems]
      charges.value = [...seedCharges]
      payments.value = [...seedPayments]
      expenses.value = [...seedExpenses]
    }
    // «مورد اعتماد ساختمان» دمو؛ اگر کاربر قبلاً فهرستی برای این ساختمان ساخته، دست نمی‌خورد
    if (!trustedProviders.value[DEMO_BUILDING_ID]) {
      trustedProviders.value = { ...trustedProviders.value, [DEMO_BUILDING_ID]: [...seedTrustedProviderIds] }
    }
    seeded.value = true
  }

  /** دسترسی مدیریت ساختمان از روی عضویت است، نه فقط نقشی که هنگام ثبت‌نام انتخاب شده */
  function isBuildingManager(user: AuthUser | null): boolean {
    if (!user || user.role === 'superadmin') return false
    const membership = membershipOfUser(user)
    if (membership) return membership.role === 'manager'
    return user.role === 'manager'
  }

  // ——— کوئری‌ها ———

  function membershipOfUser(user: AuthUser | null): BuildingMember | null {
    if (!user) return null
    return members.value.find(member => member.userId === user.id) ?? null
  }

  function buildingOfUser(user: AuthUser | null): Building | null {
    const membership = membershipOfUser(user)
    if (!membership) return null
    return buildings.value.find(building => building.id === membership.buildingId) ?? null
  }

  const buildingById = (id: string) => buildings.value.find(building => building.id === id) ?? null

  const buildingUnits = (buildingId: string) =>
    units.value
      .filter(unit => unit.buildingId === buildingId)
      .sort((a, b) => a.number - b.number)

  const buildingMembers = (buildingId: string) =>
    members.value.filter(member => member.buildingId === buildingId)

  const buildingManager = (buildingId: string) =>
    members.value.find(member => member.buildingId === buildingId && member.role === 'manager') ?? null

  const memberOfUnit = (unitId: string) =>
    members.value.find(member => member.unitId === unitId) ?? null

  const residentCount = (buildingId: string) =>
    members.value.filter(member => member.buildingId === buildingId && member.role === 'resident').length

  const floorCount = (buildingId: string) =>
    buildingUnits(buildingId).reduce((max, unit) => Math.max(max, unit.floor), 0)

  // ——— ساختمان ———

  function createBuilding(
    input: { name: string; address: string; unitsCount: number; description?: string },
    manager: AuthUser,
  ): Building {
    const building: Building = {
      id: createId('b'),
      name: input.name.trim(),
      address: input.address.trim(),
      unitsCount: input.unitsCount,
      description: input.description?.trim() || undefined,
      managerId: manager.id,
      createdAt: new Date().toISOString(),
    }
    buildings.value = [...buildings.value, building]

    // تولید خودکار واحدها: هر طبقه ۲ واحد
    const generated: BuildingUnit[] = Array.from({ length: input.unitsCount }, (_, index) => ({
      id: createId('u'),
      buildingId: building.id,
      number: index + 1,
      floor: Math.floor(index / 2) + 1,
    }))
    units.value = [...units.value, ...generated]

    const managerMember: BuildingMember = {
      id: createId('m'),
      buildingId: building.id,
      userId: manager.id,
      name: manager.name,
      phone: manager.phone,
      role: 'manager',
      joinedAt: new Date().toISOString(),
    }
    members.value = [...members.value, managerMember]

    return building
  }

  function updateBuilding(id: string, patch: Partial<Pick<Building, 'name' | 'address' | 'unitsCount' | 'description'>>) {
    buildings.value = buildings.value.map(building =>
      building.id === id ? { ...building, ...patch } : building,
    )
  }

  // ——— واحدها ———

  function addUnit(buildingId: string, input: { number: number; floor: number }): BuildingUnit {
    const unit: BuildingUnit = { id: createId('u'), buildingId, number: input.number, floor: input.floor }
    units.value = [...units.value, unit]
    syncUnitsCount(buildingId)
    return unit
  }

  function updateUnit(id: string, patch: Partial<Pick<BuildingUnit, 'number' | 'floor'>>) {
    units.value = units.value.map(unit => (unit.id === id ? { ...unit, ...patch } : unit))
  }

  function syncUnitsCount(buildingId: string) {
    updateBuilding(buildingId, {
      unitsCount: units.value.filter(unit => unit.buildingId === buildingId).length,
    })
  }

  /**
   * بازتولید واحدهای خودکار آنبردینگ وقتی تعداد واحد در مرحله ساخت تغییر می‌کند.
   * تخصیص واحدهای قبلی پاک می‌شود چون شماره واحدها از نو ساخته می‌شوند.
   */
  function replaceGeneratedUnits(buildingId: string, count: number) {
    const generated: BuildingUnit[] = Array.from({ length: count }, (_, index) => ({
      id: createId('u'),
      buildingId,
      number: index + 1,
      floor: Math.floor(index / 2) + 1,
    }))
    units.value = [...units.value.filter(unit => unit.buildingId !== buildingId), ...generated]
    members.value = members.value.map(member =>
      member.buildingId === buildingId ? { ...member, unitId: undefined, unitStatus: undefined } : member,
    )
    syncUnitsCount(buildingId)
  }

  function removeUnit(id: string) {
    const buildingId = units.value.find(unit => unit.id === id)?.buildingId
    units.value = units.value.filter(unit => unit.id !== id)
    // آزادسازی اعضای تخصیص‌یافته به واحد حذف‌شده
    members.value = members.value.map(member =>
      member.unitId === id ? { ...member, unitId: undefined, unitStatus: undefined } : member,
    )
    if (buildingId) syncUnitsCount(buildingId)
  }

  // ——— اعضا ———

  function addMember(buildingId: string, input: {
    name: string
    phone?: string
    role: BuildingRole
    unitId?: string
    unitStatus?: UnitStatus
  }): BuildingMember {
    if (input.unitId) {
      // هر واحد فقط یک عضو اصلی دارد
      members.value = members.value.map(member =>
        member.unitId === input.unitId ? { ...member, unitId: undefined, unitStatus: undefined } : member,
      )
    }
    const member: BuildingMember = {
      id: createId('m'),
      buildingId,
      name: input.name.trim(),
      phone: input.phone ? (normalizePhone(input.phone) || undefined) : undefined,
      role: input.role,
      unitId: input.unitId || undefined,
      unitStatus: input.unitId ? (input.unitStatus ?? 'owner') : undefined,
      joinedAt: new Date().toISOString(),
    }
    members.value = [...members.value, member]
    return member
  }

  function removeMember(id: string) {
    members.value = members.value.filter(member => member.id !== id)
  }

  function assignMemberToUnit(memberId: string, unitId: string | null, unitStatus?: UnitStatus) {
    members.value = members.value.map((member) => {
      if (member.id === memberId) {
        return unitId
          ? { ...member, unitId, unitStatus: unitStatus ?? 'owner' }
          : { ...member, unitId: undefined, unitStatus: undefined }
      }
      // واحد را از عضو قبلی جدا کن
      if (unitId && member.unitId === unitId) {
        return { ...member, unitId: undefined, unitStatus: undefined }
      }
      return member
    })
  }

  /** ویرایش پروفایل: نام کاربر در فهرست کاربران، نشست فعلی و عضویت‌ها به‌روز می‌شود */
  function updateProfile(userId: string, name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    refs.users.value = refs.users.value.map(item => (item.id === userId ? { ...item, name: trimmed } : item))
    if (refs.user.value?.id === userId) {
      refs.user.value = { ...refs.user.value, name: trimmed }
    }
    members.value = members.value.map(member => (member.userId === userId ? { ...member, name: trimmed } : member))
  }

  // ——— دعوت‌نامه‌ها ———

  function createInvitation(buildingId: string, role: BuildingRole, creatorId: string): Invitation {
    const invitation: Invitation = {
      id: createId('inv'),
      buildingId,
      code: generateInviteCode(),
      role,
      createdBy: creatorId,
      createdAt: new Date().toISOString(),
      expiresAt: daysAhead(365).toISOString(),
      status: 'active',
    }
    invitations.value = [invitation, ...invitations.value]
    return invitation
  }

  function removeInvitation(id: string) {
    invitations.value = invitations.value.filter(invitation => invitation.id !== id)
  }

  const buildingInvitations = (buildingId: string) =>
    invitations.value
      .filter(invitation => invitation.buildingId === buildingId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  function findInvitation(code: string): Invitation | null {
    const normalized = normalizeInviteCode(code)
    return invitations.value.find(invitation => invitation.code === normalized) ?? null
  }

  /** وضعیت نمایشی دعوت‌نامه با درنظرگرفتن انقضا */
  function invitationDisplayStatus(invitation: Invitation): Invitation['status'] {
    if (invitation.status === 'active' && new Date(invitation.expiresAt).getTime() < Date.now()) {
      return 'expired'
    }
    return invitation.status
  }

  /** پیوستن کاربر به ساختمان با کد دعوت */
  function joinWithInvitation(code: string, user: AuthUser): { ok: true; building: Building } | { ok: false; error: 'invalid' | 'used' | 'expired' | 'duplicate' } {
    const invitation = findInvitation(code)
    if (!invitation) return { ok: false, error: 'invalid' }
    if (invitation.status === 'used') return { ok: false, error: 'used' }
    if (invitationDisplayStatus(invitation) === 'expired') return { ok: false, error: 'expired' }
    if (invitation.status !== 'active') return { ok: false, error: 'invalid' }
    const building = buildingById(invitation.buildingId)
    if (!building) return { ok: false, error: 'invalid' }
    if (membershipOfUser(user)) return { ok: false, error: 'duplicate' }

    if (user.role !== 'superadmin' && user.role !== invitation.role) {
      refs.users.value = refs.users.value.map(item =>
        item.id === user.id ? { ...item, role: invitation.role } : item,
      )
      if (refs.user.value?.id === user.id) {
        refs.user.value = { ...refs.user.value, role: invitation.role }
      }
    }

    const member: BuildingMember = {
      id: createId('m'),
      buildingId: building.id,
      userId: user.id,
      name: user.name,
      phone: user.phone,
      role: invitation.role,
      joinedAt: new Date().toISOString(),
    }
    members.value = [...members.value, member]
    invitations.value = invitations.value.map(item =>
      item.id === invitation.id ? { ...item, status: 'used' as const } : item,
    )
    return { ok: true, building }
  }

  // ——— اطلاعیه‌ها ———

  const sortByNewest = <T extends { createdAt: string }>(items: T[]) =>
    [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const buildingAnnouncements = (buildingId: string) =>
    sortByNewest(announcements.value.filter(item => item.buildingId === buildingId))

  const getAnnouncement = (id: string) =>
    announcements.value.find(item => item.id === id) ?? null

  function createAnnouncement(
    buildingId: string,
    input: { title: string; body: string; importance: AnnouncementImportance; image?: string },
    author: { id: string; name: string },
  ): Announcement {
    const announcement: Announcement = {
      id: createId('ann'),
      buildingId,
      title: input.title.trim(),
      body: input.body.trim(),
      importance: input.importance,
      image: input.image || undefined,
      createdBy: author.id,
      createdByName: author.name,
      createdAt: new Date().toISOString(),
    }
    announcements.value = [announcement, ...announcements.value]
    pushNotifications(memberUserIds(buildingId, author.id), () => ({
      type: announcement.importance === 'important' ? 'announcement-important' : 'announcement',
      title: announcement.importance === 'important'
        ? `اطلاعیه مهم: «${announcement.title}»`
        : `اطلاعیه جدید: «${announcement.title}»`,
      link: `/announcements/${announcement.id}`,
    }))
    return announcement
  }

  function updateAnnouncement(
    id: string,
    patch: Partial<Pick<Announcement, 'title' | 'body' | 'importance' | 'image'>>,
  ) {
    announcements.value = announcements.value.map((item) => {
      if (item.id !== id) return item
      const next = { ...item, ...patch, updatedAt: new Date().toISOString() }
      if (!next.image) delete next.image
      return next
    })
  }

  function removeAnnouncement(id: string) {
    announcements.value = announcements.value.filter(item => item.id !== id)
  }

  // ——— گزارش مشکلات ———

  const buildingProblems = (buildingId: string) =>
    sortByNewest(problems.value.filter(item => item.buildingId === buildingId))

  const problemsOfUser = (buildingId: string, userId: string) =>
    buildingProblems(buildingId).filter(item => item.reportedBy === userId)

  const openBuildingProblems = (buildingId: string) =>
    buildingProblems(buildingId).filter(item => item.status !== 'resolved')

  const getProblem = (id: string) =>
    problems.value.find(item => item.id === id) ?? null

  function createProblemReport(
    buildingId: string,
    input: { category: ProblemCategory; title: string; description: string; image?: string },
    reporter: { id: string; name: string },
  ): ProblemReport {
    const report: ProblemReport = {
      id: createId('pr'),
      buildingId,
      category: input.category,
      title: input.title.trim(),
      description: input.description.trim(),
      image: input.image || undefined,
      status: 'new',
      reportedBy: reporter.id,
      reportedByName: reporter.name,
      createdAt: new Date().toISOString(),
    }
    problems.value = [report, ...problems.value]
    const managerUserIds = members.value
      .filter(member => member.buildingId === buildingId && member.role === 'manager' && member.userId && member.userId !== reporter.id)
      .map(member => member.userId)
    pushNotifications(managerUserIds, () => ({
      type: 'problem-new',
      title: `گزارش مشکل جدید: «${report.title}»`,
      link: `/problems/${report.id}`,
    }))
    return report
  }

  const problemStatusLabels: Record<ProblemStatus, string> = {
    new: 'جدید',
    'in-progress': 'در حال پیگیری',
    resolved: 'حل شده',
  }

  function updateProblemStatus(id: string, status: ProblemStatus, actorId?: string) {
    const problem = problems.value.find(item => item.id === id)
    if (!problem || problem.status === status) return
    problems.value = problems.value.map(item =>
      item.id === id ? { ...item, status, updatedAt: new Date().toISOString() } : item,
    )
    pushNotifications([problem.reportedBy !== actorId ? problem.reportedBy : undefined], () => ({
      type: 'problem-status',
      title: `وضعیت گزارش «${problem.title}» تغییر کرد`,
      body: `وضعیت جدید: ${problemStatusLabels[status]}`,
      link: `/problems/${problem.id}`,
    }))
  }

  function removeProblem(id: string) {
    problems.value = problems.value.filter(item => item.id !== id)
  }

  // ——— شارژ ———

  const buildingCharges = (buildingId: string) =>
    sortByNewest(charges.value.filter(item => item.buildingId === buildingId))

  const getCharge = (id: string) =>
    charges.value.find(item => item.id === id) ?? null

  function createCharge(
    buildingId: string,
    input: { title: string; period: string; amount: number; dueAt: string; notes?: string },
    creator: { id: string; name: string },
  ): BuildingCharge {
    const charge: BuildingCharge = {
      id: createId('ch'),
      buildingId,
      title: input.title.trim(),
      period: input.period.trim(),
      amount: input.amount,
      dueAt: input.dueAt,
      notes: input.notes?.trim() || undefined,
      createdBy: creator.id,
      createdByName: creator.name,
      createdAt: new Date().toISOString(),
    }
    charges.value = [charge, ...charges.value]
    pushNotifications(memberUserIds(buildingId, creator.id), () => ({
      type: 'charge-new',
      title: `شارژ جدید: ${charge.title} • ${charge.period}`,
      body: `مبلغ سهم هر واحد: ${formatPrice(charge.amount)}`,
      link: `/charges/${charge.id}`,
    }))
    return charge
  }

  function removeCharge(id: string) {
    charges.value = charges.value.filter(item => item.id !== id)
    // پرداخت‌های مرتبط با شارژ حذف‌شده نیز پاک می‌شوند
    payments.value = payments.value.filter(payment => payment.chargeId !== id)
  }

  /** آیا سررسید شارژ گذشته است؟ (مقایسه با ابتدای روز جاری) */
  function isChargePastDue(charge: BuildingCharge): boolean {
    const due = new Date(charge.dueAt)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return due.getTime() < today.getTime()
  }

  const chargePayments = (chargeId: string) =>
    payments.value.filter(payment => payment.chargeId === chargeId)

  const paymentFor = (chargeId: string, memberId: string) =>
    payments.value.find(payment => payment.chargeId === chargeId && payment.memberId === memberId) ?? null

  /** وضعیت پرداخت یک عضو برای یک شارژ: پرداخت‌شده، پرداخت‌نشده یا دیرکرد */
  function chargeStatusFor(charge: BuildingCharge, memberId: string): ChargeStatus {
    if (paymentFor(charge.id, memberId)) return 'paid'
    return isChargePastDue(charge) ? 'overdue' : 'unpaid'
  }

  const chargePaidCount = (chargeId: string) => chargePayments(chargeId).length

  /** تعداد اعضای مشمول پرداخت در ساختمان (هر عضو یک سهم دارد) */
  const chargePayerCount = (buildingId: string) => buildingMembers(buildingId).length

  function recordPayment(
    charge: BuildingCharge,
    member: BuildingMember,
    input: { amount: number; paidAt: string; note?: string },
    recorder: { id: string },
  ): ChargePayment | null {
    // هر عضو برای هر شارژ فقط یک رکورد پرداخت دارد
    if (paymentFor(charge.id, member.id)) return null
    const payment: ChargePayment = {
      id: createId('pay'),
      chargeId: charge.id,
      memberId: member.id,
      memberName: member.name,
      amount: input.amount,
      paidAt: input.paidAt,
      note: input.note?.trim() || undefined,
      method: 'manual',
      recordedBy: recorder.id,
    }
    payments.value = [payment, ...payments.value]
    pushNotifications([member.userId], () => ({
      type: 'payment-recorded',
      title: 'پرداخت شارژ شما ثبت شد',
      body: `${charge.title} • ${charge.period}`,
      link: `/charges/${charge.id}`,
    }))
    return payment
  }

  function removePayment(id: string) {
    payments.value = payments.value.filter(payment => payment.id !== id)
  }

  /** شارژهای پرداخت‌نشده/دیرکردِ یک عضو برای داشبورد — نزدیک‌ترین سررسید اول */
  function dueChargesForMember(buildingId: string, memberId: string): BuildingCharge[] {
    return buildingCharges(buildingId)
      .filter(charge => chargeStatusFor(charge, memberId) !== 'paid')
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
  }

  // ——— هزینه‌ها ———

  const buildingExpenses = (buildingId: string) =>
    expenses.value
      .filter(item => item.buildingId === buildingId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const getExpense = (id: string) =>
    expenses.value.find(item => item.id === id) ?? null

  function createExpense(
    buildingId: string,
    input: {
      title: string
      amount: number
      category: ExpenseCategory
      date: string
      notes?: string
      receipt?: string
    },
    creator: { id: string; name: string },
  ): Expense {
    const expense: Expense = {
      id: createId('ex'),
      buildingId,
      title: input.title.trim(),
      amount: input.amount,
      category: input.category,
      date: input.date,
      notes: input.notes?.trim() || undefined,
      receipt: input.receipt || undefined,
      createdBy: creator.id,
      createdByName: creator.name,
      createdAt: new Date().toISOString(),
    }
    expenses.value = [expense, ...expenses.value]
    return expense
  }

  function removeExpense(id: string) {
    expenses.value = expenses.value.filter(item => item.id !== id)
  }

  // ——— اعلان‌ها ———

  /** سقف اعلان‌های هر کاربر؛ داده در localStorage است و سهم کاربران دیگر را پاک نمی‌کند */
  const NOTIFICATION_CAP = 8

  /** ایجاد اعلان برای کاربران مقصد (بدون اعلان به خودِ انجام‌دهنده عمل) */
  function pushNotifications(
    userIds: (string | undefined)[],
    build: () => { type: NotificationType, title: string, body?: string, link?: string },
  ) {
    const targets = [...new Set(userIds.filter((id): id is string => Boolean(id)))]
    if (targets.length === 0) return
    const created: AppNotification[] = targets.map(userId => ({
      id: createId('ntf'),
      userId,
      ...build(),
      createdAt: new Date().toISOString(),
    }))
    const seen = new Map<string, number>()
    const kept: AppNotification[] = []
    for (const item of [...created, ...notifications.value]) {
      const count = seen.get(item.userId) ?? 0
      if (count >= NOTIFICATION_CAP) continue
      seen.set(item.userId, count + 1)
      kept.push(item)
    }
    notifications.value = kept
  }

  /** شناسه کاربران دارای حساب در ساختمان (به‌جز انجام‌دهنده عمل) */
  const memberUserIds = (buildingId: string, exceptUserId?: string) =>
    members.value
      .filter(member => member.buildingId === buildingId && member.userId && member.userId !== exceptUserId)
      .map(member => member.userId)

  const notificationsFor = (userId: string) =>
    notifications.value
      .filter(item => item.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const unreadNotifications = (userId: string) =>
    notificationsFor(userId).filter(item => !item.readAt)

  function markNotificationRead(id: string) {
    notifications.value = notifications.value.map(item =>
      item.id === id && !item.readAt ? { ...item, readAt: new Date().toISOString() } : item,
    )
  }

  function markAllNotificationsRead(userId: string) {
    const now = new Date().toISOString()
    notifications.value = notifications.value.map(item =>
      item.userId === userId && !item.readAt ? { ...item, readAt: now } : item,
    )
  }

  // ——— خدمات ساختمان (دایره ارائه‌دهندگان) ———

  const allProviders = (): ServiceProvider[] => serviceProviders

  const getProvider = (id: string): ServiceProvider | null =>
    serviceProviders.find(provider => provider.id === id) ?? null

  /** شناسه ارائه‌دهندگان «مورد اعتماد» یک ساختمان */
  const trustedProviderIds = (buildingId: string): string[] =>
    trustedProviders.value[buildingId] ?? []

  const isProviderTrusted = (buildingId: string, providerId: string): boolean =>
    trustedProviderIds(buildingId).includes(providerId)

  /**
   * نشان‌گذاری/برداشتن «مورد اعتماد ساختمان» توسط مدیر؛
   * فهرست به‌صورت شناسه‌ها ذخیره می‌شود تا کوکی کوچک بماند.
   */
  function toggleProviderTrusted(buildingId: string, providerId: string): boolean {
    const current = trustedProviderIds(buildingId)
    const next = current.includes(providerId)
      ? current.filter(id => id !== providerId)
      : [...current, providerId]
    trustedProviders.value = { ...trustedProviders.value, [buildingId]: next }
    return next.includes(providerId)
  }

  /** فهرست مرتب‌شده: موارد مورد اعتماد اول و سپس امتیاز بیشتر */
  function sortedProviders(buildingId: string): ServiceProvider[] {
    return [...serviceProviders].sort((a, b) => {
      const trustedA = isProviderTrusted(buildingId, a.id) ? 1 : 0
      const trustedB = isProviderTrusted(buildingId, b.id) ? 1 : 0
      if (trustedA !== trustedB) return trustedB - trustedA
      return b.rating - a.rating
    })
  }

  // ——— نمای مالی ———

  /**
   * خلاصه مالی ساختمان برای «شفافیت مالی»: درآمد شارژ، مجموع هزینه‌ها، مانده،
   * تعداد سهم‌های پرداخت‌شده/پرداخت‌نشده و هزینه‌های اخیر.
   */
  function financialSummary(buildingId: string) {
    const buildingPayments = payments.value.filter(payment => {
      const charge = getCharge(payment.chargeId)
      return charge?.buildingId === buildingId
    })
    const buildingChargesList = buildingCharges(buildingId)
    const payerCount = chargePayerCount(buildingId)

    const income = buildingPayments.reduce((sum, payment) => sum + payment.amount, 0)
    const expensesTotal = buildingExpenses(buildingId).reduce((sum, item) => sum + item.amount, 0)
    const expectedItems = buildingChargesList.length * payerCount
    const paidItems = buildingPayments.length

    return {
      income,
      expensesTotal,
      balance: income - expensesTotal,
      paidItems,
      unpaidItems: Math.max(0, expectedItems - paidItems),
      expectedItems,
      recentExpenses: buildingExpenses(buildingId).slice(0, 3),
    }
  }

  return {
    buildings,
    units,
    members,
    invitations,
    announcements,
    problems,
    charges,
    payments,
    expenses,
    ensureSeeded,
    isBuildingManager,
    membershipOfUser,
    buildingOfUser,
    buildingById,
    buildingUnits,
    buildingMembers,
    buildingManager,
    memberOfUnit,
    residentCount,
    floorCount,
    createBuilding,
    updateBuilding,
    addUnit,
    updateUnit,
    removeUnit,
    replaceGeneratedUnits,
    addMember,
    removeMember,
    assignMemberToUnit,
    createInvitation,
    removeInvitation,
    buildingInvitations,
    findInvitation,
    invitationDisplayStatus,
    joinWithInvitation,
    buildingAnnouncements,
    getAnnouncement,
    createAnnouncement,
    updateAnnouncement,
    removeAnnouncement,
    buildingProblems,
    problemsOfUser,
    openBuildingProblems,
    getProblem,
    createProblemReport,
    updateProblemStatus,
    removeProblem,
    buildingCharges,
    getCharge,
    createCharge,
    removeCharge,
    isChargePastDue,
    chargePayments,
    paymentFor,
    chargeStatusFor,
    chargePaidCount,
    chargePayerCount,
    recordPayment,
    removePayment,
    dueChargesForMember,
    buildingExpenses,
    getExpense,
    createExpense,
    removeExpense,
    financialSummary,
    allProviders,
    getProvider,
    trustedProviderIds,
    isProviderTrusted,
    toggleProviderTrusted,
    sortedProviders,
    users: refs.users,
    notificationsFor,
    unreadNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    updateProfile,
  }
}
