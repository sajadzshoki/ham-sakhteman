<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const nav = useAppNavigation()
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/70 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden dark:border-slate-800/70 dark:bg-slate-950/95"
    aria-label="ناوبری پایین"
  >
    <div class="mx-auto grid w-full max-w-md" :class="nav.length > 2 ? 'grid-cols-4' : 'grid-cols-2'">
      <NuxtLink
        v-for="item in nav"
        :key="item.to"
        :to="item.to"
        class="flex flex-col items-center gap-1 rounded-lg pt-2 pb-1.5 text-[11px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-teal-500/60 focus-visible:outline-none"
        :aria-current="isRouteActive(item.to, route.path) ? 'page' : undefined"
        :class="
          isRouteActive(item.to, route.path)
            ? 'text-teal-600 dark:text-teal-300'
            : 'text-slate-500 dark:text-slate-400'
        "
      >
        <span
          class="flex h-7 w-14 items-center justify-center rounded-full transition-colors"
          :class="isRouteActive(item.to, route.path) && 'bg-teal-50 dark:bg-teal-400/10'"
        >
          <Icon :name="item.icon" class="size-5" />
        </span>
        {{ t(item.labelKey) }}
      </NuxtLink>
    </div>
  </nav>
</template>
