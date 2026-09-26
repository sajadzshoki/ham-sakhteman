import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { loadEnvFile } from '../utils/env'
import { getDb, closeDb } from './client'
import {
  announcements,
  buildingMembers,
  buildingUnits,
  buildings,
  charges,
  expenses,
  notifications,
  problemReports,
  serviceProviders,
  users,
} from './schema'

loadEnvFile()

const ids = {
  admin: '11111111-1111-4111-8111-111111111111',
  manager: '22222222-2222-4222-8222-222222222222',
  resident: '33333333-3333-4333-8333-333333333333',
  building: '44444444-4444-4444-8444-444444444444',
  unit1: '55555555-5555-4555-8555-555555555551',
  unit2: '55555555-5555-4555-8555-555555555552',
  unit3: '55555555-5555-4555-8555-555555555553',
  unit4: '55555555-5555-4555-8555-555555555554',
  memberManager: '66666666-6666-4666-8666-666666666661',
  memberResident: '66666666-6666-4666-8666-666666666662',
  ann1: '77777777-7777-4777-8777-777777777771',
  ann2: '77777777-7777-4777-8777-777777777772',
  problem1: '88888888-8888-4888-8888-888888888881',
  problem2: '88888888-8888-4888-8888-888888888882',
  charge1: '99999999-9999-4999-8999-999999999991',
  charge2: '99999999-9999-4999-8999-999999999992',
  expense1: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  expense2: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
}

const daysAgo = (days: number) => new Date(Date.now() - days * 86400000)

