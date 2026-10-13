import { sql } from 'drizzle-orm'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { otpVerifySchema, phoneSchema } from '../shared/schemas'
import { deriveChargeStatus } from '../shared/utils/charge'
import { normalizePhone } from '../shared/utils/phone'
import { getDb } from '../server/database/client'
import { resetDatabase } from '../server/database/reset'
import { buildingUnits, serviceProviders } from '../server/database/schema'
import { getUserByToken, logoutToken } from '../server/services/auth.service'
import {
  addMember,
  createBuilding,
  createInvitation,
  deleteInvitation,
  getBuilding,
  joinByCode,
  listInvitations,
  listMembers,
  listUnits,
  removeMember,
} from '../server/services/buildings.service'
import { createAnnouncement, createCharge, getCharge, listCharges, recordPayment, removePayment } from '../server/services/content.service'
import { listNotifications } from '../server/services/directory.service'
import { requestOtp, verifyOtp } from '../server/services/otp.service'
import { listProviders, setProviderTrusted } from '../server/services/providers.service'
import { ApiError } from '../server/utils/errors'
import { consumeRateLimit, resetRateLimits } from '../server/utils/rate-limit'
import { parseSchema } from '../server/utils/validate'

// ——— بدون دیتابیس ———

describe('phone normalization', () => {
  it('normalizes Iranian mobile numbers to 09xxxxxxxxx', () => {
    expect(normalizePhone('09121112233')).toBe('09121112233')
    expect(normalizePhone('9121112233')).toBe('09121112233')
    expect(normalizePhone('989121112233')).toBe('09121112233')
    expect(normalizePhone('+98 912 111 2233')).toBe('09121112233')
    expect(normalizePhone('۰۹۱۲۱۱۱۲۲۳۳')).toBe('09121112233')
    expect(normalizePhone('0912111223')).toBeNull()
    expect(normalizePhone('02188776655')).toBeNull()
    expect(normalizePhone('')).toBeNull()
  })

  it('validates phone and OTP payloads', () => {
    expect(parseSchema(phoneSchema, '9123456789')).toBe('09123456789')
    expect(() => parseSchema(phoneSchema, '123')).toThrow(ApiError)
    expect(parseSchema(otpVerifySchema, { phone: '09123456789', code: '۱۱۱۱' }).code).toBe('1111')
    expect(() => parseSchema(otpVerifySchema, { phone: '09123456789', code: '12' })).toThrow(ApiError)
    // نقش سوپرادمین هرگز از کلاینت پذیرفته نمی‌شود
    expect(() => parseSchema(otpVerifySchema, { phone: '09123456789', code: '1111', name: 'x', role: 'superadmin' })).toThrow(ApiError)
  })

  it('derives charge status from payment and due date', () => {
    const now = new Date('2026-01-10T00:00:00Z')
    expect(deriveChargeStatus({ dueAt: '2026-01-01T00:00:00Z', paid: true, now })).toBe('paid')
    expect(deriveChargeStatus({ dueAt: '2026-01-01T00:00:00Z', paid: false, now })).toBe('overdue')
    expect(deriveChargeStatus({ dueAt: '2026-02-01T00:00:00Z', paid: false, now })).toBe('unpaid')
  })

  it('rate limits repeated attempts', () => {
    resetRateLimits()
    for (let i = 0; i < 10; i += 1) consumeRateLimit('test:key', 10, 60_000)
    expect(() => consumeRateLimit('test:key', 10, 60_000)).toThrow(ApiError)
    resetRateLimits()
  })
})

// ——— با دیتابیس (فقط وقتی TEST_DATABASE_URL تنظیم و در دسترس باشد) ———

async function databaseAvailable() {
  try {
    await getDb().execute(sql`select 1`)
    return true
  } catch {
    return false
  }
}

const hasDb = await databaseAvailable()

async function signup(phone: string, name: string, role: 'manager' | 'resident' = 'manager') {
  await requestOtp({ phone, purpose: 'register' })
  return verifyOtp({ phone, code: '1111', name, role })
}

