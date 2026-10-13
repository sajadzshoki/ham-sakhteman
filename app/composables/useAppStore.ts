import type {
  Announcement,
  AnnouncementImportance,
  AppNotification,
  AuthUser,
  Building,
  BuildingCharge,
  BuildingMember,
  BuildingRole,
  BuildingUnit,
  ChargePayment,
  ChargeStatus,
  ChargeWithPayments,
  Expense,
  ExpenseCategory,
  Invitation,
  ProblemCategory,
  ProblemReport,
  ProblemStatus,
  ServiceProvider,
  UnitStatus,
} from '~/types'

/** خلاصه‌ی پلتفرم برای سوپرادمین (`GET /api/admin/overview`) */
export interface AdminOverview {
  buildings: number
  users: number
  providers: number
  announcements: number
  problems: number
  buildingList: Building[]
  providerList: ServiceProvider[]
  userList: AuthUser[]
}

/** پاسخ `GET /api/bootstrap` */
interface BootstrapPayload {
  user: AuthUser
  buildings: Building[]
  buildingId: string | null
  units: BuildingUnit[]
  members: BuildingMember[]
  invitations: Invitation[]
  announcements: Announcement[]
  problems: ProblemReport[]
  charges: ChargeWithPayments[]
  expenses: Expense[]
  notifications: AppNotification[]
  providers: ServiceProvider[]
  admin: AdminOverview | null
}

/** هر طبقه چند واحد دارد؛ با سرور (ساخت خودکار واحدها) هماهنگ است */
const UNITS_PER_FLOOR = 4

