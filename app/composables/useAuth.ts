import type { AuthMethod, AuthUser, BuildingRole, OtpRequestResult } from '~/types'

/** کاربر وارد‌شده؛ بین SSR و کلاینت با payload نوکست منتقل می‌شود (نشست واقعی کوکی HttpOnly است) */
export function useAuthState() {
  return useState<AuthUser | null>('auth-user', () => null)
}

/**
 * احراز هویت با کد یک‌بارمصرف پیامکی (OTP):
 * `requestOtp` ← `verifyOtp` (کوکی `hs_session` را سرور می‌گذارد) ← `fetchMe` / `logout`.
 */
export function useAuth() {
  const session = useAuthState()
  /** آیا یک‌بار `/api/auth/me` پرسیده شده؟ (برای پرهیز از درخواست تکراری مهمان‌ها) */
  const checked = useState<boolean>('auth-checked', () => false)
  const request = useApi()
  const store = useAppStore()

  /** کد دعوتِ در انتظار پیوستن؛ فقط یک کوکی کوچک، نه استور دامنه */
  const pendingJoinCode = useCookie<string | null>('ham-pending-join', {
    maxAge: 60 * 60 * 24,
    sameSite: 'lax',
    default: () => null,
  })

  const user = computed(() => session.value)
  const isAuthenticated = computed(() => session.value !== null)
  const isManager = computed(() => store.isBuildingManager(session.value))
  const isSuperAdmin = computed(() => session.value?.role === 'superadmin')

  /** ارسال کد تأیید؛ در محیط توسعه (بدون کلید کاوه‌نگار) `devCode` برمی‌گردد */
  function requestOtp(phone: string, purpose: 'login' | 'register'): Promise<OtpRequestResult> {
    return request<OtpRequestResult>('/api/auth/otp/request', {
      method: 'POST',
      body: { phone, purpose },
    })
  }

  /** تأیید کد؛ برای ثبت‌نام `name` و `role` هم فرستاده می‌شود */
  async function verifyOtp(input: {
    phone: string
    code: string
    name?: string
    role?: BuildingRole
  }): Promise<AuthUser> {
    const result = await request<{ user: AuthUser }>('/api/auth/otp/verify', {
      method: 'POST',
      body: { ...input },
    })
    session.value = result.user
    checked.value = true
    store.reset()
    // ساختمان کاربر برای مقصد‌یابی پس از ورود لازم است
    await store.refresh().catch(() => undefined)
    return result.user
  }

  /** بازیابی کاربر از روی کوکی نشست؛ بدون نشست `null` */
  async function fetchMe(): Promise<AuthUser | null> {
    try {
      const result = await request<{ user: AuthUser }>('/api/auth/me')
      session.value = result.user
    }
    catch (error) {
      if (error instanceof ApiRequestError && error.status !== 401) {
        // خطای شبکه/سرور نباید مهمان‌بودن را قطعی کند؛ دوباره تلاش می‌شود
        throw error
      }
      session.value = null
    }
    checked.value = true
    return session.value
  }

  /** اگر هنوز کاربری در state نیست، یک‌بار از سرور می‌پرسد */
  async function ensureUser(): Promise<AuthUser | null> {
    if (session.value || checked.value) return session.value
    return fetchMe()
  }

  async function logout() {
    try {
      await request('/api/auth/logout', { method: 'POST' })
    }
    finally {
      session.value = null
      checked.value = true
      pendingJoinCode.value = null
      store.reset()
    }
  }

  /**
   * مقصد پس از ورود/ثبت‌نام:
   * ۱) سوپرادمین → مدیریت کل
   * ۲) کد دعوت در انتظار → صفحه پیوستن
   * ۳) مدیر بدون ساختمان → آنبردینگ؛ ساکن بدون ساختمان → پیوستن با کد
   */
  function redirectAfterAuth(): string {
    if (session.value?.role === 'superadmin') return '/admin'
    if (pendingJoinCode.value) {
      const target = `/join?code=${encodeURIComponent(pendingJoinCode.value)}`
      pendingJoinCode.value = null
      return target
    }
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
    requestOtp,
    verifyOtp,
    fetchMe,
    ensureUser,
    logout,
    redirectAfterAuth,
    pendingJoinCode,
  }
}

/** ورود فقط با OTP است؛ فهرست برای سازگاری با صفحات نگه داشته شده */
export const AUTH_METHODS: { id: AuthMethod, label: string, enabled: boolean }[] = [
  { id: 'otp', label: 'کد یک‌بارمصرف', enabled: true },
]
