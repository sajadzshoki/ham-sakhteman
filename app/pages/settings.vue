<script setup lang="ts">
import type { ThemeMode } from '~/composables/useTheme'

const router = useRouter()
const { t } = useI18n()
const toast = useToast()
const { user, isAuthenticated, logout } = useAuth()
const store = useAppStore()
const { mode, setTheme } = useTheme()

useSeoMeta({
  title: 'تنظیمات',
  ogTitle: 'تنظیمات',
})

const clientReady = ref(false)
onMounted(() => { clientReady.value = true })

const unreadCount = computed(() => (clientReady.value && user.value ? store.unreadNotifications(user.value.id).length : 0))

const themeOptions: { id: ThemeMode, label: string, icon: string }[] = [
  { id: 'light', label: 'روشن', icon: 'i-lucide-sun' },
  { id: 'system', label: 'سیستم', icon: 'i-lucide-monitor' },
  { id: 'dark', label: 'تاریک', icon: 'i-lucide-moon' },
]

const isLogoutDialogOpen = ref(false)

async function onLogout() {
  try {
    await logout()
    toast.add({ title: t('common.logoutDone'), color: 'success' })
    await router.push('/auth/login')
  }
  catch (error) {
    toast.add({ title: apiErrorMessage(error, 'خروج از حساب انجام نشد'), color: 'error' })
  }
}
</script>

<template>
  <div class="space-y-7">
    <PageHeader title="تنظیمات" description="ترجیحات نمایش و حساب کاربری" />

    <template v-if="!isAuthenticated || !user">
      <EmptyState
        icon="i-lucide-settings"
        title="وارد حساب نشده‌اید"
        description="برای مشاهده تنظیمات، وارد حساب خود شوید."
      >
        <template #action>
          <UButton color="primary" variant="solid" size="md" label="ورود" icon="i-lucide-log-in" @click="router.push('/auth/login')" />
        </template>
      </EmptyState>
    </template>

    <template v-else>
      <!-- حساب -->
      <section>
        <SectionHeader title="حساب کاربری" />
        <AppCard padding="none">
          <ul class="divide-y divide-slate-100 dark:divide-slate-800">
            <li>
              <NuxtLink to="/account" class="flex w-full items-center gap-3 px-4 py-3.5 text-start transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 outline-none dark:hover:bg-slate-800/50 dark:focus-visible:bg-slate-800/50">
                <span class="flex size-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-400/10 dark:text-teal-300">
                  <Icon name="i-lucide-circle-user-round" class="size-4.5" />
                </span>
                <span class="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200">ویرایش پروفایل</span>
                <Icon name="i-lucide-chevron-left" class="size-4 text-slate-300 dark:text-slate-600" />
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/notifications" class="flex w-full items-center gap-3 px-4 py-3.5 text-start transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 outline-none dark:hover:bg-slate-800/50 dark:focus-visible:bg-slate-800/50">
                <span class="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300">
                  <Icon name="i-lucide-bell" class="size-4.5" />
                </span>
                <span class="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200">اعلان‌ها</span>
                <span
                  v-if="unreadCount"
                  class="flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-600 px-1.5 text-[10px] font-extrabold text-white dark:bg-teal-500"
                >
                  {{ toPersianDigits(unreadCount) }}
                </span>
                <Icon name="i-lucide-chevron-left" class="size-4 text-slate-300 dark:text-slate-600" />
              </NuxtLink>
            </li>
          </ul>
        </AppCard>
      </section>

      <!-- نمایش -->
      <section>
        <SectionHeader :title="t('common.appearance')" />
        <AppCard>
          <p class="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">حالت نمایش</p>
          <div class="grid grid-cols-3 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/60">
            <button
              v-for="option in themeOptions"
              :key="option.id"
              type="button"
              class="flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:ring-teal-500/60 outline-none"
              :class="mode === option.id
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'"
              :aria-pressed="mode === option.id"
              @click="setTheme(option.id)"
            >
              <Icon :name="option.icon" class="size-4" />
              {{ option.label }}
            </button>
          </div>
          <p class="mt-2.5 text-xs text-slate-400 dark:text-slate-500">
            حالت «سیستم» تم را با تنظیمات دستگاه شما هماهنگ می‌کند.
          </p>
        </AppCard>
      </section>

      <!-- درباره -->
      <section>
        <SectionHeader title="درباره هم‌ساختمان" />
        <AppCard>
          <div class="flex items-start gap-3">
            <span class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
              <Icon name="i-lucide-building-2" class="size-5" />
            </span>
            <div class="min-w-0">
              <p class="text-sm font-extrabold text-slate-900 dark:text-white">{{ t('app.name') }}</p>
              <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{{ t('app.tagline') }}</p>
              <p class="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400">
                هم‌ساختمان مدیریت شارژ، اطلاعیه‌ها، گزارش مشکلات و دایره خدمات ساختمان را
                ساده و شفاف می‌کند؛ برای مدیران و ساکنین، در یک اپ سبک و فارسی.
              </p>
              <p class="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                {{ t('common.appVersion', { version: toPersianDigits('1.0.0') }) }}
              </p>
            </div>
          </div>
        </AppCard>
      </section>

      <!-- خروج -->
      <section>
        <UButton
          color="error"
          variant="soft"
          size="lg"
          block
          icon="i-lucide-log-out"
          :label="t('common.logout')"
          @click="isLogoutDialogOpen = true"
        />
      </section>
    </template>

    <ConfirmDialog
      v-model:open="isLogoutDialogOpen"
      :title="t('common.logout')"
      description="آیا مطمئن هستید که می‌خواهید از حساب خود خارج شوید؟"
      tone="danger"
      :confirm-label="t('common.logout')"
      @confirm="onLogout"
    />
  </div>
</template>
