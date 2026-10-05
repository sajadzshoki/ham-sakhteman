<script setup lang="ts">
import { providerCategories, providerCategoryOf } from '~/data/mock'
import { serviceProviders } from '~/data/providers'

const { user } = useAuth()
const store = useAppStore()

useSeoMeta({
  title: 'مدیریت کل',
  ogTitle: 'مدیریت کل',
})

const buildings = computed(() => store.buildings.value)
const users = computed(() => store.users.value)

const stats = computed(() => [
  { label: 'ساختمان‌ها', value: buildings.value.length, icon: 'i-lucide-building-2', tint: 'bg-teal-50 text-teal-600 dark:bg-teal-400/10 dark:text-teal-300' },
  { label: 'کاربران', value: users.value.length, icon: 'i-lucide-users', tint: 'bg-sky-50 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300' },
  { label: 'ارائه‌دهندگان خدمات', value: serviceProviders.length, icon: 'i-lucide-concierge-bell', tint: 'bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300' },
  { label: 'دسته‌بندی خدمات', value: providerCategories.length, icon: 'i-lucide-layout-grid', tint: 'bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300' },
])
</script>

<template>
  <div class="space-y-7">
    <PageHeader
      title="مدیریت کل"
      :description="`خوش آمدید، ${user?.name ?? ''} — نمای کلی پلتفرم هم‌ساختمان`"
    />

    <!-- آمار پایه -->
    <section class="grid grid-cols-2 gap-2.5 sm:gap-3">
      <AppCard v-for="stat in stats" :key="stat.label" padding="sm">
        <div class="flex items-center gap-3">
          <span class="flex size-10 shrink-0 items-center justify-center rounded-xl" :class="stat.tint">
            <Icon :name="stat.icon" class="size-5" />
          </span>
          <div class="min-w-0">
            <p class="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">{{ toPersianDigits(stat.value) }}</p>
            <p class="truncate text-[11px] text-slate-500 dark:text-slate-400">{{ stat.label }}</p>
          </div>
        </div>
      </AppCard>
    </section>

    <!-- ساختمان‌ها -->
    <section>
      <SectionHeader title="ساختمان‌ها" />
      <div v-if="buildings.length" class="space-y-3">
        <AppCard v-for="building in buildings" :key="building.id" as="article">
          <div class="flex items-start gap-3">
            <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-400/10 dark:text-teal-300">
              <Icon name="i-lucide-building-2" class="size-5" />
            </span>
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-2">
                <p class="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{{ building.name }}</p>
                <span class="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
                  {{ toPersianDigits(store.buildingMembers(building.id).length) }} عضو
                </span>
              </div>
              <p class="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{{ building.address }}</p>
              <p class="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                {{ toPersianDigits(store.buildingUnits(building.id).length) }} واحد
                • مدیر: {{ store.buildingManager(building.id)?.name ?? '—' }}
              </p>
            </div>
          </div>
        </AppCard>
      </div>
      <EmptyState v-else icon="i-lucide-building-2" title="هنوز ساختمانی ثبت نشده" />
    </section>

    <!-- کاربران -->
    <section>
      <SectionHeader title="کاربران" />
      <AppCard padding="none">
        <ul class="divide-y divide-slate-100 dark:divide-slate-800">
          <li v-for="person in users" :key="person.id" class="flex items-center gap-3 px-4 py-3">
            <UserAvatar :name="person.name" size="sm" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{{ person.name }}</p>
              <p class="text-[11px] text-slate-400 dark:text-slate-500" dir="ltr">{{ formatPhone(person.phone) }}</p>
            </div>
            <StatusBadge :status="person.role" />
          </li>
        </ul>
      </AppCard>
    </section>

    <!-- ارائه‌دهندگان خدمات -->
    <section>
      <SectionHeader title="ارائه‌دهندگان خدمات" />
      <AppCard padding="none">
        <ul class="divide-y divide-slate-100 dark:divide-slate-800">
          <li v-for="provider in serviceProviders" :key="provider.id" class="flex items-center gap-3 px-4 py-3">
            <span class="flex size-9 shrink-0 items-center justify-center rounded-xl" :class="providerCategoryOf(provider.category).tint">
              <Icon :name="providerCategoryOf(provider.category).icon" class="size-4.5" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{{ provider.name }}</p>
              <p class="truncate text-[11px] text-slate-400 dark:text-slate-500">
                {{ providerCategoryOf(provider.category).label }} • {{ provider.serviceArea }}
              </p>
            </div>
            <span class="flex shrink-0 items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300">
              <Icon name="i-lucide-star" class="size-3.5 text-amber-500" />
              {{ formatRating(provider.rating) }}
            </span>
          </li>
        </ul>
      </AppCard>
    </section>
  </div>
</template>
