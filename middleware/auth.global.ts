const PUBLIC_PREFIXES = ['/login', '/register', '/services', '/service-provider']

function stripLocale(path: string) {
  return path.replace(/^\/en(?=\/|$)/, '') || '/'
}

function isPublicPath(path: string) {
  const normalized = stripLocale(path)
  return PUBLIC_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`))
}

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const auth = useAuth()
  await auth.ensure()

  const path = to.path
  const publicRoute = isPublicPath(path)

  if (!auth.isAuthenticated && !publicRoute) {
    const redirect = stripLocale(path) === '/' ? undefined : to.fullPath
    return navigateTo({
      path: '/login',
      query: redirect ? { redirect: String(redirect) } : undefined,
    })
  }

  if (auth.isAuthenticated && (stripLocale(path) === '/login' || stripLocale(path) === '/register')) {
    const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : '/buildings'
    return navigateTo(redirect)
  }
})
