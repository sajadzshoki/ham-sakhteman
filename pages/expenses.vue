<script setup lang="ts">
const { t } = useI18n()
const auth = useAuth()
const { buildings } = useBuildings()
const { getExpensesByBuilding, createExpense, removeExpense } = useFinance()
const route = useRoute()
const bId = computed(() => (route.query.buildingId as string) || buildings.value[0]?.id || 'b-1')
const list = computed(() => getExpensesByBuilding(bId.value))
const isMgr = computed(() => auth.isManager || (buildings.value.find(b => b.id === bId.value)?.managerId === (auth.user as any)?.id))

const showForm = ref(false)
const title = ref('')
const amount = ref(0)
const cat = ref('repair')
const date = ref('')
const desc = ref('')

const submit = () => {
  if (!title.value.trim() || amount.value <= 0) return
  createExpense({ buildingId: bId.value, title: title.value, amount: amount.value, category: cat.value as any, date: date.value || new Date().toISOString().slice(0,10), description: desc.value, createdBy: (auth.user as any)?.id || 'system' })
  title.value = ''; amount.value = 0; cat.value = 'repair'; date.value = ''; desc.value = ''; showForm.value = false
}

const fmt = (n: number) => n.toLocaleString('fa-IR') + ' تومان'
const cats: Record<string,string> = { water: 'آب', gas: 'گاز', electricity: 'برق', elevator: 'آسانسور', cleaning: 'نظافت', repair: 'تعمیرات', other: 'سایر' }
</script>

<template>
  <div>
    <AppHeader title="هزینه‌ها" subtitle="هزینه‌های ساختمان" back />
    <div v-if="isMgr" class="mb-4 flex justify-end">
      <button @click="showForm = !showForm" class="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-extrabold shadow-soft">{{ showForm ? 'بستن' : '+ هزینه جدید' }}</button>
    </div>
    <AppCard v-if="showForm" padding="md" class="mb-6">
      <h3 class="text-base font-extrabold text-slate-900 mb-3">هزینه جدید</h3>
      <div class="grid sm:grid-cols-2 gap-3 mb-3">
        <AppInput v-model="title" label="عنوان" placeholder="مثلاً تعمیر پارکینگ" />
        <AppInput v-model="amount" label="مبلغ (تومان)" type="number" placeholder="450000" />
        <AppSelect label="دسته‌بندی" v-model="cat" :options="[{value:'water',label:'آب'},{value:'gas',label:'گاز'},{value:'electricity',label:'برق'},{value:'elevator',label:'آسانسور'},{value:'cleaning',label:'نظافت'},{value:'repair',label:'تعمیرات'},{value:'other',label:'سایر'}]" />
        <AppInput v-model="date" label="تاریخ" placeholder="۱۴۰۵/۰۳/۰۲" />
      </div>
      <AppInput v-model="desc" label="توضیحات" />
      <button @click="submit" class="mt-3 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-teal-600 text-white font-extrabold shadow-soft w-full">ثبت هزینه</button>
    </AppCard>

    <div class="flex flex-col gap-3">
      <AppCard v-for="e in list" :key="e.id" padding="md" hover>
        <div class="flex items-start justify-between gap-3 mb-2">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{{ cats[e.category] || e.category }}</span>
              <span class="text-[10px] text-slate-300 font-medium">{{ e.date }}</span>
            </div>
            <h4 class="text-base font-extrabold text-slate-900 leading-snug">{{ e.title }}</h4>
          </div>
          <div class="text-lg font-extrabold text-rose-600 whitespace-nowrap">{{ fmt(e.amount) }}</div>
        </div>
        <p v-if="e.description" class="text-xs text-slate-400 font-medium truncate">{{ e.description }}</p>
      </AppCard>
      <EmptyState v-if="list.length === 0" title="هزینه‌ای یافت نشد" message="هزینه جدید اضافه کنید." />
    </div>
  </div>
</template>
