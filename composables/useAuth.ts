import type { User } from '../types'

export const useAuth = () => {
  const user = useState<User | null>('auth-user', () => {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem('hs-user')
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })

  const isAuthenticated = computed(() => !!user.value)
  const isManager = computed(() => user.value?.role === 'manager')
  const isResident = computed(() => user.value?.role === 'resident')

  const setUser = (data: User) => {
    user.value = data
    if (typeof window !== 'undefined') localStorage.setItem('hs-user', JSON.stringify(data))
  }

  const clearUser = () => {
    user.value = null
    if (typeof window !== 'undefined') localStorage.removeItem('hs-user')
  }

  const login = (email: string, password: string): Promise<{ ok: boolean; user?: User; message?: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock auth: resident if email contains 'resident', else manager
        const isMgr = !email.toLowerCase().includes('resident')
        const u: User = {
          id: 'u-' + Date.now(),
          name: isMgr ? 'مدیر ساختمان' : 'ساکن نمونه',
          email,
          role: isMgr ? 'manager' : 'resident',
          avatarInitials: isMgr ? 'م س' : 'س ن',
          createdAt: new Date().toISOString(),
        }
        setUser(u)
        resolve({ ok: true, user: u })
      }, 600)
    })
  }

  const register = (name: string, email: string, password: string): Promise<{ ok: boolean; user?: User; message?: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const u: User = {
          id: 'u-' + Date.now(),
          name,
          email,
          role: 'manager', // default to manager for new buildings
          avatarInitials: name.slice(0, 2),
          createdAt: new Date().toISOString(),
        }
        setUser(u)
        resolve({ ok: true, user: u })
      }, 600)
    })
  }

  const logout = () => {
    clearUser()
    navigateTo('/')
  }

  return { user, isAuthenticated, isManager, isResident, setUser, clearUser, login, register, logout }
}