describe.skipIf(!hasDb)('phone OTP auth', () => {
  beforeAll(async () => {
    await migrate(getDb(), { migrationsFolder: 'server/database/migrations' })
  })

  beforeEach(async () => {
    await resetDatabase()
    resetRateLimits()
  })

  it('returns the dev code when Kavenegar is not configured and registers with 1111', async () => {
    const requested = await requestOtp({ phone: '9121112233', purpose: 'register' })
    expect(requested).toMatchObject({ phone: '09121112233', devCode: '1111', expiresIn: 300 })

    const created = await verifyOtp({ phone: '09121112233', code: '1111', name: 'رضا احمدی', role: 'manager' })
    expect(created.user).toMatchObject({ phone: '09121112233', role: 'manager', name: 'رضا احمدی' })
    expect(await getUserByToken(created.token)).toMatchObject({ phone: '09121112233' })

    await logoutToken(created.token)
    expect(await getUserByToken(created.token)).toBeNull()
  })

  it('logs in existing users only and rejects duplicates and unknown phones', async () => {
    await signup('09121112233', 'رضا احمدی')
    await expect(requestOtp({ phone: '09121112233', purpose: 'register' })).rejects.toMatchObject({ status: 409 })
    await expect(requestOtp({ phone: '09350000000', purpose: 'login' })).rejects.toMatchObject({ status: 404 })
    await expect(verifyOtp({ phone: '09350000000', code: '1111' })).rejects.toMatchObject({ status: 404 })

    await requestOtp({ phone: '09121112233', purpose: 'login' })
    const session = await verifyOtp({ phone: '09121112233', code: '1111' })
    expect(session.user.phone).toBe('09121112233')
  })

  it('never lets the client create a superadmin', async () => {
    await expect(verifyOtp({ phone: '09121112233', code: '1111', name: 'x', role: 'superadmin' })).rejects.toMatchObject({ status: 422 })
  })
})

describe.skipIf(!hasDb)('building access, invitations and charges', () => {
  beforeEach(async () => {
    await resetDatabase()
    resetRateLimits()
  })

  it('creates a building with units and shares it through one-time invitations', async () => {
    const owner = await signup('09121112233', 'رضا احمدی')
    const guest = await signup('09123456789', 'سارا محمدی', 'resident')
    const building = await createBuilding(owner.user, { name: 'ساختمان آسمان', address: 'تهران', unitCount: 9 })
    expect(building).toMatchObject({ unitsCount: 9, memberCount: 1 })
    expect(building.invitationCode).toBeTruthy()

    const units = await listUnits(owner.user, building.id)
    expect(units.map((unit) => unit.floor)).toEqual([1, 1, 1, 1, 2, 2, 2, 2, 3])

    await expect(getBuilding(guest.user, building.id)).rejects.toMatchObject({ status: 403 })
    await expect(createAnnouncement(guest.user, building.id, { title: 'x' })).rejects.toMatchObject({ status: 403 })

    const invitation = await createInvitation(owner.user, building.id, { role: 'resident' })
    expect(invitation).toMatchObject({ role: 'resident', status: 'active' })
    expect(invitation.link).toContain('/join?code=')
    expect(Date.parse(invitation.expiresAt)).toBeGreaterThan(Date.now())

    const joined = await joinByCode(guest.user, { code: invitation.code.toLowerCase() })
    expect(joined?.id).toBe(building.id)
    // ساکن، کد دعوت ساختمان را نمی‌بیند
    expect(joined?.invitationCode).toBeUndefined()

    const members = await listMembers(owner.user, building.id)
    expect(members).toHaveLength(2)
    expect(members.find((member) => member.userId === guest.user.id)).toMatchObject({ name: 'سارا محمدی', role: 'resident' })

    // کد یک‌بارمصرف است
    const third = await signup('09351112244', 'علی موسوی', 'resident')
    await expect(joinByCode(third.user, { code: invitation.code })).rejects.toMatchObject({ status: 410 })
    const [listed] = await listInvitations(owner.user, building.id)
    expect(listed).toMatchObject({ id: invitation.id, status: 'used', usedBy: guest.user.id })

    // دعوت حذف‌شده دیگر معتبر نیست
    const another = await createInvitation(owner.user, building.id, {})
    await deleteInvitation(owner.user, building.id, another.id)
    await expect(joinByCode(third.user, { code: another.code })).rejects.toMatchObject({ status: 404 })
  })

  it('rejects expired invitations', async () => {
    const owner = await signup('09121112233', 'رضا احمدی')
    const guest = await signup('09123456789', 'سارا محمدی', 'resident')
    const building = await createBuilding(owner.user, { name: 'ساختمان' })
    const invitation = await createInvitation(owner.user, building.id, { expiresAt: new Date(Date.now() + 1000).toISOString() })
    await new Promise((resolve) => setTimeout(resolve, 1200))
    await expect(joinByCode(guest.user, { code: invitation.code })).rejects.toMatchObject({ status: 410, code: 'INVITATION_EXPIRED' })
  })

  it('records manual charge payments per member and derives status', async () => {
    const owner = await signup('09121112233', 'رضا احمدی')
    const guest = await signup('09123456789', 'سارا محمدی', 'resident')
    const building = await createBuilding(owner.user, { name: 'ساختمان آسمان' })
    const invitation = await createInvitation(owner.user, building.id, {})
    await joinByCode(guest.user, { code: invitation.code })
    const [managerMember, residentMember] = await listMembers(owner.user, building.id)

    await expect(createCharge(guest.user, building.id, {
      title: 'شارژ', amount: 1500, period: 'مهر', dueAt: '2026-12-01',
    })).rejects.toMatchObject({ status: 403 })

    const charge = await createCharge(owner.user, building.id, {
      title: 'شارژ ماهانه', amount: 850_000, period: 'مهر ۱۴۰۵', dueAt: new Date(Date.now() - 86400000).toISOString(),
    })
    expect(charge).toMatchObject({ paidCount: 0, memberCount: 2, collectedAmount: 0 })
    expect(charge).not.toHaveProperty('paidAt')

    // اعلان شارژ جدید برای ساکن
    expect((await listNotifications(guest.user)).map((item) => item.type)).toContain('charge-new')

    const payment = await recordPayment(owner.user, charge.id, { memberId: residentMember!.id, note: 'کارت به کارت' })
    expect(payment).toMatchObject({ amount: 850_000, method: 'manual', memberName: 'سارا محمدی', recordedBy: owner.user.id })
    await expect(recordPayment(owner.user, charge.id, { memberId: residentMember!.id })).rejects.toMatchObject({ status: 409 })
    await expect(recordPayment(guest.user, charge.id, { memberId: managerMember!.id })).rejects.toMatchObject({ status: 403 })

    const forResident = await getCharge(guest.user, charge.id)
    expect(forResident.payments).toHaveLength(1)
    expect(forResident).toMatchObject({ status: 'paid', paidCount: 1, collectedAmount: 850_000 })
    expect((await listNotifications(guest.user)).map((item) => item.type)).toContain('payment-recorded')

    // برای مدیر که هنوز پرداخت نکرده، سررسید گذشته یعنی معوق
    const forOwner = (await listCharges(owner.user, building.id))[0]
    expect(forOwner?.status).toBe('overdue')

    await removePayment(owner.user, charge.id, residentMember!.id)
    expect((await getCharge(owner.user, charge.id)).payments).toHaveLength(0)
  })

  it('manages guest members and refuses to remove the last manager', async () => {
    const owner = await signup('09121112233', 'رضا احمدی')
    const building = await createBuilding(owner.user, { name: 'ساختمان', unitCount: 4 })
    const [unit] = await getDb().select().from(buildingUnits).limit(1)
    const guest = await addMember(owner.user, building.id, { name: 'مریم کریمی', unitId: unit!.id, unitStatus: 'owner' })
    expect(guest).toMatchObject({ name: 'مریم کریمی', unitStatus: 'owner', role: 'resident' })
    expect(guest.userId).toBeUndefined()

    const managerMember = (await listMembers(owner.user, building.id)).find((member) => member.role === 'manager')
    await expect(removeMember(owner.user, building.id, managerMember!.id)).rejects.toMatchObject({ status: 409 })
  })
})

