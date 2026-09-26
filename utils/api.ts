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

export async function apiFetch<T>(url: string, options?: Parameters<typeof $fetch>[1]) {
  const response = await $fetch<{ success: boolean, data: T }>(url, options)
  return response.data
}
