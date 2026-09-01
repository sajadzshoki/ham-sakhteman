<script setup lang="ts">
const auth = useAuth()
const { buildings } = useBuildings()
const { providers } = useProviders()
const { announcements } = useAnnouncements()
const { problems } = useProblems()

const stats = computed(() => ({
  buildings: buildings.value.length,
  providers: providers.value.length,
  users: 4,
  announcements: announcements.value.length,
  problems: problems.value.length,
}))
</script>

<template>
  <div>
    <AppHeader title="مدیر کل" subtitle="نمای کلی سیستم" back />

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <AppCard padding="md">
        <div class="text-xs text-slate-400 font-bold">ساختمان‌ها</div>
        <div class="text-2xl font-extrabold text-slate-900">{{ stats.buildings }}</div>
      </AppCard>
      <AppCard padding="md">
        <div class="text-xs text-slate-400 font-bold">اعضا</div>
        <div class="text-2xl font-extrabold text-slate-900">{{ stats.users }}</div>
      </AppCard>
      <AppCard padding="md">
        <div class="text-xs text-slate-400 font-bold">خدماتی‌ها</div>
        <div class="text-2xl font-extrabold text-slate-900">{{ stats.providers }}</div>
      </AppCard>
      <AppCard padding="md">
        <div class="text-xs text-slate-400 font-bold">اعلان‌ها</div>
        <div class="text-2xl font-extrabold text-slate-900">{{ stats.announcements }}</div>
      </AppCard>
    </div>

    <PageHeader title="لیست ساختمان‌ها" subtitle="ساختمان‌های ثبت‌شده" />
    <div class="flex flex-col gap-3 mb-6">
      <AppCard v-for="b in buildings" :key="b.id" padding="md" hover>
        <NuxtLink :to="'/building?id=' + b.id" class="block">
          <div class="text-base font-extrabold text-slate-900">{{ b.name }}</div>
          <div class="text-xs text-slate-400 font-medium">{{ b.address }}</div>
          <div class="flex items-center gap-2 mt-1 text-[10px] font-bold text-slate-300">
            <span>{{ b.unitCount }} واحد</span>
            <span>•</span>
            <span>{{ b.residentCount }} ساکن</span>
          </div>
        </NuxtLink>
      </AppCard>
      <EmptyState v-if="buildings.length === 0" title="ساختمانی یافت نشد" message="هنوز ساختمانی ثبت نشده." />
    </div>

    <PageHeader title="خدماتی‌ها" subtitle="لیست خدماتی‌های ثبت‌شده" />
    <div class="flex flex-col gap-3 mb-6">
      <AppCard v-for="p in providers.slice(0, 6)" :key="p.id" padding="md" hover>
        <NuxtLink :to="'/service-provider?id=' + p.id" class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-teal-500 text-white flex items-center justify-center shadow-soft shrink-0"><Icon name="i-lucide-user-cog" class="w-5 h-5" /></div>
          <div>
            <div class="text-sm font-extrabold text-slate-900">{{ p.name }}</div>
            <div class="text-xs text-slate-400 font-medium">{{ p.area }} • امتیاز {{ p.rating }}</div>
          </div>
        </NuxtLink>
      </AppCard>
    </div>
  </div>
</template>
