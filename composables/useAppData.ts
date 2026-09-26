let bootPromise: Promise<void> | null = null

export function useAppData() {
  const auth = useAuth()
  const buildingsApi = useBuildings()
  const announcementsApi = useAnnouncements()
  const problemsApi = useProblems()
  const financeApi = useFinance()
  const providersApi = useProviders()
  const notificationsApi = useNotifications()

  async function run() {
    await auth.ensure()
    await Promise.all([
      buildingsApi.refresh(),
      providersApi.refresh(),
    ])
    await Promise.all([
      announcementsApi.refresh(),
      problemsApi.refresh(),
      financeApi.refresh(),
      notificationsApi.refresh(),
    ])
  }

  function boot() {
    if (!import.meta.client) return Promise.resolve()
    if (!bootPromise) bootPromise = run()
    return bootPromise
  }

  async function refreshAll() {
    bootPromise = run()
    await bootPromise
  }

  function clearDomain() {
    buildingsApi.clear()
    announcementsApi.clear()
    problemsApi.clear()
    financeApi.clear()
    notificationsApi.clear()
    bootPromise = null
  }

  return { boot, refreshAll, clearDomain }
}
