<script setup lang="ts">
import type { NavItem } from '../../types'

const route = useRoute()
const { t } = useI18n()

const navItems: NavItem[] = [
  { label: t('nav.home'), icon: 'i-lucide-home', to: '/' },
  { label: t('nav.building'), icon: 'i-lucide-building-2', to: '/building' },
  { label: t('nav.services'), icon: 'i-lucide-wrench', to: '/services' },
  { label: t('nav.profile'), icon: 'i-lucide-user', to: '/profile' },
]

const isActive = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to))
</script>

<template>
  <nav class="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-slate-100/70 shadow-[0_-4px_30px_-8px_rgba(0,0,0,0.06)] px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 flex items-center justify-around h-[72px]">
    <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to"
      class="flex flex-col items-center justify-center gap-0.5 w-16 rounded-2xl py-1.5 transition-colors duration-200"
      :class="isActive(item.to) ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'">
      <span class="w-9 h-9 rounded-xl flex items-center justify-center transition-colors" :class="isActive(item.to) ? 'bg-primary-50 text-primary-600 shadow-inner-soft' : ''">
        <Icon :name="item.icon" class="w-5 h-5" />
      </span>
      <span class="text-[10px] font-semibold leading-tight">{{ item.label }}</span>
    </NuxtLink>
  </nav>
</template>
