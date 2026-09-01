<script setup lang="ts">
import type { ServiceItem } from '../types'

const { t } = useI18n()

const services: ServiceItem[] = [
  { id: 's1', title: 'نصب کولر گازی', category: 'تأسسیات', status: 'in-progress', date: '۱۴۰۵/۰۳/۱۰', description: 'نصب کولر گازی در واحد ۴۰۵' },
  { id: 's2', title: 'تعمیر پارکینگ', category: 'ساختمان', status: 'completed', date: '۱۴۰۵/۰۳/۰۵', description: 'تعمیر درب پارکینگ طبقه همکف' },
  { id: 's3', title: 'بررسی برق', category: 'برق', status: 'pending', date: '۱۴۰۵/۰۳/۱۲', description: 'بررسی مدار روشنایی راهروها' },
  { id: 's4', title: 'نظافت سالن', category: 'خدمات', status: 'completed', date: '۱۴۰۵/۰۲/۲۸', description: 'نظافت کامل سالن اجتماعات' },
]

const categories = ['همه', 'تأسسیات', 'ساختمان', 'برق', 'خدمات']
const activeCategory = ref('همه')

const filtered = computed(() => {
  if (activeCategory.value === 'همه') return services
  return services.filter((s) => s.category === activeCategory.value)
})
</script>

<template>
  <div>
    <AppHeader title="خدمات" subtitle="درخواست‌ها و تاریخچه" back />

    <section class="mb-6">
      <AppCard padding="md">
        <h3 class="text-sm font-extrabold text-slate-800 mb-3">درخواست خدمت جدید</h3>
        <div class="grid sm:grid-cols-3 gap-3">
          <AppInput label="عنوان" placeholder="مثلاً تعمیر درب" />
          <AppSelect label="دسته‌بندی" :options="categories.filter(c => c !== 'همه').map(c => ({ value: c, label: c }))" />
          <AppInput label="توضیحات" placeholder="توضیح کوتاه" />
        </div>
        <div class="mt-3 flex justify-end">
          <button class="h-11 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-extrabold shadow-soft px-6 text-sm transition-colors">ارسال درخواست</button>
        </div>
      </AppCard>
    </section>

    <PageHeader title="تاریخچه خدمات" subtitle="آخرین درخواست‌ها" />

    <div class="flex gap-2 overflow-x-auto scrollbar-hide mb-4 pb-1">
      <button v-for="c in categories" :key="c" @click="activeCategory = c" class="shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-colors border" :class="activeCategory === c ? 'bg-primary-600 text-white border-primary-600 shadow-soft' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'">{{ c }}</button>
    </div>

    <div class="flex flex-col gap-3">
      <AppCard v-for="s in filtered" :key="s.id" padding="md" hover>
        <div class="flex items-start justify-between gap-3">
          <div>
            <h4 class="text-base font-extrabold text-slate-900">{{ s.title }}</h4>
            <p class="text-xs text-slate-400 font-medium mt-0.5">{{ s.description }}</p>
            <div class="flex items-center gap-2 mt-2">
              <span class="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">{{ s.category }}</span>
              <span class="text-[10px] text-slate-300 font-medium">{{ s.date }}</span>
            </div>
          </div>
          <StatusBadge :status="s.status === 'completed' ? 'completed' : s.status === 'in-progress' ? 'in-progress' : 'pending'" :label="s.status === 'completed' ? 'انجام شده' : s.status === 'in-progress' ? 'در حال انجام' : 'در انتظار'" />
        </div>
      </AppCard>
      <EmptyState v-if="filtered.length === 0" title="درخواستی یافت نشد" message="با انتخاب دسته‌بندی دیگر امتحان کنید." />
    </div>
  </div>
</template>
