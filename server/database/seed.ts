import { eq } from 'drizzle-orm'
import { loadEnvFile } from '../utils/env'
import { initials } from '../utils/text'
import { closeDb, getDb } from './client'
import { resetDatabase } from './reset'
import {
  announcements,
  buildingMembers,
  buildingTrustedProviders,
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
} from './schema'

loadEnvFile()

/** شناسه‌ی ثابت و معتبر UUID برای داده‌ی دمو */
const uid = (group: number, n: number) => `${String(group).padStart(8, '0')}-0000-4000-8000-${String(n).padStart(12, '0')}`

const ids = {
  superadmin: uid(1, 1),
  manager: uid(1, 2),
  resident: uid(1, 3),
  building: uid(2, 1),
}
const unitId = (n: number) => uid(3, n)
const memberId = (n: number) => uid(4, n)
const announcementId = (n: number) => uid(5, n)
const problemId = (n: number) => uid(6, n)
const chargeId = (n: number) => uid(7, n)
const paymentId = (n: number) => uid(8, n)
const expenseId = (n: number) => uid(9, n)
const providerId = (n: number) => uid(10, n)

function daysAgo(days: number, hour = 12, minute = 0) {
  const date = new Date(Date.now() - days * 86400000)
  date.setHours(hour, minute, 0, 0)
  return date
}

function daysAhead(days: number, hour = 12) {
  const date = new Date(Date.now() + days * 86400000)
  date.setHours(hour, 0, 0, 0)
  return date
}

const DEMO_CODE = 'K7X2M9'

const demoUsers = [
  { id: ids.superadmin, name: 'نگار توکلی', phone: '09120000000', role: 'superadmin' as const },
  { id: ids.manager, name: 'رضا احمدی', phone: '09121112233', role: 'manager' as const },
  { id: ids.resident, name: 'سارا محمدی', phone: '09123456789', role: 'resident' as const },
]

const unitRows = Array.from({ length: 12 }, (_, index) => ({
  id: unitId(index + 1),
  buildingId: ids.building,
  number: index + 1,
  floor: Math.ceil((index + 1) / 2),
}))

const memberRows = [
  { id: memberId(1), userId: ids.manager, name: 'رضا احمدی', phone: '09121112233', role: 'manager' as const, unitId: null, unitStatus: null, joined: 170 },
  { id: memberId(2), userId: null, name: 'حامد رضایی', phone: '09351112244', role: 'resident' as const, unitId: unitId(1), unitStatus: 'tenant' as const, joined: 150 },
  { id: memberId(3), userId: null, name: 'مریم کریمی', phone: null, role: 'resident' as const, unitId: unitId(3), unitStatus: 'owner' as const, joined: 150 },
  { id: memberId(4), userId: null, name: 'علی موسوی', phone: null, role: 'resident' as const, unitId: unitId(4), unitStatus: 'tenant' as const, joined: 120 },
  { id: memberId(5), userId: ids.resident, name: 'سارا محمدی', phone: '09123456789', role: 'resident' as const, unitId: unitId(5), unitStatus: 'owner' as const, joined: 170 },
  { id: memberId(6), userId: null, name: 'نادر شریفی', phone: null, role: 'resident' as const, unitId: unitId(6), unitStatus: 'owner' as const, joined: 80 },
  { id: memberId(7), userId: null, name: 'زهرا حسینی', phone: '09198887766', role: 'resident' as const, unitId: unitId(7), unitStatus: 'tenant' as const, joined: 55 },
]