describe.skipIf(!hasDb)('building trusted providers', () => {
  beforeEach(async () => {
    await resetDatabase()
    resetRateLimits()
  })

  it('stores trusted flags per building and filters providers', async () => {
    const [plumber, electrician] = await getDb().insert(serviceProviders).values([
      { name: 'لوله‌کشی رحیمی', category: 'plumbing', description: 'نشتی', rating: '4.8', phone: '09124453322', serviceArea: 'سعادت‌آباد', workingHours: '۸ تا ۲۰' },
      { name: 'برق‌کاری کاظمی', category: 'electrical', description: 'سیم‌کشی', rating: '4.6', phone: '09357789912', serviceArea: 'شهرک غرب', workingHours: '۹ تا ۱۹' },
    ]).returning()

    const owner = await signup('09121112233', 'رضا احمدی')
    const other = await signup('09123456789', 'سارا محمدی')
    const building = await createBuilding(owner.user, { name: 'ساختمان آسمان' })
    const otherBuilding = await createBuilding(other.user, { name: 'ساختمان دیگر' })

    await setProviderTrusted(owner.user, building.id, plumber!.id, { trusted: true })
    await expect(setProviderTrusted(other.user, building.id, plumber!.id, { trusted: true })).rejects.toMatchObject({ status: 403 })

    const forBuilding = await listProviders({ buildingId: building.id }, owner.user)
    expect(forBuilding.find((item) => item.id === plumber!.id)?.trusted).toBe(true)
    expect(forBuilding.find((item) => item.id === electrician!.id)?.trusted).toBe(false)

    const forOther = await listProviders({ buildingId: otherBuilding.id }, other.user)
    expect(forOther.every((item) => item.trusted === false)).toBe(true)

    expect((await listProviders({}, null))[0]).not.toHaveProperty('trusted')
    await expect(listProviders({ buildingId: building.id }, null)).rejects.toMatchObject({ status: 401 })
    await expect(listProviders({ buildingId: building.id }, other.user)).rejects.toMatchObject({ status: 403 })

    expect((await listProviders({ q: 'کاظمی', category: 'electrical' }, null)).map((item) => item.name)).toEqual(['برق‌کاری کاظمی'])
    expect(await listProviders({ q: '%' }, null)).toHaveLength(0)

    await setProviderTrusted(owner.user, building.id, plumber!.id, { trusted: false })
    const cleared = await listProviders({ buildingId: building.id }, owner.user)
    expect(cleared.every((item) => item.trusted === false)).toBe(true)
  })
})
