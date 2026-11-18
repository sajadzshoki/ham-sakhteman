<script setup lang="ts">
import type { NavItem } from '../types'

const route = useRoute()
const { t, locale } = useI18n()
const auth = useAuth()
const theme = useTheme()
const { primaryBuildingId } = useBuildings()

const dir = computed(() => (locale.value === 'fa' ? 'rtl' : 'ltr'))

const buildingTarget = computed(() => {
  if (primaryBuildingId.value) return `/building?id=${primaryBuildingId.value}`
  return '/buildings'
})

const navItems = computed<NavItem[]>(() => [
  { label: t('nav.home'), icon: 'i-lucide-home', to: '/' },
  { label: t('nav.building'), icon: 'i-lucide-building-2', to: buildingTarget.value },
  { label: t('nav.services'), icon: 'i-lucide-wrench', to: '/services' },
  { label: t('nav.profile'), icon: 'i-lucide-user', to: '/profile' },
])

const isActive = (to: string) => {
  const path = to.split('?')[0] || '/'
  if (path === '/') return route.path === '/' || route.path === '/en'
  if (path === '/building') return route.path.includes('/building')
  return route.path.includes(path)
}

const avatarName = computed(() => auth.user?.name || '')
const avatarInitials = computed(() => auth.user?.avatarInitials || '')
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-vazirmatn" :dir="dir">
    <!-- Desktop top nav -->
    <header class="hidden md:flex sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100/80 dark:border-slate-800 items-center justify-between px-6 lg:px-10 h-16 shadow-soft">
      <NuxtLink to="/" class="flex items-center gap-2.5 group">
        <span class="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-teal-600 text-white flex items-center justify-center shadow-soft-lg">
          <Icon name="i-lucide-building-2" class="w-5 h-5" />
        </span>
        <div class="leading-none">
          <div class="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">{{ t('brand.name') }}</div>
          <div class="text-[10px] text-slate-400 font-medium mt-0.5">{{ t('brand.tagline') }}</div>
        </div>
      </NuxtLink>

      <nav class="flex items-center gap-1 bg-slate-50/70 dark:bg-slate-800/70 rounded-2xl px-2 py-1 border border-slate-100/60 dark:border-slate-700/60">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200"
          :class="isActive(item.to)
            ? 'bg-white dark:bg-slate-900 text-primary-700 dark:text-primary-300 shadow-sm border border-slate-100/80 dark:border-slate-700'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/70 dark:hover:bg-slate-900/70'"
        >
          <Icon :name="item.icon" class="w-4 h-4" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <div class="flex items-center gap-3">
        <NuxtLink
          to="/notifications"
          class="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 flex items-center justify-center transition-colors border border-slate-100 dark:border-slate-700"
          :aria-label="t('home.notifications')"
        >
          <Icon name="i-lucide-bell" class="w-4 h-4" />
        </NuxtLink>
        <button
          type="button"
          @click="theme.toggle()"
          :aria-label="t('common.toggleTheme')"
          class="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 flex items-center justify-center transition-colors border border-slate-100 dark:border-slate-700"
        >
          <Icon :name="theme.isDark ? 'i-lucide-sun' : 'i-lucide-moon'" class="w-4 h-4" />
        </button>
        <NuxtLink to="/profile" class="flex items-center">
          <UserAvatar v-if="auth.isAuthenticated" :name="avatarName" :initials="avatarInitials" />
          <span
            v-else
            class="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500"
            aria-hidden="true"
          >
            <Icon name="i-lucide-user" class="w-4 h-4" />
          </span>
        </NuxtLink>
      </div>
    </header>

    <!-- Mobile header -->
    <header class="md:hidden sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-100/80 dark:border-slate-800 px-4 h-14 flex items-center justify-between shadow-soft">
      <NuxtLink to="/" class="flex items-center gap-2">
        <span class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-teal-600 text-white flex items-center justify-center shadow-soft">
          <Icon name="i-lucide-building-2" class="w-4 h-4" />
        </span>
        <span class="font-extrabold text-base text-slate-900 dark:text-white leading-none">{{ t('brand.name') }}</span>
      </NuxtLink>
      <div class="flex items-center gap-2">
        <NuxtLink
          to="/notifications"
          class="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center border border-slate-100 dark:border-slate-700"
          :aria-label="t('home.notifications')"
        >
          <Icon name="i-lucide-bell" class="w-4 h-4" />
        </NuxtLink>
        <button
          type="button"
          @click="theme.toggle()"
          :aria-label="t('common.toggleTheme')"
          class="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center border border-slate-100 dark:border-slate-700"
        >
          <Icon :name="theme.isDark ? 'i-lucide-sun' : 'i-lucide-moon'" class="w-4 h-4" />
        </button>
        <NuxtLink to="/profile">
          <UserAvatar v-if="auth.isAuthenticated" :name="avatarName" :initials="avatarInitials" avatar-size="sm" />
          <span
            v-else
            class="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500"
            aria-hidden="true"
          >
            <Icon name="i-lucide-user" class="w-3.5 h-3.5" />
          </span>
        </NuxtLink>
      </div>
    </header>

    <!-- Main content -->
    <main class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 md:pb-10 pt-4 md:pt-8">
      <slot />
    </main>

    <!-- Bottom nav mobile -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-100/70 dark:border-slate-800 shadow-[0_-4px_30px_-8px_rgba(0,0,0,0.06)] px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 flex items-center justify-around h-[72px]">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex flex-col items-center justify-center gap-0.5 w-16 rounded-2xl py-1.5 transition-colors duration-200"
        :class="isActive(item.to) ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'"
      >
        <span
          class="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          :class="isActive(item.to) ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 shadow-inner-soft' : 'text-inherit'"
        >
          <Icon :name="item.icon" class="w-5 h-5" />
        </span>
        <span class="text-[10px] font-semibold leading-tight">{{ item.label }}</span>
      </NuxtLink>
    </nav>
  </div>
</template>