const providerRows = [
  { n: 1, name: 'لوله‌کشی برادران رحیمی', category: 'plumbing' as const, description: 'رفع ترکیدگی و نشتی، تعویض شیرآلات و سرویس پمپ آب؛ اعزام فوری در موارد اضطراری.', rating: '4.8', phone: '09124453322', serviceArea: 'سعادت‌آباد، شهرک غرب و گیشا', workingHours: 'شنبه تا پنجشنبه، ۸ تا ۲۰', imageUrl: '/images/providers/plumbing.jpg' },
  { n: 2, name: 'برق‌کاری محمد کاظمی', category: 'electrical' as const, description: 'سیم‌کشی و رفع اتصالی، نصب چراغ و سنسور مشاعات و تابلو برق ساختمان.', rating: '4.6', phone: '09357789912', serviceArea: 'سعادت‌آباد و شهرک غرب', workingHours: 'شنبه تا پنجشنبه، ۹ تا ۱۹', imageUrl: null },
  { n: 3, name: 'آسانسور پارس‌گستر', category: 'elevator' as const, description: 'سرویس و نگهداری ماهانه آسانسور، تنظیم درب طبقات و بازدید اضطراری.', rating: '4.9', phone: '02188776655', serviceArea: 'کل مناطق تهران', workingHours: 'شبانه‌روزی', imageUrl: '/images/providers/elevator.jpg' },
  { n: 4, name: 'نظافت درخشان', category: 'cleaning' as const, description: 'نظافت دوره‌ای راهرو، لابی و پارکینگ با مواد استاندارد و تیم ثابت.', rating: '4.5', phone: '09121134455', serviceArea: 'غرب و شمال‌غرب تهران', workingHours: 'شنبه تا پنجشنبه، ۸ تا ۱۶', imageUrl: '/images/providers/cleaning.jpg' },
  { n: 5, name: 'رنگ‌کاری استاد کریم', category: 'painting' as const, description: 'رنگ‌آمیزی دیوار و سقف مشاعات، لکه‌گیری و تعمیرات جزئی گچ‌کاری.', rating: '4.7', phone: '09123367788', serviceArea: 'سعادت‌آباد و اطراف', workingHours: 'شنبه تا چهارشنبه، ۸ تا ۱۷', imageUrl: '/images/providers/painting.jpg' },
  { n: 6, name: 'کولر و پکیج ایران‌سرویس', category: 'cooler' as const, description: 'سرویس کولر آبی و گازی، شست‌وشوی کندانسور و تعمیر پکیج دیواری.', rating: '4.4', phone: '09361112299', serviceArea: 'غرب تهران', workingHours: 'شنبه تا پنجشنبه، ۹ تا ۲۰', imageUrl: '/images/providers/cooler.jpg' },
  { n: 7, name: 'شیشه‌بری شهریار', category: 'glazing' as const, description: 'برش و نصب شیشه پنجره، آینه و شیشه بالکن؛ اندازه‌گیری رایگان در محل.', rating: '4.3', phone: '09128899334', serviceArea: 'تهران', workingHours: 'شنبه تا پنجشنبه، ۱۰ تا ۱۸', imageUrl: null },
  { n: 8, name: 'کلیدسازی شبانه‌روزی ۲۴', category: 'locksmith' as const, description: 'بازکردن درب بدون خسارت، ساخت کلید و ریموت پارکینگ؛ خدمات اضطراری.', rating: '4.6', phone: '09120004422', serviceArea: 'سعادت‌آباد و شهرک غرب', workingHours: 'شبانه‌روزی', imageUrl: null },
  { n: 9, name: 'موتورخانه و پکیج دماگستر', category: 'heating' as const, description: 'سرویس موتورخانه مرکزی، رسوب‌زدایی پکیج و تنظیم مشعل پیش از زمستان.', rating: '4.5', phone: '09358882211', serviceArea: 'غرب و شمال‌غرب تهران', workingHours: 'شنبه تا پنجشنبه، ۸ تا ۱۸', imageUrl: null },
  { n: 10, name: 'تأسیسات و ایزوگام نوری', category: 'installations' as const, description: 'اجرای ایزوگام و عایق‌کاری پشت‌بام، تعمیرات کلی تأسیسات ساختمان.', rating: '4.2', phone: '09126654477', serviceArea: 'تهران', workingHours: 'شنبه تا پنجشنبه، ۸ تا ۱۷', imageUrl: null },
]

/** ارائه‌دهندگان «مورد اعتماد» ساختمان دمو */
const trustedProviderNumbers = [1, 3, 5]

