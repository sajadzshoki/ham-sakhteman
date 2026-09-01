<script setup lang="ts">
const { t } = useI18n()
const auth = useAuth()
const { providers, categories, search, toggleTrusted } = useProviders()
const route = useRoute()

const q = ref('')
const category = ref('all')

const results = computed(() => {
  const term = q.value.trim()
  if (category.value === 'all') return search(term)
  return search(term, category.value)
})

const onSearch = () => {}
</script>

<template>
  <div>
    <AppHeader title="خدمات ساختمان" subtitle="پیدا کن → ببین → تماس بگیر" back />

    <section class="mb-4">
      <div class="relative">
        <Icon name="i-lucide-search" class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
        <input v-model="q" @input="onSearch" type="text" placeholder="نام خدماتی یا دسته..." class="w-full h-12 pr-10 pl-4 rounded-2xl bg-white border border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all shadow-soft" />
      </div>
    </section>

    <section class="mb-4">
      <div class="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        <button v-for="c in [{value:'all',label:'همه'},...categories.map(x=>({value:x.value,label:x.label}))]" :key="c.value" @click="category = c.value" class="shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-colors border" :class="category === c.value ? 'bg-primary-600 text-white border-primary-600 shadow-soft' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'">{{ c.label }}</button>
      </div>
    </section>

    <div v-if="!results.length" class="py-14 text-center">
      <div class="w-14 h-14 rounded-3xl bg-slate-50 text-slate-300 flex items-center justify-center mx-auto mb-3 border border-slate-100"><Icon name="i-lucide-search-x" class="w-7 h-7" /></div>
      <h4 class="text-base font-extrabold text-slate-800">نتیجه‌ای یافت نشد</h4>
      <p class="text-xs text-slate-400 font-medium">دسته‌بندی یا کلمه جستجو را تغییر دهید.</p>
    </div>

    <div class="flex flex-col gap-3">
      <AppCard v-for="p in results" :key="p.id" padding="md" hover>
        <NuxtLink :to="'/service-provider?id=' + p.id" class="flex items-start gap-3">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-teal-500 text-white flex items-center justify-center shadow-soft shadow-inner-soft shrink-0">
            <Icon name="i-lucide-user-cog" class="w-6 h-6" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <h4 class="text-base font-extrabold text-slate-900 truncate">{{ p.name }}</h4>
              <span v-if="p.trusted" class="text-[10px] font-bold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-md border border-amber-100 whitespace-nowrap">مورد اعتماد</span>
            </div>
            <div class="flex items-center gap-1 text-[10px] text-amber-500 font-bold mt-0.5">
              <Icon name="i-lucide-star" class="w-3 h-3" />
              <span>{{ p.rating }}</span>
            </div>
            <p class="text-xs text-slate-400 font-medium truncate mt-0.5">{{ p.description }}</p>
            <div class="flex items-center gap-2 mt-2 text-[10px] text-slate-300 font-medium">
              <span>{{ categories.find(c => c.value === p.category)?.label || p.category }}</span>
              <span>•</span>
              <span>{{ p.area }}</span>
            </div>
          </div>
        </NuxtLink>
        <div v-if="auth.isManager" class="mt-3 pt-3 border-t border-slate-100 flex justify-end">
          <button @click.prevent="toggleTrusted(p.id)" class="text-xs font-extrabold px-2 py-1 rounded-lg border transition-colors" :class="p.trusted ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-100 hover:text-slate-700'">{{ p.trusted ? 'حذف اعتماد' : 'اعتماد ساختمان' }}</button>
        </div>
      </AppCard>
    </div>
  </div>
</template>
