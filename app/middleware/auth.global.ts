/** مسیرهایی که سوپرادمین می‌تواند ببیند؛ بقیه به مدیریت کل برمی‌گردند */
function isSuperAdminPath(path: string): boolean {
  return path === '/admin'
    || path.startsWith('/admin/')
    || path === '/account'
    || path === '/settings'
    || path === '/notifications'
    || path.startsWith('/notifications/')
    || path === '/auth/login'
    || path === '/auth/register'
}

export default defineNuxtRouteMiddleware((to) => {
  const store = useAppStore()
  store.ensureSeeded()

  const { user, pendingJoinCode } = useAuth()

  // صفحات ورود برای کاربر لاگین‌شده در دسترس نیست
  if ((to.path === '/auth/login' || to.path === '/auth/register') && user.value) {
    return navigateTo(user.value.role === 'superadmin' ? '/admin' : '/')
  }

  // سوپرادمین به ساختمان نمی‌پیوندد و مسیرهای ساختمان‌محور را نمی‌بیند
  if (user.value?.role === 'superadmin' && !isSuperAdminPath(to.path)) {
    return navigateTo('/admin')
  }

  // آنبردینگ: فقط مدیرِ بدون ساختمان
  if (to.path === '/onboarding') {
    if (!user.value) return navigateTo('/auth/login')
    if (!store.isBuildingManager(user.value)) return navigateTo('/')
    if (store.buildingOfUser(user.value) && to.query.force === undefined) {
      return navigateTo('/building')
    }
  }

  // پیوستن بدون ورود: کد را ذخیره کن و به صفحه ورود بفرست
  if (to.path === '/join' && !user.value) {
    const code = typeof to.query.code === 'string' ? to.query.code : undefined
    if (code) pendingJoinCode.value = code.toUpperCase()
    return navigateTo('/auth/login')
  }

  // اطلاعیه‌ها و گزارش مشکلات: نیازمند ورود و عضویت در ساختمان
  if (to.path === '/announcements' || to.path.startsWith('/announcements/')
    || to.path === '/problems' || to.path.startsWith('/problems/')) {
    if (!user.value) return navigateTo('/auth/login')
    if (!store.buildingOfUser(user.value)) return navigateTo('/building')
    // ایجاد و ویرایش اطلاعیه فقط برای مدیر
    const isAnnouncementWrite = to.path === '/announcements/new' || /^\/announcements\/[^/]+\/edit$/.test(to.path)
    if (isAnnouncementWrite && !store.isBuildingManager(user.value)) return navigateTo('/announcements')
  }

  // شارژ، هزینه‌ها و شفافیت مالی: نیازمند ورود و عضویت در ساختمان
  if (to.path === '/charges' || to.path.startsWith('/charges/')
    || to.path === '/expenses' || to.path.startsWith('/expenses/')
    || to.path === '/finances' || to.path.startsWith('/finances/')) {
    if (!user.value) return navigateTo('/auth/login')
    if (!store.buildingOfUser(user.value)) return navigateTo('/building')
    // ایجاد شارژ و هزینه فقط برای مدیر
    const isFinanceWrite = to.path === '/charges/new' || to.path === '/expenses/new'
    if (isFinanceWrite && !store.isBuildingManager(user.value)) {
      return navigateTo(to.path.startsWith('/charges') ? '/charges' : '/expenses')
    }
  }

  // مرکز اعلان‌ها: نیازمند ورود
  if (to.path === '/notifications' || to.path.startsWith('/notifications/')) {
    if (!user.value) return navigateTo('/auth/login')
  }

  // مدیریت کل پلتفرم: فقط سوپرادمین
  if (to.path === '/admin' || to.path.startsWith('/admin/')) {
    if (!user.value) return navigateTo('/auth/login')
    if (user.value.role !== 'superadmin') return navigateTo('/')
  }

  // خدمات ساختمان (دایره ارائه‌دهندگان): نیازمند ورود و عضویت در ساختمان
  if (to.path === '/services' || to.path.startsWith('/services/')) {
    if (!user.value) return navigateTo('/auth/login')
    if (!store.buildingOfUser(user.value)) return navigateTo('/building')
  }

  // صفحات داخلی ساختمان
  if (to.path.startsWith('/building/') && to.path !== '/building') {
    if (!user.value) return navigateTo('/auth/login')
    if (!store.buildingOfUser(user.value)) return navigateTo('/building')
    if (to.path === '/building/invite' && !store.isBuildingManager(user.value)) {
      return navigateTo('/building')
    }
  }
})