async function main() {
  const db = getDb()
  if (process.env.SEED_RESET === '1') {
    await resetDatabase()
    console.log('Database reset')
  }
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.phone, demoUsers[1]!.phone)).limit(1)
  if (existing) {
    console.log('Seed already applied (set SEED_RESET=1 to start over)')
    await closeDb()
    return
  }

  await db.transaction(async (tx) => {
    await tx.insert(users).values(demoUsers.map((user) => ({ ...user, avatarInitials: initials(user.name) })))

    await tx.insert(buildings).values({
      id: ids.building,
      name: 'ساختمان آسمان',
      address: 'تهران، سعادت‌آباد، بلوار سرو غربی، پلاک ۱۲',
      description: 'ساختمان مسکونی ۶ طبقه با لابی، پارکینگ اختصاصی و سیستم اعلام حریق.',
      managerId: ids.manager,
      invitationCode: DEMO_CODE,
      createdAt: daysAgo(200),
    })
    await tx.insert(buildingUnits).values(unitRows)
    await tx.insert(buildingMembers).values(memberRows.map(({ joined, ...member }) => ({
      ...member,
      buildingId: ids.building,
      joinedAt: daysAgo(joined),
      invitedBy: member.role === 'manager' ? null : ids.manager,
    })))

    // کد دعوت فعال دمو برای تست جریان پیوستن: /join?code=K7X2M9
    await tx.insert(invitations).values({
      id: uid(11, 1),
      buildingId: ids.building,
      code: DEMO_CODE,
      role: 'resident',
      createdBy: ids.manager,
      createdAt: daysAgo(25),
      expiresAt: daysAhead(340),
    })

    await tx.insert(announcements).values([
      { id: announcementId(1), buildingId: ids.building, title: 'سرویس دوره‌ای آسانسور', body: 'آسانسور روز شنبه از ساعت ۹ تا ۱۲ برای سرویس دوره‌ای خاموش است. لطفاً از پله‌ها استفاده کنید.', importance: 'important' as const, createdBy: ids.manager, createdAt: daysAgo(1, 10, 30), updatedAt: daysAgo(1, 10, 30) },
      { id: announcementId(2), buildingId: ids.building, title: 'جلسه عمومی ماهانه ساکنین', body: 'جلسه عمومی ماه با موضوع بودجه تعمیرات زمستان، جمعه آینده ساعت ۱۸:۳۰ در لابی برگزار می‌شود. حضور همه ساکنین گرامی است.', importance: 'normal' as const, createdBy: ids.manager, createdAt: daysAgo(3, 17), updatedAt: daysAgo(3, 17) },
      { id: announcementId(3), buildingId: ids.building, title: 'نظافت فصلی مشاعات', body: 'برنامه نظافت فصلی راهروها و پارکینگ از هفته آینده آغاز می‌شود. در صورت نیاز به جابه‌جایی وسایل پارکینگ، با سرایداری هماهنگ کنید.', importance: 'normal' as const, createdBy: ids.manager, createdAt: daysAgo(5, 12), updatedAt: daysAgo(5, 12) },
    ])

    await tx.insert(problemReports).values([
      { id: problemId(1), buildingId: ids.building, category: 'water' as const, title: 'چکه شیر آب پارکینگ', description: 'شیر آب گوشه پارکینگ چکه می‌کند و کف پارکینگ خیس شده. لطفاً برای تعمیر اقدام شود.', status: 'in-progress' as const, createdBy: ids.resident, createdAt: daysAgo(2, 9, 15), updatedAt: daysAgo(1, 11) },
      { id: problemId(2), buildingId: ids.building, category: 'elevator' as const, title: 'صدای غیرعادی کابین آسانسور', description: 'کابین آسانسور هنگام حرکت بین طبقات ۳ و ۴ صدای سایش می‌دهد. نیاز به بازدید شرکت نگهداری دارد.', status: 'new' as const, createdBy: ids.resident, createdAt: daysAgo(1, 16, 45), updatedAt: daysAgo(1, 16, 45) },
      { id: problemId(3), buildingId: ids.building, category: 'cleaning' as const, title: 'نظافت راهرو طبقه ۵', description: 'راهرو طبقه ۵ نیاز به نظافت دارد؛ گرد و خاک روی نرده‌ها جمع شده است.', status: 'resolved' as const, createdBy: ids.resident, createdAt: daysAgo(9, 13), updatedAt: daysAgo(6, 10) },
      { id: problemId(4), buildingId: ids.building, category: 'electricity' as const, title: 'چراغ سنسوردار راهرو طبقه ۳', description: 'چراغ سنسوردار راهرو طبقه ۳ با حرکت روشن نمی‌شود و همیشه خاموش است.', status: 'new' as const, createdBy: ids.manager, createdAt: daysAgo(4, 8, 20), updatedAt: daysAgo(4, 8, 20) },
    ])

    await tx.insert(charges).values([
      { id: chargeId(1), buildingId: ids.building, title: 'شارژ ماهانه', period: 'شهریور ۱۴۰۵', amount: 850_000, dueAt: daysAhead(6), notes: 'شامل هزینه نظافت، برق مشاعات و نگهداری آسانسور.', createdBy: ids.manager, createdAt: daysAgo(4, 9) },
      { id: chargeId(2), buildingId: ids.building, title: 'شارژ ماهانه', period: 'مرداد ۱۴۰۵', amount: 850_000, dueAt: daysAgo(25), notes: null, createdBy: ids.manager, createdAt: daysAgo(35, 9) },
      { id: chargeId(3), buildingId: ids.building, title: 'سهم تعمیر ایزوگام پشت‌بام', period: 'تابستان ۱۴۰۵', amount: 1_200_000, dueAt: daysAgo(70), notes: 'هزینه کل تعمیر ۸٬۴۰۰٬۰۰۰ تومان بین ۷ واحد تقسیم شد.', createdBy: ids.manager, createdAt: daysAgo(80, 10) },
    ])

    const memberName = (n: number) => memberRows[n - 1]!.name
    const payment = (n: number, charge: number, member: number, amount: number, paidAt: Date, note: string | null = null) => ({
      id: paymentId(n),
      chargeId: chargeId(charge),
      memberId: memberId(member),
      memberName: memberName(member),
      amount,
      paidAt,
      note,
      method: 'manual' as const,
      recordedBy: ids.manager,
    })
    await tx.insert(chargePayments).values([
      // شارژ مرداد — سه عضو پرداخت کرده‌اند، بقیه معوق
      payment(1, 2, 5, 850_000, daysAgo(28, 18, 30), 'کارت به کارت'),
      payment(2, 2, 1, 850_000, daysAgo(27, 11)),
      payment(3, 2, 3, 850_000, daysAgo(20, 16, 45), 'پرداخت نقدی'),
      // سهم ایزوگام — ۵ عضو پرداخت کرده‌اند
      payment(4, 3, 1, 1_200_000, daysAgo(75, 10)),
      payment(5, 3, 3, 1_200_000, daysAgo(74, 12)),
      payment(6, 3, 5, 1_200_000, daysAgo(73, 9, 30)),
      payment(7, 3, 6, 1_200_000, daysAgo(72, 14)),
      payment(8, 3, 7, 1_200_000, daysAgo(71, 17, 15)),
    ])

    await tx.insert(expenses).values([
      { id: expenseId(1), buildingId: ids.building, title: 'قبض آب مشاعات', amount: 480_000, category: 'water' as const, date: daysAgo(3, 9).toISOString(), notes: 'دوره سه‌ماهه بهار', createdBy: ids.manager, createdAt: daysAgo(3, 10) },
      { id: expenseId(2), buildingId: ids.building, title: 'نظافت ماهانه مشاعات', amount: 1_200_000, category: 'cleaning' as const, date: daysAgo(5, 9).toISOString(), notes: 'قرارداد ماهانه با شرکت نظافتی', createdBy: ids.manager, createdAt: daysAgo(5, 11) },
      { id: expenseId(3), buildingId: ids.building, title: 'سرویس دوره‌ای آسانسور', amount: 2_500_000, category: 'elevator' as const, date: daysAgo(15, 9).toISOString(), notes: 'قرارداد نگهداری ماهانه با شرکت تعمیرکار', createdBy: ids.manager, createdAt: daysAgo(15, 12) },
      { id: expenseId(4), buildingId: ids.building, title: 'خرید لامپ و سنسور راهرو', amount: 320_000, category: 'electricity' as const, date: daysAgo(8, 16).toISOString(), notes: null, createdBy: ids.manager, createdAt: daysAgo(8, 17) },
    ])

    await tx.insert(serviceProviders).values(providerRows.map(({ n, ...provider }) => ({ id: providerId(n), ...provider })))
    await tx.insert(buildingTrustedProviders).values(trustedProviderNumbers.map((n) => ({ buildingId: ids.building, providerId: providerId(n) })))

    await tx.insert(notifications).values([
      { id: uid(12, 1), userId: ids.resident, type: 'announcement-important' as const, title: 'اطلاعیه مهم: «سرویس دوره‌ای آسانسور»', body: 'آسانسور روز شنبه از ساعت ۹ تا ۱۲ برای سرویس دوره‌ای خاموش است.', link: `/announcements/${announcementId(1)}`, sourceId: announcementId(1), createdAt: daysAgo(1, 10, 30) },
      { id: uid(12, 2), userId: ids.resident, type: 'charge-new' as const, title: 'شارژ جدید: «شارژ ماهانه»', body: 'شارژ ماهانه — شهریور ۱۴۰۵', link: `/charges/${chargeId(1)}`, sourceId: chargeId(1), createdAt: daysAgo(4, 9) },
      { id: uid(12, 3), userId: ids.manager, type: 'problem-new' as const, title: 'گزارش مشکل جدید: «صدای غیرعادی کابین آسانسور»', body: 'کابین آسانسور هنگام حرکت بین طبقات ۳ و ۴ صدای سایش می‌دهد.', link: `/problems/${problemId(2)}`, sourceId: problemId(2), createdAt: daysAgo(1, 16, 45) },
    ])
  })

  console.log('Seed completed')
  console.log('  manager    09121112233')
  console.log('  resident   09123456789')
  console.log('  superadmin 09120000000')
  console.log('  OTP (dev, no KAVENEGAR_API_KEY): 1111')
  await closeDb()
}

main().catch(async (error) => {
  console.error(error)
  await closeDb()
  process.exit(1)
})
