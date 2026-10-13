<script setup lang="ts">
import type { ProblemStatus } from '~/types'
import { problemCategoryOf, problemStatusFilters } from '~/data/mock'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { user, isManager } = useAuth()
const store = useAppStore()

const problemId = computed(() => String(route.params.id))
const problem = computed(() => store.getProblem(problemId.value))

/** ساکن فقط گزارش‌های خودش را می‌بیند؛ مدیر همه را */
const canView = computed(() => {
  if (!problem.value || !user.value) return false
  return isManager.value || problem.value.reportedBy === user.value.id
})

// عنوان فقط برای کاربر مجاز افشا می‌شود تا محتوای گزارش بدون دسترسی در متا نشت نکند
useSeoMeta({
  title: () => (canView.value && problem.value ? problem.value.title : 'گزارش مشکل'),
  ogTitle: () => (canView.value && problem.value ? problem.value.title : 'گزارش مشکل'),
})

const categoryMeta = computed(() => problem.value ? problemCategoryOf(problem.value.category) : null)

const statusOptions: { id: ProblemStatus; label: string; icon: string }[] = [
  { id: 'new', label: 'جدید', icon: 'i-lucide-circle-alert' },
  { id: 'in-progress', label: 'در حال پیگیری', icon: 'i-lucide-clock' },
  { id: 'resolved', label: 'حل شده', icon: 'i-lucide-circle-check' },
]

function statusLabel(status: ProblemStatus): string {
  return problemStatusFilters.find(item => item.id === status)?.label ?? status
}

async function changeStatus(status: ProblemStatus) {
  if (!problem.value || problem.value.status === status) return
  try {
    await store.updateProblemStatus(problem.value.id, status)
    toast.add({ title: `وضعیت گزارش به «${statusLabel(status)}» تغییر کرد`, color: 'success' })
  }
  catch (error) {
    toast.add({ title: apiErrorMessage(error, 'تغییر وضعیت انجام نشد'), color: 'error' })
  }
}
</script>

<template>
  <div class="space-y-5">
    <PageHeader title="جزئیات گزارش" />

    <!-- گزارش پیدا نشد -->
    <template v-if="!problem">
      <EmptyState
        icon="i-lucide-circle-alert"
        title="گزارش پیدا نشد"
        description="ممکن است این گزارش حذف شده باشد یا پیوند معتبر نباشد."
      >
        <template #action>
          <UButton color="primary" variant="solid" size="md" label="بازگشت به مشکلات" icon="i-lucide-arrow-right" @click="router.push('/problems')" />
        </template>
      </EmptyState>
    </template>

    <!-- دسترسی مجاز نیست -->
    <template v-else-if="!canView">
      <EmptyState
        icon="i-lucide-shield-alert"
        title="دسترسی مجاز نیست"
        description="فقط ثبت‌کننده گزارش و مدیر ساختمان می‌توانند این گزارش را ببینند."
      >
        <template #action>
          <UButton color="primary" variant="solid" size="md" label="بازگشت به مشکلات" icon="i-lucide-arrow-right" @click="router.push('/problems')" />
        </template>
      </EmptyState>
    </template>

    <!-- محتوای گزارش -->
    <template v-else>
      <AppCard as="article">
        <div class="flex items-center justify-between gap-2">
          <span class="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold" :class="categoryMeta?.tint">
            <Icon :name="categoryMeta?.icon ?? 'i-lucide-ellipsis'" class="size-3.5" />
            {{ categoryMeta?.label }}
          </span>
          <StatusBadge :status="problem.status" :label="statusLabel(problem.status)" />
        </div>

        <h1 class="mt-3 text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
          {{ problem.title }}
        </h1>

        <AppImage
          v-if="problem.image"
          :src="problem.image"
          :alt="problem.title"
          aspect="aspect-[2/1]"
          class="mt-4"
        />

        <p class="mt-4 text-sm leading-7 whitespace-pre-line text-slate-600 dark:text-slate-300">
          {{ problem.description }}
        </p>

        <div class="mt-5 space-y-1.5 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-white/5 dark:text-slate-400">
          <p class="flex items-center gap-1.5">
            <Icon name="i-lucide-user-round" class="size-4" />
            گزارش‌دهنده: {{ problem.reportedByName }}
          </p>
          <p class="flex items-center gap-1.5">
            <Icon name="i-lucide-calendar-clock" class="size-4" />
            ثبت‌شده: {{ formatDate(problem.createdAt, 'withTime') }}
          </p>
          <p v-if="problem.updatedAt" class="flex items-center gap-1.5">
            <Icon name="i-lucide-history" class="size-4" />
            آخرین به‌روزرسانی: {{ formatDate(problem.updatedAt, 'withTime') }}
          </p>
        </div>
      </AppCard>

      <!-- تغییر وضعیت — فقط مدیر -->
      <AppCard v-if="isManager">
        <p class="text-sm font-bold text-slate-800 dark:text-slate-100">تغییر وضعیت رسیدگی</p>
        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
          با تغییر وضعیت، ثبت‌کننده گزارش از روند پیگیری باخبر می‌شود.
        </p>
        <div class="mt-4 grid grid-cols-3 gap-2">
          <button
            v-for="option in statusOptions"
            :key="option.id"
            type="button"
            class="flex flex-col items-center gap-1.5 rounded-xl px-1 py-3 ring-1 transition-colors"
            :class="problem.status === option.id
              ? 'bg-teal-600 text-white ring-teal-600 dark:bg-teal-500 dark:ring-teal-500'
              : 'bg-white text-slate-600 ring-slate-200 hover:ring-teal-300 dark:bg-slate-900 dark:text-slate-300 dark:ring-white/10 dark:hover:ring-teal-500/60'"
            @click="changeStatus(option.id)"
          >
            <Icon :name="option.icon" class="size-5" />
            <span class="text-[11px] font-bold">{{ option.label }}</span>
          </button>
        </div>
      </AppCard>

      <UButton
        color="neutral"
        variant="ghost"
        size="md"
        icon="i-lucide-arrow-right"
        label="بازگشت به مشکلات"
        @click="router.push('/problems')"
      />
    </template>
  </div>
</template>
