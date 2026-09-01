import type { ServiceProvider } from '../types'

export const useProviders = () => {
  const providers = useState<ServiceProvider[]>('hs-providers', () => {
    if (typeof window === 'undefined') return []
    try { const r = localStorage.getItem('hs-providers'); return r ? JSON.parse(r) : [] } catch { return [] }
  })

  const save = () => { if (typeof window !== 'undefined') localStorage.setItem('hs-providers', JSON.stringify(providers.value)) }

  const getById = (id: string) => providers.value.find(p => p.id === id) || null

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

  const search = (q: string, category?: string) => {
    const term = q.trim().toLowerCase()
    return providers.value.filter(p => {
      const matchText = (p.name + ' ' + p.description + ' ' + p.area).toLowerCase()
      const matchCat = category ? p.category === category : true
      return matchCat && (term === '' || matchText.includes(term))
    })
  }

  const toggleTrusted = (id: string) => {
    const p = providers.value.find(x => x.id === id)
    if (p) { p.trusted = !p.trusted; save() }
  }

  // Seed mock providers
  if (providers.value.length === 0 && typeof window !== 'undefined') {
    providers.value = [
      { id: 'sp-1', name: 'آبیاری نوین', category: 'plumbing', description: 'لوله‌کشی و تعمیرات آب ساختمان با تجربه ۱۵ ساله.', rating: 4.8, phone: '۰۲۱-۸۸۷۷۶۶۵۵', area: 'تهران شمال', workingHours: '۸ تا ۲۰', imageUrl: '', trusted: true, createdAt: new Date().toISOString() },
      { id: 'sp-2', name: 'برق پارس', category: 'electricity', description: 'برق‌کاری، نصب تابلو، تعمیر روشنایی.', rating: 4.5, phone: '۰۲۱-۸۸۱۱۲۲۳۳', area: 'تهران مرکز', workingHours: '۹ تا ۱۸', imageUrl: '', trusted: false, createdAt: new Date().toISOString() },
      { id: 'sp-3', name: 'آسانسور دوست', category: 'elevator', description: 'نصب، تعمیر و سرویس آسانسور.', rating: 4.2, phone: '۰۲۱-۸۸۹۹۰۰۱۱', area: 'تهران غرب', workingHours: '۸ تا ۱۷', imageUrl: '', trusted: true, createdAt: new Date().toISOString() },
      { id: 'sp-4', name: 'نظافت پاک', category: 'cleaning', description: 'نظافت ساختمان، پارکینگ و سالن اجتماعات.', rating: 4.9, phone: '۰۲۱-۸۸۷۶۵۴۳۲', area: 'تهران شرق', workingHours: '۶ تا ۲۲', imageUrl: '', trusted: true, createdAt: new Date().toISOString() },
      { id: 'sp-5', name: 'نقاشی سبک', category: 'painting', description: 'نقاشی داخلی و خارجی با مواد باکیفیت.', rating: 4.3, phone: '۰۲۱-۸۸۲۲۳۳۴۴', area: 'تهران شمال', workingHours: '۸ تا ۱۷', imageUrl: '', trusted: false, createdAt: new Date().toISOString() },
      { id: 'sp-6', name: 'سردخانه کوشی', category: 'ac', description: 'نصب و سرویس کولر گازی و اسپلیت.', rating: 4.7, phone: '۰۲۱-۸۸۳۳۴۴۵۵', area: 'تهران مرکز', workingHours: '۸ تا ۲۰', imageUrl: '', trusted: true, createdAt: new Date().toISOString() },
      { id: 'sp-7', name: 'موتورخانه فنی', category: 'boiler', description: 'پکیج، موتورخانه و سیستم گرمایش.', rating: 4.6, phone: '۰۲۱-۸۸۴۴۵۵۶۶', area: 'تهران شمال', workingHours: '۸ تا ۱۸', imageUrl: '', trusted: false, createdAt: new Date().toISOString() },
      { id: 'sp-8', name: 'شیشه‌ساز حرفه‌ای', category: 'glass', description: 'شیشه‌کاری ساختمان، نمای شیشه‌ای.', rating: 4.4, phone: '۰۲۱-۸۸۵۵۶۶۷۷', area: 'تهران غرب', workingHours: '۹ تا ۱۷', imageUrl: '', trusted: true, createdAt: new Date().toISOString() },
      { id: 'sp-9', name: 'کلیدساز امن', category: 'lock', description: 'تعمیر و تعویض قفل درب و کلید ساختمان.', rating: 4.1, phone: '۰۲۱-۸۸۶۶۷۷۸۸', area: 'تهران شرق', workingHours: '۲۴ ساعته', imageUrl: '', trusted: false, createdAt: new Date().toISOString() },
      { id: 'sp-10', name: 'تأسیسات مرکزی', category: 'installations', description: 'تأسیسات ساختمان، لوله‌کشی گاز و آب.', rating: 4.5, phone: '۰۲۱-۸۸۷۷۸۸۹۹', area: 'تهران مرکز', workingHours: '۸ تا ۲۰', imageUrl: '', trusted: true, createdAt: new Date().toISOString() },
    ]
    save()
  }

  return { providers, categories, search, getById, toggleTrusted, save }
}
