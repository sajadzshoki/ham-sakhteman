<script setup lang="ts">
import type { ServiceProvider } from '~/types'
import { providerCategoryOf } from '~/data/mock'

const props = defineProps<{
  provider: ServiceProvider
  /** «مورد اعتماد ساختمان» بودن — نشان طلایی روی کارت */
  trusted?: boolean
}>()

const category = computed(() => providerCategoryOf(props.provider.category))
</script>

<template>
  <AppCard as="article" hover>
    <div class="flex items-center gap-3">
      <NuxtLink
        :to="`/services/${provider.id}`"
        class="flex min-w-0 flex-1 items-center gap-3 rounded-xl focus-visible:ring-2 focus-visible:ring-teal-500/60 focus-visible:outline-none"
      >
        <span class="flex size-11 shrink-0 items-center justify-center rounded-xl" :class="category.tint">
          <Icon :name="category.icon" class="size-5" />
        </span>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <h3 class="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
              {{ provider.name }}
            </h3>
            <span
              v-if="trusted"
              class="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:bg-amber-400/10 dark:text-amber-300"
            >
              <Icon name="i-lucide-badge-check" class="size-3" />
              مورد اعتماد ساختمان
            </span>
          </div>
          <p class="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span class="flex shrink-0 items-center gap-1 font-bold text-slate-700 dark:text-slate-200">
              <Icon name="i-lucide-star" class="size-3.5 text-amber-500" />
              {{ formatRating(provider.rating) }}
            </span>
            <span class="shrink-0 text-slate-300 dark:text-slate-600">•</span>
            <span class="truncate">{{ category.label }}</span>
          </p>
          <p class="mt-1 flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
            <Icon name="i-lucide-map-pin" class="size-3.5 shrink-0" />
            <span class="truncate">{{ provider.serviceArea }}</span>
          </p>
        </div>
      </NuxtLink>
      <a
        :href="telHref(provider.phone)"
        :aria-label="`تماس با ${provider.name}`"
        class="flex shrink-0 flex-col items-center gap-1 rounded-xl bg-teal-600 px-3.5 py-2.5 text-[11px] font-bold text-white transition-colors hover:bg-teal-700 focus-visible:ring-2 focus-visible:ring-teal-500/70 focus-visible:outline-none dark:bg-teal-500 dark:hover:bg-teal-400"
      >
        <Icon name="i-lucide-phone-call" class="size-4" />
        تماس
      </a>
    </div>
  </AppCard>
</template>
