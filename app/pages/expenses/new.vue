<script setup lang="ts">
import type { ExpenseCategory } from '~/types'
import { expenseCategories } from '~/data/mock'

const router = useRouter()
const toast = useToast()
const { user } = useAuth()
const store = useAppStore()

useSeoMeta({
  title: 'ثبت هزینه',
  ogTitle: 'ثبت هزینه',
})

const building = computed(() => store.buildingOfUser(user.value))

const title = ref('')
const amount = ref('')
const category = ref<ExpenseCategory | null>(null)
const date = ref('')
const notes = ref('')
const receipt = ref<string | undefined>(undefined)

const titleError = ref('')
const amountError = ref('')
const categoryError = ref('')
const dateError = ref('')

onMounted(() => {
  date.value = dateInputValue(new Date())
})

const saving = ref(false)

function submit() {
  if (saving.value) return
  titleError.value = title.value.trim() ? '' : 'عنوان هزینه را وارد کنید.'

  const parsedAmount = parseAmount(amount.value)
  amountError.value = parsedAmount !== null ? '' : 'مبلغ را با عدد معتبر وارد کنید.'
  categoryError.value = category.value ? '' : 'دسته‌بندی هزینه را انتخاب کنید.'

  const isoDate = isoFromDateString(date.value)
  dateError.value = isoDate ? '' : 'تاریخ هزینه را مشخص کنید.'

  if (titleError.value || amountError.value || categoryError.value || dateError.value) return
  if (!building.value || !user.value || parsedAmount === null || !isoDate || !category.value) return

  saving.value = true

  const receiptKey = resolveImagePayload(receipt.value)
  store.createExpense(
    building.value.id,
    {
      title: title.value,
      amount: parsedAmount,
      category: category.value,
      date: isoDate,
      notes: notes.value,
      receipt: receiptKey,
    },
    { id: user.value.id, name: user.value.name },
  )
  toast.add({ title: 'هزینه ثبت شد و ساکنین آن را می‌بینند', color: 'success' })
  router.push('/expenses')
}

function onCancel() {
  router.push('/expenses')
}
</script>

<template>
  <div class="space-y-5">
    <PageHeader title="ثبت هزینه" description="هزینه برای همه ساکنین به‌صورت شفاف نمایش داده می‌شود" />

    <AppCard>
      <form class="space-y-5" novalidate @submit.prevent="submit">
        <BaseTextField
          v-model="title"
          label="عنوان"
          placeholder="مثلاً: قبض برق مشاعات"
          icon="i-lucide-receipt-text"
          required
          :error="titleError"
        />

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <BaseTextField
            v-model="amount"
            label="مبلغ (تومان)"
            placeholder="مثلاً: ۴۸۰٬۰۰۰"
            required
            :error="amountError"
          />
          <BaseTextField
            v-model="date"
            label="تاریخ"
            type="date"
            dir="ltr"
            required
            :error="dateError"
          />
        </div>

        <UFormField label="دسته‌بندی" size="lg" :error="categoryError || undefined" required class="w-full">
          <div class="grid w-full grid-cols-3 gap-2 sm:grid-cols-4">
            <button
              v-for="option in expenseCategories"
              :key="option.id"
              type="button"
              class="flex flex-col items-center gap-1.5 rounded-xl px-1 py-3 ring-1 transition-colors"
              :class="category === option.id
                ? 'bg-teal-600 text-white ring-teal-600 dark:bg-teal-500 dark:ring-teal-500'
                : 'bg-white text-slate-600 ring-slate-200 hover:ring-teal-300 dark:bg-slate-900 dark:text-slate-300 dark:ring-white/10 dark:hover:ring-teal-500/60'"
              @click="category = option.id"
            >
              <span class="flex size-9 items-center justify-center rounded-lg" :class="category === option.id ? 'bg-white/15' : option.tint">
                <Icon :name="option.icon" class="size-5" />
              </span>
              <span class="text-[11px] font-bold">{{ option.label }}</span>
            </button>
          </div>
        </UFormField>

        <BaseTextAreaField
          v-model="notes"
          label="توضیحات"
          placeholder="اختیاری — جزئیات هزینه را بنویسید"
          :rows="3"
        />

        <BaseImageField v-model="receipt" label="تصویر رسید" hint="اختیاری — عکس رسید را برای شفافیت بیشتر نگه دارید" />

        <div class="flex gap-2 pt-1">
          <UButton
            type="submit"
            color="primary"
            variant="solid"
            size="lg"
            block
            icon="i-lucide-plus"
            label="ثبت هزینه"
            :loading="saving"
          />
          <UButton
            type="button"
            color="neutral"
            variant="soft"
            size="lg"
            label="انصراف"
            class="shrink-0"
            @click="onCancel"
          />
        </div>
      </form>
    </AppCard>
  </div>
</template>
