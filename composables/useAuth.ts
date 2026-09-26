import type { User } from '../types'
import { apiErrorMessage, apiFetch } from '../utils/api'

const legacyKeys = ['hs-user', 'hs-buildings', 'hs-announcements', 'hs-problems', 'hs-charges', 'hs-expenses', 'hs-providers', 'hs-notifications']

export const useAuth = () => {
  const user = useState<User | null>('auth-user', () => null)
  const ready = useState('auth-ready', () => false)

  const clearLegacy = () => {
    if (!import.meta.client) return
    for (const key of legacyKeys) localStorage.removeItem(key)
  }

  const setUser = (data: User | null) => {
    user.value = data
    clearLegacy()
  }

  let sessionPromise: Promise<void> | null = null

  const ensure = () => {
    if (!import.meta.client) return Promise.resolve()
    if (!sessionPromise) {
      sessionPromise = (async () => {
        clearLegacy()
        try {
          const data = await apiFetch<{ user: User }>('/api/auth/me')
          user.value = data.user
        } catch {
          user.value = null
        } finally {
          ready.value = true
        }
      })()
    }
    return sessionPromise
  }

  const login = async (email: string, password: string): Promise<{ ok: boolean, user?: User, message?: string }> => {
    try {
      const data = await apiFetch<{ user: User }>('/api/auth/login', { method: 'POST', body: { email, password } })
      setUser(data.user)
      sessionPromise = Promise.resolve()
      ready.value = true
      const { useAppData } = await import('./useAppData')
      await useAppData().refreshAll()
      return { ok: true, user: data.user }
    } catch (error) {
      return { ok: false, message: apiErrorMessage(error, 'ورود ناموفق بود') }
    }
  }

  const register = async (name: string, email: string, password: string): Promise<{ ok: boolean, user?: User, message?: string }> => {
    try {
      const data = await apiFetch<{ user: User }>('/api/auth/register', { method: 'POST', body: { name, email, password } })
      setUser(data.user)
      sessionPromise = Promise.resolve()
      ready.value = true
      const { useAppData } = await import('./useAppData')
      await useAppData().refreshAll()
      return { ok: true, user: data.user }
    } catch (error) {
      return { ok: false, message: apiErrorMessage(error, 'تأیید ثبت‌نام ناموفق') }
    }
  }

  const updateProfile = async (input: { name?: string, email?: string, phone?: string }) => {
    const data = await apiFetch<{ user: User }>('/api/me', { method: 'PATCH', body: input })
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    await $fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined)
    setUser(null)
    sessionPromise = Promise.resolve()
    ready.value = true
    const { useAppData } = await import('./useAppData')
    useAppData().clearDomain()
    await navigateTo('/')
  }

  return reactive({
    get user() { return user.value },
    set user(value: User | null) { user.value = value },
    get ready() { return ready.value },
    get isAuthenticated() { return !!user.value },
    get isManager() { return user.value?.role === 'manager' },
    get isResident() { return user.value?.role === 'resident' },
    ensure,
    setUser,
    login,
    register,
    updateProfile,
    logout,
  })
}
