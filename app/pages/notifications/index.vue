<script setup lang="ts">
import type { NotificationType } from '~/types'

const router = useRouter()
const { user } = useAuth()
const store = useAppStore()
const toast = useToast()

useSeoMeta({
  title: 'اعلان‌ها',
  ogTitle: 'اعلان‌ها',
})

// داده اعلان‌ها فقط-کلاینت است؛ سرور اسکلت می‌سازد تا هیدریشن هم‌خوان بماند
const ready = ref(false)
onMounted(() => { ready.value = true })

const notifications = computed(() => (user.value ? store.notificationsFor(user.value.id) : []))
const unreadCount = computed(() => notifications.value.filter(item => !item.readAt).length)

interface TypeMeta {
  icon: string
  tint: string
}

const typeMeta: Record<NotificationType, TypeMeta> = {
  announcement: { icon: 'i-lucide-megaphone', tint: 'bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300' },
  'announcement-important': { icon: 'i-lucide-megaphone', tint: 'bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-300' },
  'problem-new': { icon: 'i-lucide-circle-alert', tint: 'bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-300' },
  'problem-status': { icon: 'i-lucide-history', tint: 'bg-sky-50 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300' },
  'charge-new': { icon: 'i-lucide-wallet', tint: 'bg-teal-50 text-teal-600 dark:bg-teal-400/10 dark:text-teal-300' },
  'payment-recorded': { icon: 'i-lucide-badge-check', tint: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300' },
}

async function openNotification(id: string) {
  const item = notifications.value.find(notification => notification.id === id)
  if (!item) return
  try {
    await store.markNotificationRead(id)
  }
  catch (error) {
    toast.add({ title: apiErrorMessage(error, 'به‌روزرسانی اعلان انجام نشد'), color: 'error' })
  }
  if (item.link) await router.push(item.link)
}

async function markAllRead() {
  if (!user.value) return
  try {
    await store.markAllNotificationsRead()
    toast.add({ title: 'همه اعلان‌ها خوانده شد', color: 'success' })
  }
  catch (error) {
    toast.add({ title: apiErrorMessage(error, 'به‌روزرسانی اعلان‌ها انجام نشد'), color: 'error' })
  }
}
</script>

<template>
  <div class="space-y-5">
    <PageHeader
      title="اعلان‌ها"
      :description="unreadCount > 0 ? `${toPersianDigits(unreadCount)} اعلان خوانده‌نشده` : 'همه اعلان‌ها خوانده شده‌اند'">
      <template v-if="unreadCount > 0" #actions>
        <UButton
          color="neutral"
          variant="soft"
          size="md"
          icon="i-lucide-check-check"
          label="خواندن همه"
          @click="markAllRead"
        />
      </template>
    </PageHeader>

    <AppCard v-if="!ready">
      <LoadingState :rows="3" />
    </AppCard>

    <EmptyState
      v-else-if="notifications.length === 0"
      icon="i-lucide-bell-off"
      title="اعلانی ندارید"
      description="رویدادهای ساختمان مانند اطلاعیه‌ها، شارژها و گزارش‌ها اینجا اطلاع‌رسانی می‌شوند."
    />

    <div v-else class="space-y-3">
      <button
        v-for="item in notifications"
        :key="item.id"
        type="button"
        class="w-full rounded-2xl bg-white p-4 text-start shadow-sm ring-1 transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-teal-500/60 outline-none dark:bg-slate-900"
        :class="item.readAt ? 'ring-slate-950/5 dark:ring-white/10' : 'ring-teal-600/25 dark:ring-teal-400/25'"
        @click="openNotification(item.id)"
      >
        <div class="flex items-start gap-3">
          <span class="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl" :class="typeMeta[item.type].tint">
            <Icon :name="typeMeta[item.type].icon" class="size-5" />
          </span>
          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-2">
              <p
                class="min-w-0 flex-1 text-sm leading-6"
                :class="item.readAt
                  ? 'font-medium text-slate-600 dark:text-slate-300'
                  : 'font-bold text-slate-900 dark:text-white'"
              >
                {{ item.title }}
              </p>
              <span
                v-if="!item.readAt"
                class="mt-1.5 size-2 shrink-0 rounded-full bg-teal-500"
                aria-label="خوانده‌نشده"
              />
            </div>
            <p v-if="item.body" class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {{ item.body }}
            </p>
            <p class="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
              {{ formatRelative(item.createdAt) }}
            </p>
          </div>
          <Icon v-if="item.link" name="i-lucide-chevron-left" class="mt-1 size-4 shrink-0 text-slate-300 dark:text-slate-600" />
        </div>
      </button>
    </div>
  </div>
</template>