const sortByNewest = <T extends { createdAt: string }>(items: T[]) =>
  [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

/**
 * استور دامنه (ساختمان/واحدها/اعضا/دعوت‌نامه‌ها/شارژ/هزینه‌ها/اعلان‌ها/خدمات).
 * داده از `GET /api/bootstrap` می‌آید و در `useState` نگه داشته می‌شود (هم‌خوان در SSR و کلاینت)؛
 * هر تغییر از طریق API انجام می‌شود و سپس استور از نو همگام می‌شود.
 */
export function useAppStore() {
  const request = useApi()
  const nuxtApp = useNuxtApp() as ReturnType<typeof useNuxtApp> & { _hamBootstrap?: Promise<void> | null }
  const authUser = useAuthState()

  const loaded = useState<boolean>('store-loaded', () => false)
  const buildingId = useState<string | null>('store-building-id', () => null)
  const buildings = useState<Building[]>('store-buildings', () => [])
  const units = useState<BuildingUnit[]>('store-units', () => [])
  const members = useState<BuildingMember[]>('store-members', () => [])
  const invitations = useState<Invitation[]>('store-invitations', () => [])
  const announcements = useState<Announcement[]>('store-announcements', () => [])
  const problems = useState<ProblemReport[]>('store-problems', () => [])
  const charges = useState<ChargeWithPayments[]>('store-charges', () => [])
  const expenses = useState<Expense[]>('store-expenses', () => [])
  const notifications = useState<AppNotification[]>('store-notifications', () => [])
  const providers = useState<ServiceProvider[]>('store-providers', () => [])
  const adminOverview = useState<AdminOverview | null>('store-admin', () => null)

  /** همه‌ی پرداخت‌های ساختمان فعال (از شارژها استخراج می‌شود) */
  const payments = computed<ChargePayment[]>(() => charges.value.flatMap(charge => charge.payments))

  // ——— بارگذاری و همگام‌سازی ———

  function reset() {
    loaded.value = false
    buildingId.value = null
    buildings.value = []
    units.value = []
    members.value = []
    invitations.value = []
    announcements.value = []
    problems.value = []
    charges.value = []
    expenses.value = []
    notifications.value = []
    providers.value = []
    adminOverview.value = null
  }

  /** فراخوانی API؛ نشست منقضی (۴۰۱) کاربر محلی را پاک می‌کند */
  async function call<T>(url: string, options?: Parameters<typeof request>[1]): Promise<T> {
    try {
      return await request<T>(url, options)
    }
    catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        authUser.value = null
        reset()
      }
      throw error
    }
  }

  function apply(payload: BootstrapPayload) {
    authUser.value = payload.user
    buildings.value = payload.buildings
    buildingId.value = payload.buildingId
    units.value = payload.units
    members.value = payload.members
    invitations.value = payload.invitations
    announcements.value = payload.announcements
    problems.value = payload.problems
    charges.value = payload.charges
    expenses.value = payload.expenses
    notifications.value = payload.notifications
    providers.value = payload.providers
    adminOverview.value = payload.admin
    loaded.value = true
  }

  /** بارگذاری مجدد کل داده‌ی کاربر از سرور */
  async function refresh(targetBuildingId?: string) {
    const payload = await call<BootstrapPayload>('/api/bootstrap', {
      query: { buildingId: targetBuildingId ?? buildingId.value ?? undefined },
    })
    apply(payload)
  }

  /** پس از هر تغییر موفق: خطای بارگذاری مجدد نباید خودِ تغییر را ناموفق نشان دهد */
  async function sync(targetBuildingId?: string) {
    try {
      await refresh(targetBuildingId)
    }
    catch {
      // داده‌ی قبلی تا بارگذاری بعدی نمایش داده می‌شود
    }
  }

  /** اگر کاربر وارد شده و داده هنوز بارگذاری نشده، یک‌بار بارگذاری می‌کند */
  async function ensureLoaded() {
    if (loaded.value || !authUser.value) return
    if (!nuxtApp._hamBootstrap) {
      nuxtApp._hamBootstrap = refresh().finally(() => {
        nuxtApp._hamBootstrap = null
      })
    }
    await nuxtApp._hamBootstrap
  }

  // ——— کوئری‌ها ———

  /** دسترسی مدیریت ساختمان از روی عضویت است، نه فقط نقشی که هنگام ثبت‌نام انتخاب شده */
  function isBuildingManager(user: AuthUser | null): boolean {
    if (!user || user.role === 'superadmin') return false
    const membership = membershipOfUser(user)
    if (membership) return membership.role === 'manager'
    return user.role === 'manager'
  }

  function membershipOfUser(user: AuthUser | null): BuildingMember | null {
    if (!user || !buildingId.value) return null
    return members.value.find(member => member.userId === user.id && member.buildingId === buildingId.value) ?? null
  }

  /** ساختمان فعال کاربر (استور فقط داده‌ی ساختمان فعال را نگه می‌دارد) */
  function buildingOfUser(user: AuthUser | null): Building | null {
    if (!user || user.role === 'superadmin' || !buildingId.value) return null
    return buildings.value.find(building => building.id === buildingId.value) ?? null
  }

  const buildingById = (id: string) => buildings.value.find(building => building.id === id) ?? null

  const buildingUnits = (id: string) =>
    units.value
      .filter(unit => unit.buildingId === id)
      .sort((a, b) => a.number - b.number)

  const buildingMembers = (id: string) =>
    members.value.filter(member => member.buildingId === id)

  const buildingManager = (id: string) =>
    members.value.find(member => member.buildingId === id && member.role === 'manager') ?? null

  const memberOfUnit = (unitId: string) =>
    members.value.find(member => member.unitId === unitId) ?? null

  const residentCount = (id: string) =>
    members.value.filter(member => member.buildingId === id && member.role === 'resident').length

  const floorCount = (id: string) =>
    buildingUnits(id).reduce((max, unit) => Math.max(max, unit.floor), 0)

  // ——— ساختمان ———

  async function createBuilding(
    input: { name: string, address: string, unitsCount: number, description?: string },
  ): Promise<Building> {
    const created = await call<Building>('/api/buildings', {
      method: 'POST',
      body: {
        name: input.name.trim(),
        address: input.address.trim(),
        description: input.description?.trim() ?? '',
        unitCount: input.unitsCount,
      },
    })
    await sync(created.id)
    return buildingById(created.id) ?? created
  }

  async function updateBuilding(
    id: string,
    patch: Partial<Pick<Building, 'name' | 'address' | 'description'>>,
  ): Promise<Building> {
    const updated = await call<Building>(`/api/buildings/${id}`, {
      method: 'PATCH',
      body: {
        ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
        ...(patch.address !== undefined ? { address: patch.address.trim() } : {}),
        ...(patch.description !== undefined ? { description: patch.description.trim() } : {}),
      },
    })
    await sync()
    return buildingById(id) ?? updated
  }

  // ——— واحدها ———

  async function addUnit(id: string, input: { number: number, floor: number }): Promise<BuildingUnit> {
    const unit = await call<BuildingUnit>(`/api/buildings/${id}/units`, { method: 'POST', body: { ...input } })
    await sync()
    return unit
  }

  async function updateUnit(unitId: string, patch: Partial<Pick<BuildingUnit, 'number' | 'floor'>>): Promise<BuildingUnit> {
    const current = units.value.find(unit => unit.id === unitId)
    if (!current) throw new ApiRequestError('واحد پیدا نشد.', 404, 'NOT_FOUND')
    const unit = await call<BuildingUnit>(`/api/buildings/${current.buildingId}/units/${unitId}`, {
      method: 'PATCH',
      body: { ...patch },
    })
    await sync()
    return unit
  }

  async function deleteUnit(unitId: string): Promise<void> {
    const current = units.value.find(unit => unit.id === unitId)
    if (!current) return
    await call(`/api/buildings/${current.buildingId}/units/${unitId}`, { method: 'DELETE' })
    await sync()
  }

  /**
   * هم‌اندازه‌کردن واحدهای ساخته‌شده‌ی آنبردینگ با تعداد جدید:
   * واحدهای شماره‌ی بالاتر حذف یا واحدهای تازه با ترتیب طبقه‌بندی سرور اضافه می‌شوند.
   */
  async function resizeUnits(id: string, count: number): Promise<void> {
    const current = buildingUnits(id)
    if (count > current.length) {
      const last = current.reduce((max, unit) => Math.max(max, unit.number), 0)
      for (let number = last + 1; number <= last + (count - current.length); number += 1) {
        await call(`/api/buildings/${id}/units`, {
          method: 'POST',
          body: { number, floor: Math.ceil(number / UNITS_PER_FLOOR) },
        })
      }
    }
    else if (count < current.length) {
      for (const unit of current.slice(count).reverse()) {
        await call(`/api/buildings/${id}/units/${unit.id}`, { method: 'DELETE' })
      }
    }
    await sync()
  }

  // ——— اعضا ———

  async function addMember(id: string, input: {
    name: string
    phone?: string
    role: BuildingRole
    unitId?: string
    unitStatus?: UnitStatus
  }): Promise<BuildingMember> {
    const member = await call<BuildingMember>(`/api/buildings/${id}/members`, {
      method: 'POST',
      body: {
        name: input.name.trim(),
        ...(input.phone ? { phone: input.phone } : {}),
        role: input.role,
        ...(input.unitId ? { unitId: input.unitId, unitStatus: input.unitStatus ?? 'owner' } : {}),
      },
    })
    await sync()
    return member
  }

  async function updateMember(memberId: string, patch: {
    name?: string
    phone?: string | null
    role?: BuildingRole
    unitId?: string | null
    unitStatus?: UnitStatus | null
  }): Promise<BuildingMember> {
    const current = members.value.find(member => member.id === memberId)
    if (!current) throw new ApiRequestError('عضو پیدا نشد.', 404, 'NOT_FOUND')
    const member = await call<BuildingMember>(`/api/buildings/${current.buildingId}/members/${memberId}`, {
      method: 'PATCH',
      body: { ...patch },
    })
    await sync()
    return member
  }

  async function removeMember(memberId: string): Promise<void> {
    const current = members.value.find(member => member.id === memberId)
    if (!current) return
    await call(`/api/buildings/${current.buildingId}/members/${memberId}`, { method: 'DELETE' })
    await sync()
  }

  /** تخصیص (یا جداکردن با `unitId = null`) واحد به عضو؛ هر واحد فقط یک عضو اصلی دارد */
  async function assignMemberToUnit(memberId: string, unitId: string | null, unitStatus?: UnitStatus): Promise<void> {
    const target = members.value.find(member => member.id === memberId)
    if (!target) return
    const base = `/api/buildings/${target.buildingId}/members`
    if (unitId) {
      const previous = members.value.find(member => member.unitId === unitId && member.id !== memberId)
      if (previous) {
        await call(`${base}/${previous.id}`, { method: 'PATCH', body: { unitId: null } })
      }
      await call(`${base}/${memberId}`, { method: 'PATCH', body: { unitId, unitStatus: unitStatus ?? 'owner' } })
    }
    else {
      await call(`${base}/${memberId}`, { method: 'PATCH', body: { unitId: null } })
    }
    await sync()
  }

  /** ویرایش پروفایل: فقط نام قابل ویرایش است */
  async function updateProfile(name: string): Promise<AuthUser | null> {
    const trimmed = name.trim()
    if (!trimmed) return null
    const result = await call<{ user: AuthUser }>('/api/me', { method: 'PATCH', body: { name: trimmed } })
    authUser.value = result.user
    members.value = members.value.map(member => (member.userId === result.user.id ? { ...member, name: result.user.name } : member))
    return result.user
  }

  // ——— دعوت‌نامه‌ها ———

  async function createInvitation(id: string, role: BuildingRole): Promise<Invitation> {
    const invitation = await call<Invitation>(`/api/buildings/${id}/invitations`, { method: 'POST', body: { role } })
    await sync()
    return invitation
  }

  async function deleteInvitation(invitationId: string): Promise<void> {
    const current = invitations.value.find(invitation => invitation.id === invitationId)
    if (!current) return
    await call(`/api/buildings/${current.buildingId}/invitations/${invitationId}`, { method: 'DELETE' })
    await sync()
  }

  const buildingInvitations = (id: string) =>
    invitations.value
      .filter(invitation => invitation.buildingId === id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  /** وضعیت نمایشی دعوت‌نامه با درنظرگرفتن انقضا */
  function invitationDisplayStatus(invitation: Invitation): Invitation['status'] {
    if (invitation.status === 'active' && new Date(invitation.expiresAt).getTime() < Date.now()) {
      return 'expired'
    }
    return invitation.status
  }

  /** پیوستن کاربر به ساختمان با کد دعوت؛ خطا (کد نامعتبر/استفاده‌شده/منقضی) پرتاب می‌شود */
  async function joinWithInvitation(code: string): Promise<Building> {
    const building = await call<Building>('/api/invitations/join', {
      method: 'POST',
      body: { code: normalizeInviteCode(code) },
    })
    await sync(building.id)
    return buildingById(building.id) ?? building
  }

  // ——— اطلاعیه‌ها ———

  const buildingAnnouncements = (id: string) =>
    sortByNewest(announcements.value.filter(item => item.buildingId === id))

  const getAnnouncement = (id: string) =>
    announcements.value.find(item => item.id === id) ?? null

  async function createAnnouncement(
    id: string,
    input: { title: string, body: string, importance: AnnouncementImportance, image?: string },
  ): Promise<Announcement> {
    const announcement = await call<Announcement>(`/api/buildings/${id}/announcements`, {
      method: 'POST',
      body: {
        title: input.title.trim(),
        body: input.body.trim(),
        importance: input.importance,
        image: input.image ?? null,
      },
    })
    await sync()
    return announcement
  }

  async function updateAnnouncement(
    id: string,
    patch: { title?: string, body?: string, importance?: AnnouncementImportance, image?: string | null },
  ): Promise<Announcement> {
    const announcement = await call<Announcement>(`/api/announcements/${id}`, {
      method: 'PATCH',
      body: {
        ...(patch.title !== undefined ? { title: patch.title.trim() } : {}),
        ...(patch.body !== undefined ? { body: patch.body.trim() } : {}),
        ...(patch.importance !== undefined ? { importance: patch.importance } : {}),
        ...(patch.image !== undefined ? { image: patch.image } : {}),
      },
    })
    await sync()
    return announcement
  }

  async function deleteAnnouncement(id: string): Promise<void> {
    await call(`/api/announcements/${id}`, { method: 'DELETE' })
    await sync()
  }

  // ——— گزارش مشکلات ———

  const buildingProblems = (id: string) =>
    sortByNewest(problems.value.filter(item => item.buildingId === id))

  const problemsOfUser = (id: string, userId: string) =>
    buildingProblems(id).filter(item => item.reportedBy === userId)

  const openBuildingProblems = (id: string) =>
    buildingProblems(id).filter(item => item.status !== 'resolved')

  const getProblem = (id: string) =>
    problems.value.find(item => item.id === id) ?? null

  async function createProblemReport(
    id: string,
    input: { category: ProblemCategory, title: string, description: string, image?: string },
  ): Promise<ProblemReport> {
    const report = await call<ProblemReport>(`/api/buildings/${id}/problems`, {
      method: 'POST',
      body: {
        category: input.category,
        title: input.title.trim(),
        description: input.description.trim(),
        image: input.image ?? null,
      },
    })
    await sync()
    return report
  }

  async function updateProblemStatus(id: string, status: ProblemStatus): Promise<ProblemReport | null> {
    const current = problems.value.find(item => item.id === id)
    if (!current || current.status === status) return current ?? null
    const report = await call<ProblemReport>(`/api/problems/${id}`, { method: 'PATCH', body: { status } })
    await sync()
    return report
  }

  async function deleteProblem(id: string): Promise<void> {
    await call(`/api/problems/${id}`, { method: 'DELETE' })
    await sync()
  }

  // ——— شارژ ———

  const buildingCharges = (id: string) =>
    sortByNewest(charges.value.filter(item => item.buildingId === id))

  const getCharge = (id: string) =>
    charges.value.find(item => item.id === id) ?? null

  async function createCharge(
    id: string,
    input: { title: string, period: string, amount: number, dueAt: string, notes?: string },
  ): Promise<ChargeWithPayments> {
    const charge = await call<ChargeWithPayments>(`/api/buildings/${id}/charges`, {
      method: 'POST',
      body: {
        title: input.title.trim(),
        period: input.period.trim(),
        amount: input.amount,
        dueAt: input.dueAt,
        notes: input.notes?.trim() ?? '',
      },
    })
    await sync()
    return charge
  }

  async function deleteCharge(id: string): Promise<void> {
    await call(`/api/charges/${id}`, { method: 'DELETE' })
    await sync()
  }

  /** آیا سررسید شارژ گذشته است؟ (مقایسه با ابتدای روز جاری) */
  function isChargePastDue(charge: BuildingCharge): boolean {
    const due = new Date(charge.dueAt)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return due.getTime() < today.getTime()
  }

  const chargePayments = (chargeId: string): ChargePayment[] =>
    getCharge(chargeId)?.payments ?? []

  const paymentFor = (chargeId: string, memberId: string) =>
    chargePayments(chargeId).find(payment => payment.memberId === memberId) ?? null

  /** وضعیت پرداخت یک عضو برای یک شارژ: پرداخت‌شده، پرداخت‌نشده یا دیرکرد */
  function chargeStatusFor(charge: BuildingCharge, memberId: string): ChargeStatus {
    if (paymentFor(charge.id, memberId)) return 'paid'
    return isChargePastDue(charge) ? 'overdue' : 'unpaid'
  }

  const chargePaidCount = (chargeId: string) => chargePayments(chargeId).length

  /** تعداد اعضای مشمول پرداخت در ساختمان (هر عضو یک سهم دارد) */
  const chargePayerCount = (id: string) => buildingMembers(id).length

  /** ثبت دستی پرداخت یک عضو برای شارژ (فقط مدیر)؛ پرداخت تکراری ۴۰۹ می‌دهد */
  async function recordPayment(
    charge: BuildingCharge,
    member: BuildingMember,
    input: { amount: number, paidAt: string, note?: string },
  ): Promise<ChargePayment> {
    const payment = await call<ChargePayment>(`/api/charges/${charge.id}/payments`, {
      method: 'POST',
      body: {
        memberId: member.id,
        amount: input.amount,
        paidAt: input.paidAt,
        note: input.note?.trim() || null,
      },
    })
    await sync()
    return payment
  }

  async function removePayment(paymentId: string): Promise<void> {
    const owner = charges.value.find(charge => charge.payments.some(payment => payment.id === paymentId))
    if (!owner) return
    await call(`/api/charges/${owner.id}/payments/${paymentId}`, { method: 'DELETE' })
    await sync()
  }

  /** شارژهای پرداخت‌نشده/دیرکردِ یک عضو برای داشبورد — نزدیک‌ترین سررسید اول */
  function dueChargesForMember(id: string, memberId: string): BuildingCharge[] {
    return buildingCharges(id)
      .filter(charge => chargeStatusFor(charge, memberId) !== 'paid')
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
  }

  // ——— هزینه‌ها ———

  const buildingExpenses = (id: string) =>
    expenses.value
      .filter(item => item.buildingId === id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const getExpense = (id: string) =>
    expenses.value.find(item => item.id === id) ?? null

  async function createExpense(
    id: string,
    input: { title: string, amount: number, category: ExpenseCategory, date: string, notes?: string, receipt?: string },
  ): Promise<Expense> {
    const expense = await call<Expense>(`/api/buildings/${id}/expenses`, {
      method: 'POST',
      body: {
        title: input.title.trim(),
        amount: input.amount,
        category: input.category,
        date: input.date,
        notes: input.notes?.trim() ?? '',
        receipt: input.receipt ?? null,
      },
    })
    await sync()
    return expense
  }

  async function deleteExpense(id: string): Promise<void> {
    await call(`/api/expenses/${id}`, { method: 'DELETE' })
    await sync()
  }

  // ——— اعلان‌ها ———

  const notificationsFor = (userId: string) =>
    notifications.value
      .filter(item => item.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const unreadNotifications = (userId: string) =>
    notificationsFor(userId).filter(item => !item.readAt)

  /** خوانده‌شدن فوری در UI نشان داده می‌شود و در صورت خطا برمی‌گردد */
  async function markNotificationRead(id: string): Promise<void> {
    const previous = notifications.value
    const target = previous.find(item => item.id === id)
    if (!target || target.readAt) return
    const now = new Date().toISOString()
    notifications.value = previous.map(item => (item.id === id ? { ...item, readAt: now } : item))
    try {
      await call(`/api/notifications/${id}`, { method: 'PATCH', body: { read: true } })
    }
    catch (error) {
      notifications.value = previous
      throw error
    }
  }

  async function markAllNotificationsRead(): Promise<void> {
    const previous = notifications.value
    const now = new Date().toISOString()
    notifications.value = previous.map(item => (item.readAt ? item : { ...item, readAt: now }))
    try {
      await call('/api/notifications/read-all', { method: 'POST' })
    }
    catch (error) {
      notifications.value = previous
      throw error
    }
  }

  // ——— خدمات ساختمان (دایره ارائه‌دهندگان) ———

  const allProviders = (): ServiceProvider[] => providers.value

  const getProvider = (id: string): ServiceProvider | null =>
    providers.value.find(provider => provider.id === id) ?? null

  /** «مورد اعتماد ساختمان» بودن از سرور و برای ساختمان فعال می‌آید */
  const isProviderTrusted = (_buildingId: string, providerId: string): boolean =>
    getProvider(providerId)?.trusted === true

  async function setProviderTrusted(id: string, providerId: string, trusted: boolean): Promise<boolean> {
    const result = await call<ServiceProvider>(`/api/buildings/${id}/providers/${providerId}`, {
      method: 'PATCH',
      body: { trusted },
    })
    providers.value = providers.value.map(provider =>
      provider.id === providerId ? { ...provider, trusted: result.trusted ?? trusted } : provider,
    )
    return result.trusted ?? trusted
  }

  /** نشان‌گذاری/برداشتن «مورد اعتماد ساختمان» توسط مدیر؛ مقدار جدید را برمی‌گرداند */
  function toggleProviderTrusted(id: string, providerId: string): Promise<boolean> {
    return setProviderTrusted(id, providerId, !isProviderTrusted(id, providerId))
  }

  /** فهرست مرتب‌شده: موارد مورد اعتماد اول و سپس امتیاز بیشتر */
  function sortedProviders(id: string): ServiceProvider[] {
    return [...providers.value].sort((a, b) => {
      const trustedA = isProviderTrusted(id, a.id) ? 1 : 0
      const trustedB = isProviderTrusted(id, b.id) ? 1 : 0
      if (trustedA !== trustedB) return trustedB - trustedA
      return b.rating - a.rating
    })
  }

  // ——— نمای مالی ———

  /**
   * خلاصه مالی ساختمان برای «شفافیت مالی»: درآمد شارژ، مجموع هزینه‌ها، مانده،
   * تعداد سهم‌های پرداخت‌شده/پرداخت‌نشده و هزینه‌های اخیر.
   */
  function financialSummary(id: string) {
    const buildingChargesList = buildingCharges(id)
    const buildingPayments = buildingChargesList.flatMap(charge => charge.payments)
    const payerCount = chargePayerCount(id)

    const income = buildingPayments.reduce((sum, payment) => sum + payment.amount, 0)
    const expensesTotal = buildingExpenses(id).reduce((sum, item) => sum + item.amount, 0)
    const expectedItems = buildingChargesList.length * payerCount
    const paidItems = buildingPayments.length

    return {
      income,
      expensesTotal,
      balance: income - expensesTotal,
      paidItems,
      unpaidItems: Math.max(0, expectedItems - paidItems),
      expectedItems,
      recentExpenses: buildingExpenses(id).slice(0, 3),
    }
  }

  return {
    // state
    loaded,
    buildingId,
    buildings,
    units,
    members,
    invitations,
    announcements,
    problems,
    charges,
    payments,
    expenses,
    notifications,
    providers,
    adminOverview,
    // loading
    ensureLoaded,
    refresh,
    reset,
    // queries
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
    // building / units / members
    createBuilding,
    updateBuilding,
    addUnit,
    updateUnit,
    deleteUnit,
    resizeUnits,
    addMember,
    updateMember,
    removeMember,
    assignMemberToUnit,
    updateProfile,
    // invitations
    createInvitation,
    deleteInvitation,
    buildingInvitations,
    invitationDisplayStatus,
    joinWithInvitation,
    // announcements
    buildingAnnouncements,
    getAnnouncement,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    // problems
    buildingProblems,
    problemsOfUser,
    openBuildingProblems,
    getProblem,
    createProblemReport,
    updateProblemStatus,
    deleteProblem,
    // charges
    buildingCharges,
    getCharge,
    createCharge,
    deleteCharge,
    isChargePastDue,
    chargePayments,
    paymentFor,
    chargeStatusFor,
    chargePaidCount,
    chargePayerCount,
    recordPayment,
    removePayment,
    dueChargesForMember,
    // expenses
    buildingExpenses,
    getExpense,
    createExpense,
    deleteExpense,
    financialSummary,
    // providers
    allProviders,
    getProvider,
    isProviderTrusted,
    setProviderTrusted,
    toggleProviderTrusted,
    sortedProviders,
    // notifications
    notificationsFor,
    unreadNotifications,
    markNotificationRead,
    markAllNotificationsRead,
  }
}
