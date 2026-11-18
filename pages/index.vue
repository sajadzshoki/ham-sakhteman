<script setup lang="ts">
const { t, locale } = useI18n()
const auth = useAuth()
const { buildings, primaryBuildingId, isBuildingManager } = useBuildings()
const { getByBuilding: getAnn } = useAnnouncements()
const { getByBuilding: getProb, categoryLabels, statusLabels } = useProblems()
const { charges, expenses } = useFinance()
const { notifications } = useNotifications()

const numberLocale = computed(() => (locale.value === 'fa' ? 'fa-IR' : 'en-US'))
const fmt = (n: number) => `${(n || 0).toLocaleString(numberLocale.value)} ${locale.value === 'fa' ? 'تومان' : 'IRR'}`

const currentBuildingId = computed(() => primaryBuildingId.value)
const currentBuilding = computed(() => buildings.value[0] || null)
const canManage = computed(() => isBuildingManager(currentBuildingId.value))

const chargeIncome = computed(() =>
  charges.value
    .filter((c) => c.buildingId === currentBuildingId.value && c.status === 'paid')
    .reduce((s, c) => s + c.amount, 0),
)
const expenseTotal = computed(() =>
  expenses.value
    .filter((e) => e.buildingId === currentBuildingId.value)
    .reduce((s, e) => s + e.amount, 0),
)
const balance = computed(() => chargeIncome.value - expenseTotal.value)
const paidCount = computed(() =>
  charges.value.filter((c) => c.buildingId === currentBuildingId.value && c.status === 'paid').length,
)

const announcements = computed(() =>
  currentBuilding.value ? getAnn(currentBuilding.value.id).slice(0, 3) : [],
)
const openProblems = computed(() =>
  currentBuilding.value
    ? getProb(currentBuilding.value.id).filter((p) => p.status !== 'resolved').slice(0, 3)
    : [],
)
const recentNotifications = computed(() => notifications.value.slice(0, 5))

const quickActions = computed(() => {
  const buildingQuery = currentBuildingId.value ? `?id=${currentBuildingId.value}` : ''
  const financeQuery = currentBuildingId.value ? `?buildingId=${currentBuildingId.value}` : ''
  return [
    { icon: 'i-lucide-building-2', label: t('home.buildings'), to: '/buildings', color: 'from-teal-450 to-primary-500' },
    { icon: 'i-lucide-bullhorn', label: t('home.announcements'), to: `/announcements${buildingQuery}`, color: 'from-amber-400 to-orange-500' },
    { icon: 'i-lucide-wrench', label: t('home.reportProblem'), to: '/problems/new', color: 'from-rose-400 to-rose-500' },
    { icon: 'i-lucide-wallet', label: t('home.charges'), to: `/charges${financeQuery}`, color: 'from-sky-400 to-blue-500' },
  ]
})
</script>

