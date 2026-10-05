import type { NavItem } from '~/types'

/** آیتم‌های ناوبری اصلی اپ (موبایل و دسکتاپ) */
export function useAppNavigation() {
  const { isSuperAdmin } = useAuth()

  return computed<NavItem[]>(() => {
    if (isSuperAdmin.value) {
      return [
        { labelKey: 'nav.home', to: '/admin', icon: 'i-lucide-shield-check' },
        { labelKey: 'nav.account', to: '/account', icon: 'i-lucide-circle-user-round' },
      ]
    }
    return [
      { labelKey: 'nav.home', to: '/', icon: 'i-lucide-home' },
      { labelKey: 'nav.building', to: '/building', icon: 'i-lucide-building-2' },
      { labelKey: 'nav.services', to: '/services', icon: 'i-lucide-concierge-bell' },
      { labelKey: 'nav.account', to: '/account', icon: 'i-lucide-circle-user-round' },
    ]
  })
}

/** فعال بودن آیتم ناوبری بر اساس مسیر فعلی */
export function isRouteActive(to: string, currentPath: string): boolean {
  if (to === '/') return currentPath === '/'
  return currentPath === to || currentPath.startsWith(`${to}/`)
}
