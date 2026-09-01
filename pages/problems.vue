<script setup lang="ts">
const { t } = useI18n()
const auth = useAuth()
const { buildings } = useBuildings()
const { getByBuilding, getById, create, update, categoryLabels, statusLabels } = useProblems()

const route = useRoute()
const id = computed(() => route.query.id as string)
const detail = computed(() => id.value ? getById(id.value) : null)
const currentBuildingId = computed(() => buildings.value[0]?.id || 'b-1')
const list = computed(() => getByBuilding(currentBuildingId.value))

const categoryFilter = ref('all')
const filtered = computed(() => {
  if (categoryFilter.value === 'all') return list.value
  return list.value.filter(p => p.category === categoryFilter.value)
})

const showForm = ref(false)
const cat = ref('other')
const title = ref('')
const desc = ref('')

const submit = () => {
  if (!title.value.trim()) return
  create({ buildingId: currentBuildingId.value, category: cat.value as any, title: title.value, description: desc.value, createdBy: (auth.user as any)?.id || 'system' })
  title.value = ''; desc.value = ''; cat.value = 'other'; showForm.value = false
}

const updateStatus = (reportId: string, status: 'new' | 'in-progress' | 'resolved') => update(reportId, { status })
</script>

<template>
  <div>
    <AppHeader title="گزارش مشکلات" subtitle="مشکلات ساختمان" back />

    <div class="flex items-center gap-2 overflow-x-auto scrollbar-hide mb-3 pb-1">
      <button v-for="c in [{value:'all',label:'همه'},{value:'water',label:'آب'},{value:'electricity',label:'برق'},{value:'elevator',label:'آسانسور'},{value:'gas',label:'گاز'},{value:'common',label:'مشاعات'},{value:'cleaning',label:'نظافت'},{value:'other',label:'سایر'}]" :key="c.value" @click="categoryFilter = c.value" class="shrink-0 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors border" :class="categoryFilter === c.value ? 'bg-primary-600 text-white border-primary-600 shadow-soft' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'">{{ c.label }}</button>
    </div>

    <div v-if="auth.isResident || auth.isManager" class="flex justify-end mb-4">
      <NuxtLink to="/problems/new" class="px-4 py-2 rounded-xl bg-gradient-to-br from-primary-500 to-teal-600 text-white text-sm font-extrabold shadow-soft">+ گزارش جدید</NuxtLink>
    </div>

    <div v-if="detail" class="mb-6">
      <AppCard padding="lg">
        <button @click="$router.push('/problems')" class="text-xs text-primary-600 font-bold mb-2">← بازگشت به لیست</button>
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{{ categoryLabels[detail.category] || detail.category }}</span>
          <StatusBadge :status="detail.status === 'new' ? 'pending' : detail.status === 'in-progress' ? 'in-progress' : 'completed'" :label="statusLabels[detail.status] || detail.status" />
        </div>
        <h2 class="text-xl font-extrabold text-slate-900 leading-tight mb-2">{{ detail.title }}</h2>
        <p class="text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-wrap mb-3">{{ detail.description }}</p>
        <div v-if="auth.isManager" class="flex gap-2">
          <button @click="updateStatus(detail.id, 'new')" class="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-extrabold">جدید</button>
          <button @click="updateStatus(detail.id, 'in-progress')" class="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-600 text-xs font-extrabold">در حال پیگیری</button>
          <button @click="updateStatus(detail.id, 'resolved')" class="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-extrabold">حل شده</button>
        </div>
      </AppCard>
    </div>

    <div v-else class="flex flex-col gap-3">
      <AppCard v-for="p in filtered" :key="p.id" padding="md" hover>
        <NuxtLink :to="'/problems?id=' + p.id" class="block">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-[10px] font-bold bg-slate-50 text-slate-500 px-2 py-0.5 rounded-md border border-slate-100">{{ categoryLabels[p.category] || p.category }}</span>
            <StatusBadge :status="p.status === 'new' ? 'pending' : p.status === 'in-progress' ? 'in-progress' : 'completed'" :label="statusLabels[p.status] || p.status" />
          </div>
          <h4 class="text-base font-extrabold text-slate-900 leading-snug">{{ p.title }}</h4>
          <p class="text-xs text-slate-400 font-medium truncate">{{ p.description }}</p>
        </NuxtLink>
      </AppCard>
      <EmptyState v-if="filtered.length === 0" title="گزارشی یافت نشد" message="گزارش جدید ثبت کنید یا فیلتر را تغییر دهید." />
    </div>
  </div>
</template>
