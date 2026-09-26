import { eq } from 'drizzle-orm'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { getDb } from '../server/database/client'
import { resetDatabase } from '../server/database/reset'
import { serviceProviders, users } from '../server/database/schema'
import { registerSchema } from '../shared/schemas'
import { ApiError } from '../server/utils/errors'
import { consumeRateLimit, resetRateLimits } from '../server/utils/http'
import { parseSchema } from '../server/utils/validate'
import { getUserByToken, loginUser, logoutToken, registerUser } from '../server/services/auth.service'
import { createBuilding, getBuilding, joinByCode, listMembers, removeMember } from '../server/services/buildings.service'
import { createAnnouncement, createCharge, updateCharge } from '../server/services/content.service'
import { listProviders } from '../server/services/providers.service'
import type { User } from '../types'

async function manager(email: string) {
  const result = await registerUser({ name: 'مدیر تست', email, password: 'secret-pass' })
  return result
}

describe('auth', () => {
  beforeAll(async () => {
    await migrate(getDb(), { migrationsFolder: 'server/database/migrations' })
  })

  beforeEach(async () => {
    await resetDatabase()
    resetRateLimits()
  })

  it('rejects a short password and a duplicate email', async () => {
    expect(() => parseSchema(registerSchema, { name: 'علی', email: 'ali@example.com', password: 'abc' })).toThrow(ApiError)
    const created = await manager('ali@example.com')
    expect(created.user.role).toBe('manager')
    expect(created.user.email).toBe('ali@example.com')
    await expect(manager('ali@example.com')).rejects.toMatchObject({ code: 'CONFLICT', status: 409 })
  })

  it('logs in with the right password and rejects the wrong one', async () => {
    await manager('login@example.com')
    await expect(loginUser({ email: 'login@example.com', password: 'nope' })).rejects.toMatchObject({ status: 401 })
    await expect(loginUser({ email: 'missing@example.com', password: 'secret-pass' })).rejects.toMatchObject({ status: 401 })
    const session = await loginUser({ email: 'login@example.com', password: 'secret-pass' })
    expect(session.user.email).toBe('login@example.com')
    expect(await getUserByToken(session.token)).toMatchObject({ email: 'login@example.com' })
    await logoutToken(session.token)
    expect(await getUserByToken(session.token)).toBeNull()
  })

  it('rate limits repeated attempts', () => {
    for (let i = 0; i < 10; i += 1) consumeRateLimit('login:test', 10, 60_000)
    expect(() => consumeRateLimit('login:test', 10, 60_000)).toThrow(ApiError)
  })
})

describe('building access and finance', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('hides a building from outsiders until they join, then blocks resident billing', async () => {
    const owner = await manager('owner@example.com')
    const other = await manager('other@example.com')
    const building = await createBuilding(owner.user, {
      name: 'ساختمان تست',
      address: 'تهران',
      description: 'نمونه',
    })
    await expect(getBuilding(other.user, building.id)).rejects.toMatchObject({ status: 403 })
    await expect(createAnnouncement(other.user, building.id, { title: 'خبر', description: 'متن' })).rejects.toMatchObject({ status: 403 })

    const joined = await joinByCode(other.user, { code: building.invitationCode.toLowerCase() })
    expect(joined?.id).toBe(building.id)
    expect((await getBuilding(other.user, building.id)).name).toBe('ساختمان تست')
    const again = await getDb().select().from(users).where(eq(users.id, other.user.id))
    expect(again[0]?.role).toBe('manager')

    await expect(createCharge(other.user, building.id, {
      title: 'شارژ',
      amount: '1500',
      period: 'مهر',
      dueDate: '۱۴۰۵/۰۷/۰۱',
    })).rejects.toMatchObject({ status: 403 })

    const charge = await createCharge(owner.user, building.id, {
      title: 'شارژ مهر',
      amount: 1500,
      period: 'مهر',
      dueDate: '۱۴۰۵/۰۷/۰۱',
      description: '',
    })
    expect(charge.status).toBe('unpaid')
    const paid = await updateCharge(owner.user, charge.id, { status: 'paid' })
    expect(paid.status).toBe('paid')
    expect(paid.paidBy).toBe(owner.user.id)
    expect(paid.amount).toBe(1500)
  })

  it('refuses to remove the last manager', async () => {
    const owner = await manager('last@example.com')
    const building = await createBuilding(owner.user, { name: 'تنها', address: 'تهران' })
    const members = await listMembers(owner.user, building.id)
    const managerMember = members.find((member) => member.role === 'manager')
    expect(managerMember).toBeTruthy()
    await expect(removeMember(owner.user, building.id, managerMember!.id)).rejects.toMatchObject({ status: 409 })
  })
})

describe('providers', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('filters by text and category', async () => {
    await getDb().insert(serviceProviders).values([
      { name: 'برق پارس', category: 'electricity', description: 'سیم‌کشی', rating: '4.5', phone: '021', area: 'تهران مرکز', workingHours: '۹ تا ۱۸', trusted: false },
      { name: 'آب روشن', category: 'plumbing', description: 'لوله‌کشی', rating: '4.0', phone: '021', area: 'تهران شمال', workingHours: '۸ تا ۲۰', trusted: true },
    ])
    const found = await listProviders({ q: 'برق', category: 'electricity' })
    expect(found.map((item) => item.name)).toEqual(['برق پارس'])
    const escaped = await listProviders({ q: '%برق' })
    expect(escaped).toHaveLength(0)
  })

  it('lets a manager mark a provider trusted and rejects a resident', async () => {
    const [row] = await getDb().insert(serviceProviders).values({
      name: 'نظافت', category: 'cleaning', description: 'ساختمان', rating: '4.2', phone: '021', area: 'شرق', workingHours: '۸', trusted: false,
    }).returning()
    const owner = await manager('trust@example.com')
    const { setProviderTrusted } = await import('../server/services/providers.service')
    const updated = await setProviderTrusted(owner.user, row!.id, { trusted: true })
    expect(updated.trusted).toBe(true)
    await getDb().update(users).set({ role: 'resident' }).where(eq(users.id, owner.user.id))
    const resident = { ...owner.user, role: 'resident' } as User
    await expect(setProviderTrusted(resident, row!.id, { trusted: false })).rejects.toMatchObject({ status: 403 })
  })
})
