export function apiErrorMessage(error: unknown, fallback = 'خطایی رخ داد') {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = (error as { data?: { error?: { message?: string } } }).data
    if (data?.error?.message) return data.error.message
  }
  if (error instanceof Error && /fetch|network/i.test(error.message)) {
    return 'ارتباط با سرور برقرار نشد'
  }
  return fallback
}

function isUnauthorized(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const status = (error as { statusCode?: number, status?: number }).statusCode
    ?? (error as { statusCode?: number, status?: number }).status
  const code = (error as { data?: { error?: { code?: string } } }).data?.error?.code
  return status === 401 || code === 'UNAUTHORIZED'
}

export async function apiFetch<T>(url: string, options?: Parameters<typeof $fetch>[1]) {
  try {
    const response = await $fetch<{ success: boolean, data: T }>(url, options)
    return response.data
  } catch (error) {
    if (isUnauthorized(error) && !String(url).includes('/api/auth/')) {
      const auth = useAuth()
      if (auth.isAuthenticated) {
        auth.setUser(null)
        const { useAppData } = await import('../composables/useAppData')
        useAppData().clearDomain()
      }
    }
    throw error
  }
}
