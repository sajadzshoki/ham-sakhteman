import type { AuthMethod, AuthUser, BuildingRole } from '~/types'

/**
 * احراز هویت نمایشی مبتنی بر کوکی (خوانا در SSR برای هم‌خوانی رندر).
 * معماری برای ورود با رمز عبور و کد یک‌بارمصرف (OTP) آماده است؛
 * در حال حاضر فقط مسیر رمز عبور فعال است.
 */
export function useAuth() {
  const refs = useStoreRefs()
  const store = useAppStore()
  const session = refs.user
  const users = refs.users
  const pendingJoinCode = refs.pendingJoin

  const user = computed(() => session.value)
  const isAuthenticated = computed(() => session.value !== null)
  const isManager = computed(() => store.isBuildingManager(session.value))
  const isSuperAdmin = computed(() => session.value?.role === 'superadmin')

  function login(phone: string, password: string): { ok: boolean; error?: 'invalid' } {
    const normalizedPhone = normalizePhone(phone)
    if (!password) return { ok: false, error: 'invalid' }
    const found = users.value.find(
      item => normalizePhone(item.phone) === normalizedPhone && (item.password ?? '') === password,
    )
    if (!found) return { ok: false, error: 'invalid' }
    session.value = found
    return { ok: true }
  }

  function register(input: {
    name: string
    phone: string
    password: string
    role: BuildingRole
  }): { ok: boolean; error?: 'duplicate' } {
    const phone = normalizePhone(input.phone)
    if (users.value.some(item => normalizePhone(item.phone) === phone)) {
      return { ok: false, error: 'duplicate' }
    }
    const newUser: AuthUser = {
      id: createId('user'),
      name: input.name.trim(),
      phone,
      role: input.role,
      password: input.password,
      createdAt: new Date().toISOString(),
    }
    users.value = [...users.value, newUser]
    session.value = newUser
    return { ok: true }
  }

  function logout() {
    session.value = null
  }

  /**
   * مقصد پس از ورود/ثبت‌نام:
   * ۱) اگر کد دعوت در انتظار باشد → صفحه پیوستن
   * ۲) مدیر بدون ساختمان → آنبردینگ ساخت ساختمان
   * ۳) ساکن بدون ساختمان → صفحه پیوستن با کد دعوت
   */
  function redirectAfterAuth(): string {
    if (session.value?.role === 'superadmin') return '/admin'
    if (pendingJoinCode.value) {
      const target = `/join?code=${encodeURIComponent(pendingJoinCode.value)}`
      pendingJoinCode.value = null
      return target
    }
    const store = useAppStore()
    const building = store.buildingOfUser(session.value)
    if (!building) {
      return store.isBuildingManager(session.value) ? '/onboarding' : '/join'
    }
    return '/'
  }

  return {
    user,
    isAuthenticated,
    isManager,
    isSuperAdmin,
    login,
    register,
    logout,
    redirectAfterAuth,
    pendingJoinCode,
  }
}

/** روش‌های ورود پشتیبانی‌شده در معماری احراز هویت */
export const AUTH_METHODS: { id: AuthMethod; label: string; enabled: boolean }[] = [
  { id: 'password', label: 'رمز عبور', enabled: true },
  { id: 'otp', label: 'کد یک‌بارمصرف', enabled: false },
]
