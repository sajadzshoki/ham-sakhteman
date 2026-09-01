<script setup lang="ts">
import type { NavItem } from '../types'

const route = useRoute()
const { t } = useI18n()

const navItems: NavItem[] = [
  { label: t('nav.home'), icon: 'i-lucide-home', to: '/' },
  { label: t('nav.building'), icon: 'i-lucide-building-2', to: '/building' },
  { label: t('nav.services'), icon: 'i-lucide-wrench', to: '/services' },
  { label: t('nav.profile'), icon: 'i-lucide-user', to: '/profile' },
]

const isActive = (to: string) => {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 font-vazirmatn" dir="rtl">
    <!-- Desktop top nav -->
    <header class="hidden md:flex sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100/80 items-center justify-between px-6 lg:px-10 h-16 shadow-soft">
      <NuxtLink to="/" class="flex items-center gap-2.5 group">
        <span class="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-teal-600 text-white flex items-center justify-center shadow-soft-lg">
          <Icon name="i-lucide-building-2" class="w-5 h-5" />
        </span>
        <div class="leading-none">
          <div class="text-base font-extrabold tracking-tight text-slate-900">هم‌ساختمان</div>
          <div class="text-[10px] text-slate-400 font-medium mt-0.5">مدیریت ساختمان</div>
        </div>
      </NuxtLink>

      <nav class="flex items-center gap-1 bg-slate-50/70 rounded-2xl px-2 py-1 border border-slate-100/60">
        <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to"
          class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200"
          :class="isActive(item.to)
            ? 'bg-white text-primary-700 shadow-sm border border-slate-100/80'
            : 'text-slate-500 hover:text-slate-800 hover:bg-white/70'">
          <Icon :name="item.icon" class="w-4 h-4" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <div class="flex items-center gap-3">
        <button onclick="document.documentElement.classList.toggle('dark')" aria-label="Toggle theme" class="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors border border-slate-100">
          <Icon name="i-lucide-moon" class="w-4 h-4" />
        </button>
        <UserAvatar name="علی رضایی" initials="ع ر" />
      </div>
    </header>

    <!-- Mobile header -->
    <header class="md:hidden sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100/80 px-4 h-14 flex items-center justify-between shadow-soft">
      <NuxtLink to="/" class="flex items-center gap-2">
        <span class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-teal-600 text-white flex items-center justify-center shadow-soft">
          <Icon name="i-lucide-building-2" class="w-4 h-4" />
        </span>
        <span class="font-extrabold text-base text-slate-900 leading-none">هم‌ساختمان</span>
      </NuxtLink>
      <div class="flex items-center gap-2">
        <button onclick="document.documentElement.classList.toggle('dark')" aria-label="Toggle theme" class="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center border border-slate-100">
          <Icon name="i-lucide-moon" class="w-4 h-4" />
        </button>
        <UserAvatar name="علی رضایی" initials="ع ر" avatar-size="sm" />
      </div>
    </header>

    <!-- Main content -->
    <main class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 md:pb-10 pt-4 md:pt-8">
      <slot />
    </main>

    <!-- Bottom nav mobile -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-slate-100/70 shadow-[0_-4px_30px_-8px_rgba(0,0,0,0.06)] px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 flex items-center justify-around h-[72px]">
      <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to"
        class="flex flex-col items-center justify-center gap-0.5 w-16 rounded-2xl py-1.5 transition-colors duration-200"
        :class="isActive(item.to) ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'">
        <span class="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          :class="isActive(item.to) ? 'bg-primary-50 text-primary-600 shadow-inner-soft' : 'text-inherit'">
          <Icon :name="item.icon" class="w-5 h-5" />
        </span>
        <span class="text-[10px] font-semibold leading-tight">{{ item.label }}</span>
      </NuxtLink>
    </nav>
  </div>
</template>
