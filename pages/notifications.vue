<script setup lang="ts">
const { t } = useI18n()
const auth = useAuth()
const { notifications, refresh, markRead, markAllRead } = useNotifications()

const unreadCount = computed(() => notifications.value.filter(n => n.unread).length)
const byType = computed(() => ({ announcement: notifications.value.filter(n => n.type === 'announcement'), problem: notifications.value.filter(n => n.type === 'problem'), charge: notifications.value.filter(n => n.type === 'charge'), service: notifications.value.filter(n => n.type === 'service') }))
</script>

<template>
  <div>
    <AppHeader title="اعلان‌ها" subtitle="اطلاعیه‌ها و هشدارها" back />

    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span v-if="unreadCount" class="w-6 h-6 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-soft">{{ unreadCount }}</span>
        <span class="text-xs text-slate-400 font-medium">{{ unreadCount > 0 ? unreadCount + ' خوانده نشده' : 'همه خوانده شده' }}</span>
      </div>
      <button v-if="unreadCount > 0" @click="markAllRead" class="text-xs font-extrabold text-primary-600 hover:text-primary-700">خواندن همه</button>
    </div>

    <div v-for="group in [
      { key: 'announcement', label: 'اطلاعیه', icon: 'i-lucide-bell' },
      { key: 'problem', label: 'گزارش مشکل', icon: 'i-lucide-wrench' },
      { key: 'charge', label: 'شارژ', icon: 'i-lucide-wallet' },
      { key: 'service', label: 'خدمات', icon: 'i-lucide-building-2' },
    ]" :key="group.key" class="mb-6">
      <SectionHeader :title="group.label" v-if="byType[group.key].length" />
      <div class="flex flex-col gap-2">
        <AppCard v-for="n in byType[group.key]" :key="n.id" padding="md" hover @click="n.link ? navigateTo(n.link) : null">
          <div class="flex items-start gap-3" @click="markRead(n.id)">
            <button @click.stop="markRead(n.id)" class="shrink-0 w-9 h-9 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:text-primary-600 transition-colors" aria-label="mark read">
              <Icon :name="n.unread ? 'i-lucide-circle' : 'i-lucide-check-circle-2'" class="w-5 h-5" />
            </button>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 mb-0.5">
                <h4 class="text-sm font-extrabold text-slate-900 leading-snug" :class="n.unread ? 'text-slate-900' : 'text-slate-500'">{{ n.title }}</h4>
                <span v-if="n.unread" class="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              </div>
              <p class="text-xs text-slate-400 font-medium truncate">{{ n.message }}</p>
              <div class="text-[10px] text-slate-300 font-medium mt-0.5">{{ n.time }}</div>
            </div>
          </div>
        </AppCard>
      </div>
      <EmptyState v-if="!byType[group.key].length" :title="group.label + ' ندارید'" message="هنوز اعلانی در این دسته ثبت نشده." />
    </div>

    <div v-if="notifications.length === 0" class="pt-10">
      <EmptyState title="اعلانی ندارید" message="هنوز هیچ اطلاعیه‌ای ثبت نشده است." />
    </div>
  </div>
</template>
