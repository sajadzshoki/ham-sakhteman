export const useNotifications = () => {
  const auth = useAuth()
  const { getBuilding } = useBuildings()
  const { getByBuilding: getAnn } = useAnnouncements()
  const { getByBuilding: getProb } = useProblems()
  const { getByBuilding: getCharg } = useFinance()

  const notifications = useState<any[]>('hs-notifications', () => {
    if (typeof window === 'undefined') return []
    try { const r = localStorage.getItem('hs-notifications'); return r ? JSON.parse(r) : [] } catch { return [] }
  })

  const save = () => { if (typeof window !== 'undefined') localStorage.setItem('hs-notifications', JSON.stringify(notifications.value)) }

  const refresh = () => {
    const bId = 'b-1' // default building for demo
    const result: any[] = []
    // Announcement
    getAnn(bId).slice(0, 2).forEach(a => result.push({ id: 'n-ann-' + a.id, title: a.title, message: a.description, time: a.createdAt ? a.createdAt.slice(0, 10) : '', unread: true, link: '/announcements?id=' + a.id, type: 'announcement' as const }))
    // Problem new
    getProb(bId).filter(p => p.status === 'new').slice(0, 2).forEach(p => result.push({ id: 'n-pr-' + p.id, title: 'گزارش مشکل جدید', message: p.title, time: p.createdAt ? p.createdAt.slice(0, 10) : '', unread: true, link: '/problems?id=' + p.id, type: 'problem' as const }))
    // Charge
    getCharg(bId).filter(c => c.status === 'unpaid').slice(0, 1).forEach(c => result.push({ id: 'n-ch-' + c.id, title: 'شارژ جدید', message: c.title + ' — ' + c.period, time: c.createdAt ? c.createdAt.slice(0, 10) : '', unread: true, link: '/charges', type: 'charge' as const }))
    notifications.value = result
    save()
  }

  const markRead = (id: string) => {
    const n = notifications.value.find(x => x.id === id)
    if (n) { n.unread = false; save() }
  }

  const markAllRead = () => {
    notifications.value.forEach(n => n.unread = false)
    save()
  }

  if (notifications.value.length === 0 && typeof window !== 'undefined') refresh()

  return { notifications, refresh, markRead, markAllRead, save }
}
