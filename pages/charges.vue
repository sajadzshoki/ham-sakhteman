<script setup lang="ts">
const { t } = useI18n()
const auth = useAuth()
const { buildings } = useBuildings()
const { getByBuilding, createCharge, updateCharge } = useFinance()
const route = useRoute()
const bId = computed(() => (route.query.buildingId as string) || buildings.value[0]?.id || 'b-1')
const list = computed(() => getByBuilding(bId.value))
const isMgr = computed(() => auth.isManager || (buildings.value.find(b => b.id === bId.value)?.managerId === (auth.user as any)?.id))

const showForm = ref(false)
const title = ref('')
const amount = ref(0)
const period = ref('')
const due = ref('')
const desc = ref('')

const submit = () => {
  if (!title.value.trim() || amount.value <= 0) return
  createCharge({ buildingId: bId.value, title: title.value, amount: amount.value, period: period.value, dueDate: due.value, description: desc.value, createdBy: (auth.user as any)?.id || 'system' })
  title.value = ''; amount.value = 0; period.value = ''; due.value = ''; desc.value = ''; showForm.value = false
}

const fmt = (n: number) => n.toLocaleString('fa-IR') + ' تومان'
</script>

<template>
  <div>
    <AppHeader title="شارژها" subtitle="صورت‌حساب‌های ساختمان" back />

    <div v-if="isMgr" class="mb-4 flex justify-end">
      <button @click="showForm = !showForm" class="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-extrabold shadow-soft">{{ showForm ? 'بستن' : '+ شارژ جدید' }}</button>
    </div>

    <AppCard v-if="showForm" padding="md" class="mb-6">
      <h3 class="text-base font-extrabold text-slate-900 mb-3">شارژ جدید</h3>
      <div class="grid sm:grid-cols-2 gap-3 mb-3">
        <AppInput v-model="title" label="عنوان" placeholder="مثلاً شارژ ماهانه" />
        <AppInput v-model="amount" label="مبلغ (تومان)" type="number" placeholder="1250000" />
        <AppInput v-model="period" label="دوره" placeholder="مثلاً خرداد ۱۴۰۵" />
        <AppInput v-model="due" label="تاریخ سررسید" placeholder="۱۴۰۵/۰۴/۰۵" />
      </div>
      <AppInput v-model="desc" label="توضیحات" placeholder="اختیاری" />
      <button @click="submit" class="mt-3 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-teal-600 text-white font-extrabold shadow-soft w-full">ثبت شارژ</button>
    </AppCard>

    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <AppCard v-for="c in list" :key="c.id" padding="md" hover>
        <div class="flex items-start justify-between gap-2 mb-2">
          <h4 class="text-base font-extrabold text-slate-900 leading-snug">{{ c.title }}</h4>
          <StatusBadge :status="c.status === 'paid' ? 'completed' : c.status === 'late' ? 'warning' : 'pending'" :label="c.status === 'paid' ? 'پرداخت شده' : c.status === 'late' ? 'دیرکرد' : 'پرداخت نشده'" />
        </div>
        <div class="text-xl font-extrabold text-primary-600">{{ fmt(c.amount) }}</div>
        <div class="text-xs text-slate-400 font-medium mt-1">دوره: {{ c.period }} | سررسید: {{ c.dueDate }}</div>
        <div v-if="c.description" class="text-xs text-slate-300 font-medium truncate mt-1">{{ c.description }}</div>
        <div v-if="c.paidAt" class="text-[10px] text-emerald-600 font-bold mt-1">پرداخت شده در {{ c.paidAt }}</div>
        <div v-if="isMgr" class="flex gap-2 mt-3">
          <button v-if="c.status === 'unpaid'" @click="updateCharge(c.id, { status: 'paid', paidAt: new Date().toISOString().slice(0,10), paidBy: (auth.user as any)?.id })" class="flex-1 h-8 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-extrabold hover:bg-emerald-100">ثبت پرداخت</button>
        </div>
      </AppCard>
      <EmptyState v-if="list.length === 0" title="شارژی یافت نشد" message="شارژ جدید اضافه کنید." />
    </div>
  </div>
</template>