<template>
  <div>
    <section class="mb-6">
      <div class="rounded-3xl bg-gradient-to-br from-primary-600 to-teal-700 text-white p-6 shadow-soft-lg relative overflow-hidden">
        <div class="absolute top-0 left-0 w-48 h-48 bg-white/10 rounded-full -translate-x-1/3 -translate-y-1/2 blur-2xl pointer-events-none" />
        <div class="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full translate-x-1/4 translate-y-1/3 blur-2xl pointer-events-none" />
        <div class="relative z-10">
          <div class="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 text-xs font-bold mb-3">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            {{ t('home.activeStatus') }}
          </div>
          <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight mb-1">
            {{ t('home.greeting', { name: auth.user?.name || t('home.guestName') }) }}
          </h1>
          <p class="text-primary-100 text-sm md:text-base font-medium leading-relaxed">
            {{
              currentBuilding
                ? `${currentBuilding.name} — ${currentBuilding.address}`
                : t('home.selectBuilding')
            }}
          </p>
        </div>
      </div>
    </section>

    <section class="mb-8">
      <PageHeader :title="t('home.quickActions')" :subtitle="t('home.subtitle')" />
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <NuxtLink
          v-for="a in quickActions"
          :key="a.label"
          :to="a.to"
          class="group bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-soft hover:shadow-soft-lg transition-all duration-300 hover:-translate-y-0.5 border border-slate-100/80 dark:border-slate-800 flex flex-col items-center text-center gap-2.5"
        >
          <span
            class="w-12 h-12 rounded-2xl bg-gradient-to-br text-white flex items-center justify-center shadow-soft-lg shadow-inner-soft transition-transform group-hover:scale-110"
            :class="a.color"
          >
            <Icon :name="a.icon" class="w-6 h-6" />
          </span>
          <span class="text-sm font-extrabold text-slate-800 dark:text-slate-100 leading-snug">{{ a.label }}</span>
        </NuxtLink>
      </div>
    </section>

    <section v-if="announcements.length" class="mb-6">
      <PageHeader :title="t('home.latestAnnouncements')" :subtitle="t('home.announcementsSubtitle')" />
      <div class="flex flex-col gap-3">
        <NuxtLink
          v-for="a in announcements"
          :key="a.id"
          :to="`/announcements?id=${a.id}`"
          class="bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-soft border border-slate-100/80 dark:border-slate-800 hover:shadow-soft-lg transition-all"
        >
          <div class="flex items-center gap-2 mb-1">
            <StatusBadge
              :status="a.importance === 'important' ? 'warning' : 'success'"
              :label="a.importance === 'important' ? (locale === 'fa' ? 'مهم' : 'Important') : (locale === 'fa' ? 'عادی' : 'Normal')"
            />
            <span class="text-[10px] text-slate-300 font-medium">{{ a.createdAt ? a.createdAt.slice(0, 10) : '' }}</span>
          </div>
          <h4 class="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">{{ a.title }}</h4>
          <p class="text-xs text-slate-400 font-medium truncate">{{ a.description }}</p>
        </NuxtLink>
      </div>
    </section>

    <section v-if="openProblems.length" class="mb-6">
      <PageHeader :title="t('home.openProblems')" :subtitle="t('home.openProblemsSubtitle')" />
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <AppCard v-for="p in openProblems" :key="p.id" padding="md" hover>
          <NuxtLink :to="`/problems?id=${p.id}`" class="block">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 px-2 py-0.5 rounded-md border border-rose-100 dark:border-rose-900">
                {{ categoryLabels[p.category] || p.category }}
              </span>
              <StatusBadge
                :status="p.status === 'new' ? 'pending' : p.status === 'in-progress' ? 'in-progress' : 'completed'"
                :label="statusLabels[p.status] || p.status"
              />
            </div>
            <h4 class="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">{{ p.title }}</h4>
            <p class="text-xs text-slate-400 font-medium truncate">{{ p.description }}</p>
          </NuxtLink>
        </AppCard>
      </div>
    </section>

    <div v-if="currentBuilding" class="grid md:grid-cols-3 gap-5 mb-8">
      <AppCard class="md:col-span-2" padding="lg">
        <PageHeader :title="t('home.buildingStatus')" :subtitle="currentBuilding.name" />
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div class="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-100/60 dark:border-slate-700 text-center">
            <div class="text-2xl font-extrabold text-slate-900 dark:text-white">{{ currentBuilding.unitCount }}</div>
            <div class="text-xs text-slate-400 font-bold mt-0.5">{{ t('home.units') }}</div>
          </div>
          <div class="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-100/60 dark:border-slate-700 text-center">
            <div class="text-2xl font-extrabold text-primary-600">{{ currentBuilding.residentCount }}</div>
            <div class="text-xs text-slate-400 font-bold mt-0.5">{{ t('home.residents') }}</div>
          </div>
          <div class="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-100/60 dark:border-slate-700 text-center">
            <div class="text-2xl font-extrabold text-teal-600">{{ openProblems.length }}</div>
            <div class="text-xs text-slate-400 font-bold mt-0.5">{{ t('home.openProblems') }}</div>
          </div>
        </div>
        <div v-if="canManage" class="mt-4 flex flex-wrap gap-2">
          <NuxtLink :to="`/building?id=${currentBuilding.id}`" class="px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-extrabold">
            {{ t('building.title') }}
          </NuxtLink>
          <NuxtLink :to="`/expenses?buildingId=${currentBuilding.id}`" class="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-extrabold">
            {{ t('home.expenses') }}
          </NuxtLink>
        </div>
      </AppCard>

      <AppCard padding="lg">
        <div class="flex items-center justify-between gap-2 mb-3">
          <PageHeader :title="t('home.notifications')" :subtitle="t('home.viewAll')" />
          <NuxtLink to="/notifications" class="text-xs font-extrabold text-primary-600 shrink-0">{{ t('home.viewAll') }}</NuxtLink>
        </div>
        <div v-if="recentNotifications.length" class="flex flex-col gap-2.5">
          <div
            v-for="n in recentNotifications"
            :key="n.id"
            class="flex items-start gap-3 rounded-2xl p-3 transition-colors"
            :class="n.unread ? 'bg-primary-50/60 dark:bg-primary-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'"
          >
            <div
              class="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 shadow-soft flex items-center justify-center text-slate-500 shrink-0 border border-slate-100 dark:border-slate-700"
              :class="n.unread ? 'text-primary-600' : ''"
            >
              <Icon :name="n.unread ? 'i-lucide-bell' : 'i-lucide-check-circle'" class="w-4 h-4" />
            </div>
            <div class="min-w-0">
              <h4 class="text-sm font-extrabold text-slate-800 dark:text-slate-100 truncate">{{ n.title }}</h4>
              <p class="text-xs text-slate-400 font-medium truncate">{{ n.message }}</p>
              <div class="text-[10px] text-slate-300 font-medium mt-0.5">{{ n.createdAt ? n.createdAt.slice(0, 16).replace('T', ' ') : '' }}</div>
            </div>
          </div>
        </div>
        <EmptyState v-else :title="t('home.noNotifications')" />
      </AppCard>
    </div>

    <EmptyState
      v-else
      class="mb-8"
      :title="t('buildings.noBuildings')"
      :message="t('home.selectBuilding')"
    />

    <section v-if="currentBuilding" class="mb-8">
      <PageHeader :title="t('home.finance')" :subtitle="t('home.financeSubtitle')" />
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <AppCard padding="md" class="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/40 dark:to-slate-900 border-emerald-100/60 dark:border-emerald-900/40">
          <div class="text-xs text-emerald-600 font-bold">{{ t('home.chargeIncome') }}</div>
          <div class="text-xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5">{{ fmt(chargeIncome) }}</div>
        </AppCard>
        <AppCard padding="md" class="bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/40 dark:to-slate-900 border-rose-100/60 dark:border-rose-900/40">
          <div class="text-xs text-rose-600 font-bold">{{ t('home.expenses') }}</div>
          <div class="text-xl font-extrabold text-rose-700 dark:text-rose-300 mt-0.5">{{ fmt(expenseTotal) }}</div>
        </AppCard>
        <AppCard padding="md" class="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/40 dark:to-slate-900 border-amber-100/60 dark:border-amber-900/40">
          <div class="text-xs text-amber-600 font-bold">{{ t('home.balance') }}</div>
          <div class="text-xl font-extrabold text-amber-700 dark:text-amber-300 mt-0.5">{{ fmt(balance) }}</div>
        </AppCard>
        <AppCard padding="md" class="bg-gradient-to-br from-sky-50 to-white dark:from-sky-950/40 dark:to-slate-900 border-sky-100/60 dark:border-sky-900/40">
          <div class="text-xs text-sky-600 font-bold">{{ t('home.paidCount') }}</div>
          <div class="text-xl font-extrabold text-sky-700 dark:text-sky-300 mt-0.5">{{ paidCount }}</div>
        </AppCard>
      </div>
    </section>
  </div>
</template>
