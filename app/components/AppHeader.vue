<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const nav = useAppNavigation()
const { isDark, toggleTheme } = useTheme()
const { user, isAuthenticated } = useAuth()
const store = useAppStore()

// اعلان‌ها در localStorage نگهداری می‌شوند؛ برای هم‌خوانی هیدریشن، نشان فقط پس از mount
const clientReady = ref(false)
onMounted(() => { clientReady.value = true })

const unreadCount = computed(() => (clientReady.value && user.value ? store.unreadNotifications(user.value.id).length : 0))
</script>

<template>
  <header
    class="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-950/85"
  >
    <div class="mx-auto flex h-16 w-full max-w-md items-center justify-between gap-2 px-4 lg:max-w-3xl">
      <!-- لوگو -->
      <NuxtLink to="/" class="flex items-center gap-2.5">
        <span
          class="flex size-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm"
        >
          <Icon name="i-lucide-building-2" class="size-5" />
        </span>
        <span class="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
          {{ t('app.name') }}
        </span>
      </NuxtLink>

      <!-- ناوبری دسکتاپ -->
      <nav class="hidden items-center gap-1 lg:flex" aria-label="ناوبری اصلی">
        <NuxtLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-teal-500/60 focus-visible:outline-none"
          :aria-current="isRouteActive(item.to, route.path) ? 'page' : undefined"
          :class="
            isRouteActive(item.to, route.path)
              ? 'bg-teal-50 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white'
          "
        >
          <Icon :name="item.icon" class="size-4" />
          {{ t(item.labelKey) }}
        </NuxtLink>
      </nav>

      <!-- اقدامات -->
      <div class="flex items-center gap-1">
        <UButton
          color="neutral"
          variant="ghost"
          size="md"
          :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
          :aria-label="isDark ? 'حالت روشن' : 'حالت تاریک'"
          @click="toggleTheme"
        />
        <NuxtLink
          v-if="isAuthenticated"
          to="/notifications"
          aria-label="اعلان‌ها"
          class="relative flex size-10 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white"
          :class="isRouteActive('/notifications', route.path) && 'bg-teal-50 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300'"
        >
          <Icon name="i-lucide-bell" class="size-5" />
          <span
            v-if="unreadCount > 0"
            class="absolute top-1 end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-600 px-1 text-[9px] font-extrabold text-white ring-2 ring-white dark:bg-teal-500 dark:ring-slate-950"
          >
            {{ toPersianDigits(Math.min(unreadCount, 9)) }}
          </span>
        </NuxtLink>
        <NuxtLink
          v-if="isAuthenticated && user"
          to="/account"
          class="ms-1"
          :aria-label="t('nav.account')"
        >
          <UserAvatar :name="user.name" size="sm" />
        </NuxtLink>
        <UButton
          v-else
          color="primary"
          variant="solid"
          size="md"
          label="ورود"
          to="/auth/login"
        />
      </div>
    </div>
  </header>
</template>
