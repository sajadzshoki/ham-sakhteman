import type { ServiceProvider } from '../types'
import { apiErrorMessage, apiFetch } from '../utils/api'

export const useProviders = () => {
  const providers = useState<ServiceProvider[]>('hs-providers', () => [])
  const loading = useState('hs-providers-loading', () => false)
  const loadError = useState<string | null>('hs-providers-error', () => null)

  const categories = [
    { value: 'plumbing', label: 'لوله‌کشی' },
    { value: 'electricity', label: 'برق‌کاری' },
    { value: 'elevator', label: 'آسانسور' },
    { value: 'cleaning', label: 'نظافت' },
    { value: 'painting', label: 'نقاشی' },
    { value: 'ac', label: 'کولر' },
    { value: 'boiler', label: 'پکیج و موتورخانه' },
    { value: 'installations', label: 'تأسیسات' },
    { value: 'glass', label: 'شیشه‌کاری' },
    { value: 'lock', label: 'کلیدسازی' },
    { value: 'other', label: 'سایر' },
  ]

  const refresh = async () => {
    loading.value = true
    loadError.value = null
    try {
      providers.value = await apiFetch<ServiceProvider[]>('/api/providers')
    } catch (error) {
      loadError.value = apiErrorMessage(error, 'بارگذاری خدمات ناموفق بود')
      providers.value = []
    } finally {
      loading.value = false
    }
  }

  const getById = (id: string) => providers.value.find((item) => item.id === id) || null

  const search = (query: string, category?: string) => {
    const term = query.trim().toLowerCase()
    return providers.value.filter((provider) => {
      const matchText = `${provider.name} ${provider.description} ${provider.area}`.toLowerCase()
      const matchCategory = category ? provider.category === category : true
      return matchCategory && (term === '' || matchText.includes(term))
    })
  }

  const toggleTrusted = async (id: string) => {
    const current = providers.value.find((item) => item.id === id)
    if (!current) return
    const updated = await apiFetch<ServiceProvider>(`/api/providers/${id}`, {
      method: 'PATCH',
      body: { trusted: !current.trusted },
    })
    providers.value = providers.value.map((item) => item.id === id ? updated : item)
  }

  return { providers, categories, search, getById, toggleTrusted, refresh, save: refresh, loading, loadError }
}
