<script setup lang="ts">
import type { Expense } from '~/types'
import { expenseCategoryOf } from '~/data/mock'

const router = useRouter()
const { user, isManager } = useAuth()
const store = useAppStore()
const toast = useToast()

useSeoMeta({
  title: 'هزینه‌های ساختمان',
  ogTitle: 'هزینه‌های ساختمان',
})

const building = computed(() => store.buildingOfUser(user.value))

const expenses = computed(() =>
  building.value ? store.buildingExpenses(building.value.id) : [],
)

const totalAmount = computed(() =>
  expenses.value.reduce((sum, item) => sum + item.amount, 0),
)

// ——— حذف هزینه (مدیر) ———
const deletingExpense = ref<Expense | null>(null)
const isDeleteOpen = ref(false)

function askDelete(expense: Expense) {
  deletingExpense.value = expense
  isDeleteOpen.value = true
}

async function confirmDelete() {
  const target = deletingExpense.value
  if (!target) return
  deletingExpense.value = null
  try {
    await store.deleteExpense(target.id)
    removeImage(target.receipt)
    toast.add({ title: 'هزینه حذف شد', color: 'success' })
  }
  catch (error) {
    toast.add({ title: apiErrorMessage(error, 'حذف هزینه انجام نشد'), color: 'error' })
  }
}

function goNew() {
  router.push('/expenses/new')
}
</script>

<template>
  <div class="space-y-5">
    <PageHeader
      title="هزینه‌های ساختمان"
      description="هزینه‌های پرداخت‌شده برای نگهداری ساختمان"
    >
      <template v-if="isManager" #actions>
        <UButton color="primary" variant="solid" size="md" label="ثبت هزینه" icon="i-lucide-plus" @click="goNew" />
      </template>
    </PageHeader>

    <LoadingState v-if="!building" :rows="3" />

    <template v-else-if="expenses.length">
      <AppCard>
        <div class="flex items-center justify-between gap-2">
          <p class="text-xs font-medium text-slate-500 dark:text-slate-400">مجموع هزینه‌های ثبت‌شده</p>
          <p class="text-base font-extrabold text-slate-900 dark:text-white">
            {{ formatPrice(totalAmount) }}
          </p>
        </div>
      </AppCard>

      <div class="space-y-3">
        <AppCard v-for="expense in expenses" :key="expense.id" as="article">
          <div class="flex items-start gap-3">
            <span class="flex size-10 shrink-0 items-center justify-center rounded-xl" :class="expenseCategoryOf(expense.category).tint">
              <Icon :name="expenseCategoryOf(expense.category).icon" class="size-5" />
            </span>
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-2">
                <p class="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{{ expense.title }}</p>
                <p class="shrink-0 text-sm font-extrabold text-slate-900 dark:text-white">
                  {{ formatPrice(expense.amount) }}
                </p>
              </div>
              <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {{ expenseCategoryOf(expense.category).label }}
                •
                {{ formatDate(expense.date, 'full') }}
              </p>
              <p v-if="expense.notes" class="mt-1 line-clamp-2 text-xs leading-5 text-slate-400 dark:text-slate-500">
                {{ expense.notes }}
              </p>
              <AppImage
                v-if="expense.receipt"
                :src="expense.receipt"
                :alt="`رسید ${expense.title}`"
                aspect="aspect-[3/1.2]"
                class="mt-3"
              />
            </div>
            <button
              v-if="isManager"
              type="button"
              aria-label="حذف هزینه"
              class="shrink-0 self-start text-slate-300 transition-colors hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400"
              @click="askDelete(expense)"
            >
              <Icon name="i-lucide-trash-2" class="size-4" />
            </button>
          </div>
        </AppCard>
      </div>
    </template>

    <EmptyState
      v-else
      icon="i-lucide-receipt-text"
      title="هنوز هزینه‌ای ثبت نشده"
      :description="isManager
        ? 'هزینه‌های ساختمان را ثبت کنید تا ساکنین در جریان شفاف مالی قرار بگیرند.'
        : 'وقتی مدیر ساختمان هزینه‌ای ثبت کند، اینجا نمایش داده می‌شود.'"
    >
      <template v-if="isManager" #action>
        <UButton color="primary" variant="solid" size="md" label="ثبت هزینه" icon="i-lucide-plus" @click="goNew" />
      </template>
    </EmptyState>

    <ConfirmDialog
      v-model:open="isDeleteOpen"
      title="حذف هزینه"
      :description="`«${deletingExpense?.title ?? ''}» حذف می‌شود. مطمئن هستید؟`"
      confirm-label="حذف هزینه"
      tone="danger"
      @confirm="confirmDelete"
    />
  </div>
</template>