async function main() {
  const db = getDb()
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, 'admin@hamsakhteman.local')).limit(1)
  if (existing) {
    console.log('Seed already applied')
    await closeDb()
    return
  }

  const [adminHash, managerHash, residentHash] = await Promise.all([
    bcrypt.hash('admin-demo', 10),
    bcrypt.hash('manager-demo', 10),
    bcrypt.hash('resident-demo', 10),
  ])

  await db.insert(users).values([
    { id: ids.admin, name: 'مدیر کل', email: 'admin@hamsakhteman.local', passwordHash: adminHash, role: 'admin', avatarInitials: 'مک' },
    { id: ids.manager, name: 'علی رضایی', email: 'manager@hamsakhteman.local', phone: '۰۹۱۲۱۲۳۴۵۶۷', passwordHash: managerHash, role: 'manager', avatarInitials: 'عر' },
    { id: ids.resident, name: 'سارا محمدی', email: 'resident@hamsakhteman.local', passwordHash: residentHash, role: 'resident', avatarInitials: 'سم' },
  ])

  await db.insert(buildings).values({
    id: ids.building,
    name: 'ساختمان شمالی هم‌ساختمان',
    address: 'تهران، خیابان ولیعصر، برج شمالی',
    description: 'ساختمان مدرن با ۲۴ واحد مسکونی',
    managerId: ids.manager,
    invitationCode: 'NORTH1',
  })

  await db.insert(buildingUnits).values([
    { id: ids.unit1, buildingId: ids.building, number: '۴۰۱', floor: '۴', status: 'occupied', residentName: 'سارا محمدی', residentUserId: ids.resident },
    { id: ids.unit2, buildingId: ids.building, number: '۴۰۲', floor: '۴', status: 'occupied', residentName: 'علی رضایی', residentUserId: ids.manager },
    { id: ids.unit3, buildingId: ids.building, number: '۴۰۳', floor: '۴', status: 'vacant' },
    { id: ids.unit4, buildingId: ids.building, number: '۴۰۴', floor: '۴', status: 'maintenance' },
  ])

  await db.insert(buildingMembers).values([
    { id: ids.memberManager, buildingId: ids.building, userId: ids.manager, role: 'manager', unitId: ids.unit2, invitedBy: null },
    { id: ids.memberResident, buildingId: ids.building, userId: ids.resident, role: 'resident', unitId: ids.unit1, invitedBy: ids.manager },
  ])

  const annCreated = [daysAgo(2), daysAgo(5)]
  await db.insert(announcements).values([
    { id: ids.ann1, buildingId: ids.building, title: 'تعمیر آسانسور', description: 'تعمیر آسانسور طبقه ۵ در ساعت ۱۰ صبح انجام می‌شود.', importance: 'important', createdBy: ids.manager, createdAt: annCreated[0] },
    { id: ids.ann2, buildingId: ids.building, title: 'اجتماع ساکنان', description: 'اجتماع هفتگی در سالن اجتماعات در ساعت ۱۸.', importance: 'normal', createdBy: ids.manager, createdAt: annCreated[1] },
  ])

  await db.insert(problemReports).values([
    { id: ids.problem1, buildingId: ids.building, category: 'elevator', title: 'آسانسور طبقه ۴ کار نمی‌کند', description: 'دکمه آسانسور در طبقه ۴ پاسخ نمی‌دهد.', status: 'in-progress', createdBy: ids.resident, createdAt: new Date(Date.now() - 3600000), updatedAt: new Date(Date.now() - 1800000) },
    { id: ids.problem2, buildingId: ids.building, category: 'water', title: 'نشت آب در پارکینگ', description: 'نشت آب درون پارکینگ طبقه همکف مشاهده شد.', status: 'new', createdBy: ids.resident, createdAt: new Date(Date.now() - 7200000) },
  ])

  await db.insert(charges).values([
    { id: ids.charge1, buildingId: ids.building, title: 'شارژ ماهانه اردیبهشت', amount: 1250000, period: 'اردیبهشت ۱۴۰۵', dueDate: '۱۴۰۵/۰۳/۰۵', description: 'شارژ ماهانه شامل نگهداری و نظافت', status: 'paid', paidAt: '۱۴۰۵/۰۳/۰۳', paidBy: ids.manager, createdBy: ids.manager, createdAt: daysAgo(3) },
    { id: ids.charge2, buildingId: ids.building, title: 'شارژ ماهانه خرداد', amount: 1250000, period: 'خرداد ۱۴۰۵', dueDate: '۱۴۰۵/۰۴/۰۵', description: 'شارژ ماهانه', status: 'unpaid', createdBy: ids.manager, createdAt: daysAgo(1) },
  ])

  await db.insert(expenses).values([
    { id: ids.expense1, buildingId: ids.building, title: 'هزینه برق پارکینگ', amount: 450000, category: 'electricity', date: '۱۴۰۵/۰۳/۰۲', description: 'صورت‌حساب برق پارکینگ', createdBy: ids.manager, createdAt: daysAgo(2) },
    { id: ids.expense2, buildingId: ids.building, title: 'تعمیر آسانسور', amount: 890000, category: 'repair', date: '۱۴۰۵/۰۳/۰۱', description: 'تعمیر آسیسور طبقه ۴', createdBy: ids.manager, createdAt: daysAgo(4) },
  ])

  await db.insert(serviceProviders).values([
    { name: 'آبیاری نوین', category: 'plumbing', description: 'لوله‌کشی و تعمیرات آب ساختمان با تجربه ۱۵ ساله.', rating: '4.8', phone: '۰۲۱-۸۸۷۷۶۶۵۵', area: 'تهران شمال', workingHours: '۸ تا ۲۰', trusted: true, createdBy: ids.manager },
    { name: 'برق پارس', category: 'electricity', description: 'برق‌کاری، نصب تابلو، تعمیر روشنایی.', rating: '4.5', phone: '۰۲۱-۸۸۱۱۲۲۳۳', area: 'تهران مرکز', workingHours: '۹ تا ۱۸', trusted: false, createdBy: ids.manager },
    { name: 'آسانسور دوست', category: 'elevator', description: 'نصب، تعمیر و سرویس آسانسور.', rating: '4.2', phone: '۰۲۱-۸۸۹۹۰۰۱۱', area: 'تهران غرب', workingHours: '۸ تا ۱۷', trusted: true, createdBy: ids.manager },
    { name: 'نظافت پاک', category: 'cleaning', description: 'نظافت ساختمان، پارکینگ و سالن اجتماعات.', rating: '4.9', phone: '۰۲۱-۸۸۷۶۵۴۳۲', area: 'تهران شرق', workingHours: '۶ تا ۲۲', trusted: true, createdBy: ids.manager },
    { name: 'نقاشی سبک', category: 'painting', description: 'نقاشی داخلی و خارجی با مواد باکیفیت.', rating: '4.3', phone: '۰۲۱-۸۸۲۲۳۳۴۴', area: 'تهران شمال', workingHours: '۸ تا ۱۷', trusted: false, createdBy: ids.manager },
    { name: 'سردخانه کوشی', category: 'ac', description: 'نصب و سرویس کولر گازی و اسپلیت.', rating: '4.7', phone: '۰۲۱-۸۸۳۳۴۴۵۵', area: 'تهران مرکز', workingHours: '۸ تا ۲۰', trusted: true, createdBy: ids.manager },
    { name: 'موتورخانه فنی', category: 'boiler', description: 'پکیج، موتورخانه و سیستم گرمایش.', rating: '4.6', phone: '۰۲۱-۸۸۴۴۵۵۶۶', area: 'تهران شمال', workingHours: '۸ تا ۱۸', trusted: false, createdBy: ids.manager },
    { name: 'شیشه‌ساز حرفه‌ای', category: 'glass', description: 'شیشه‌کاری ساختمان، نمای شیشه‌ای.', rating: '4.4', phone: '۰۲۱-۸۸۵۵۶۶۷۷', area: 'تهران غرب', workingHours: '۹ تا ۱۷', trusted: true, createdBy: ids.manager },
    { name: 'کلیدساز امن', category: 'lock', description: 'تعمیر و تعویض قفل درب و کلید ساختمان.', rating: '4.1', phone: '۰۲۱-۸۸۶۶۷۷۸۸', area: 'تهران شرق', workingHours: '۲۴ ساعته', trusted: false, createdBy: ids.manager },
    { name: 'تأسیسات مرکزی', category: 'installations', description: 'تأسیسات ساختمان، لوله‌کشی گاز و آب.', rating: '4.5', phone: '۰۲۱-۸۸۷۷۸۸۹۹', area: 'تهران مرکز', workingHours: '۸ تا ۲۰', trusted: true, createdBy: ids.manager },
  ])

  const memberIds = [ids.manager, ids.resident]
  const notificationRows = [
    ...memberIds.flatMap((userId) => ([
      { userId, type: 'announcement' as const, title: 'تعمیر آسانسور', message: 'تعمیر آسانسور طبقه ۵ در ساعت ۱۰ صبح انجام می‌شود.', link: `/announcements?id=${ids.ann1}`, sourceId: ids.ann1, createdAt: annCreated[0] },
      { userId, type: 'announcement' as const, title: 'اجتماع ساکنان', message: 'اجتماع هفتگی در سالن اجتماعات در ساعت ۱۸.', link: `/announcements?id=${ids.ann2}`, sourceId: ids.ann2, createdAt: annCreated[1] },
      { userId, type: 'problem' as const, title: 'گزارش مشکل جدید', message: 'نشت آب در پارکینگ', link: `/problems?id=${ids.problem2}`, sourceId: ids.problem2 },
      { userId, type: 'charge' as const, title: 'شارژ جدید', message: 'شارژ ماهانه خرداد — خرداد ۱۴۰۵', link: '/charges', sourceId: ids.charge2 },
    ])),
  ]
  await db.insert(notifications).values(notificationRows)
  console.log('Seed completed')
  await closeDb()
}

main().catch(async (error) => {
  console.error(error)
  await closeDb()
  process.exit(1)
})
