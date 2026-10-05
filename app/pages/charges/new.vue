<script setup lang="ts">
const router = useRouter()
const toast = useToast()
const { user } = useAuth()
const store = useAppStore()

useSeoMeta({
  title: 'ایجاد شارژ',
  ogTitle: 'ایجاد شارژ',
})

const building = computed(() => store.buildingOfUser(user.value))

const title = ref('')
const period = ref('')
const amount = ref('')
const dueAt = ref('')
const notes = ref('')

const titleError = ref('')
const periodError = ref('')
const amountError = ref('')
const dueAtError = ref('')

const saving = ref(false)

function submit() {
  if (saving.value) return
  titleError.value = title.value.trim() ? '' : 'عنوان شارژ را وارد کنید.'
  periodError.value = period.value.trim() ? '' : 'دوره شارژ را وارد کنید.'

  const parsedAmount = parseAmount(amount.value)
  amountError.value = parsedAmount !== null ? '' : 'مبلغ را با عدد معتبر وارد کنید.'

  const isoDate = isoFromDateString(dueAt.value)
  dueAtError.value = isoDate ? '' : 'تاریخ سررسید را مشخص کنید.'

  if (titleError.value || periodError.value || amountError.value || dueAtError.value) return
  if (!building.value || !user.value || parsedAmount === null || !isoDate) return

  saving.value = true

  const charge = store.createCharge(
    building.value.id,
    { title: title.value, period: period.value, amount: parsedAmount, dueAt: isoDate, notes: notes.value },
    { id: user.value.id, name: user.value.name },
  )
  toast.add({ title: 'شارژ ایجاد شد و ساکنین آن را می‌بینند', color: 'success' })
  router.push(`/charges/${charge.id}`)
}

function onCancel() {
  router.push('/charges')
}
</script>

<template>
  <div class="space-y-5">
    <PageHeader title="ایجاد شارژ" description="هر عضو ساختمان یک سهم با مبلغ یکسان دارد" />

    <AppCard>
      <form class="space-y-5" novalidate @submit.prevent="submit">
        <BaseTextField
          v-model="title"
          label="عنوان"
          placeholder="مثلاً: شارژ ماهانه"
          icon="i-lucide-wallet"
          required
          :error="titleError"
        />

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <BaseTextField
            v-model="period"
            label="دوره"
            placeholder="مثلاً: شهریور ۱۴۰۵"
            required
            :error="periodError"
          />
          <BaseTextField
            v-model="dueAt"
            label="تاریخ سررسید"
            type="date"
            dir="ltr"
            required
            :error="dueAtError"
          />
        </div>

        <BaseTextField
          v-model="amount"
          label="مبلغ هر واحد (تومان)"
          placeholder="مثلاً: ۸۵۰٬۰۰۰"
          required
          :error="amountError"
        />

        <BaseTextAreaField
          v-model="notes"
          label="توضیحات"
          placeholder="اختیاری — مثلاً شامل چه هزینه‌هایی است"
          :rows="3"
        />

        <div class="flex gap-2 pt-1">
          <UButton
            type="submit"
            color="primary"
            variant="solid"
            size="lg"
            block
            :loading="saving"
            icon="i-lucide-plus"
            label="ایجاد شارژ"
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
