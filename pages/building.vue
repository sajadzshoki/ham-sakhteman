<script setup lang="ts">
const { t } = useI18n()

const units = [
  { id: 'u1', number: '۴۰۱', floor: '۴', residentName: 'سارا محمدی', status: 'occupied' as const },
  { id: 'u2', number: '۴۰۲', floor: '۴', residentName: 'علی رضایی', status: 'occupied' as const },
  { id: 'u3', number: '۴۰۳', floor: '۴', residentName: 'محمد کرمی', status: 'vacant' as const },
  { id: 'u4', number: '۴۰۴', floor: '۴', residentName: 'نرگس احمدی', status: 'maintenance' as const },
  { id: 'u5', number: '۴۰۵', floor: '۴', residentName: 'حسن نوری', status: 'occupied' as const },
]

const expenses = [
  { label: 'شارژ ماهانه', value: '۱,۲۵۰,۰۰۰ تومان', change: '+۵٪', trend: 'up' },
  { label: 'تعمیرات مشترک', value: '۸۹۰,۰۰۰ تومان', change: '-۲٪', trend: 'down' },
  { label: 'بیمه ساختمان', value: '۳۴۰,۰۰۰ تومان', change: '۰٪', trend: 'flat' },
]
</script>

<template>
  <div>
    <AppHeader title="ساختمان" subtitle="اطلاعات کامل ساختمان" back />

    <AppCard padding="lg" class="mb-6">
      <div class="flex items-center gap-4 mb-5">
        <span class="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-teal-600 text-white flex items-center justify-center shadow-soft-lg shadow-inner-soft">
          <Icon name="i-lucide-building-2" class="w-6 h-6" />
        </span>
        <div>
          <h2 class="text-xl font-extrabold text-slate-900 leading-none">ساختمان هم‌ساختمان</h2>
          <p class="text-xs text-slate-400 font-medium mt-1">تهران، خیابان ولیعصر، برج شمالی</p>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-3">
        <div v-for="e in expenses" :key="e.label" class="bg-slate-50 rounded-2xl p-3 border border-slate-100/60 text-center">
          <div class="text-xs text-slate-400 font-bold">{{ e.label }}</div>
          <div class="text-sm font-extrabold text-slate-900 mt-1">{{ e.value }}</div>
          <div class="text-[10px] font-bold mt-0.5" :class="e.trend === 'up' ? 'text-rose-500' : e.trend === 'down' ? 'text-emerald-500' : 'text-slate-400'">{{ e.change }}</div>
        </div>
      </div>
    </AppCard>

    <PageHeader title="واحدها" subtitle="وضعیت اشغال و تعمیرات" />
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
      <AppCard v-for="u in units" :key="u.id" padding="md" hover>
        <div class="flex items-start justify-between mb-2">
          <div>
            <h3 class="text-base font-extrabold text-slate-900 leading-none">واحد {{ u.number }}</h3>
            <span class="text-xs text-slate-400 font-medium">طبقه {{ u.floor }}</span>
          </div>
          <StatusBadge :status="u.status === 'occupied' ? 'completed' : u.status === 'vacant' ? 'pending' : 'warning'" :label="u.status === 'occupied' ? 'اشغال' : u.status === 'vacant' ? 'خالی' : 'تعمیر'" />
        </div>
        <div class="text-sm font-bold text-slate-700">{{ u.residentName }}</div>
      </AppCard>
    </div>

    <PageHeader title="تجهیزات" subtitle="وضعیت سیستم‌ها" />
    <AppCard padding="md" class="mb-6">
      <div class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shadow-soft border border-sky-100">
          <Icon name="i-lucide-elevator" class="w-5 h-5" />
        </div>
        <div>
          <div class="text-sm font-extrabold text-slate-900">آسانسور</div>
          <div class="text-xs text-slate-400 font-medium">در حال تعمیر — ساعت ۱۰</div>
        </div>
        <StatusBadge status="pending" label="در انتظار" class="mr-auto" />
      </div>
    </AppCard>
  </div>
</template>
