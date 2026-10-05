<script setup lang="ts">
import type { BuildingCharge, BuildingMember } from '~/types'

/** ثبت دستی پرداخت شارژ یک عضو توسط مدیر — معماری برای پرداخت آنلاین آینده باز است */
const props = defineProps<{
  charge: BuildingCharge
  member: BuildingMember
}>()

const emit = defineEmits<{ saved: [] }>()

const store = useAppStore()
const toast = useToast()
const { user } = useAuth()

const open = defineModel<boolean>('open', { default: false })

const amount = ref('')
const paidAt = ref('')
const note = ref('')
const amountError = ref('')
const dateError = ref('')
const saving = ref(false)

watch(open, (value) => {
  if (!value) return
  saving.value = false
  amount.value = String(props.charge.amount)
  paidAt.value = dateInputValue(new Date())
  note.value = ''
  amountError.value = ''
  dateError.value = ''
})

function submit() {
  if (saving.value) return
  amountError.value = ''
  dateError.value = ''

  const parsedAmount = parseAmount(amount.value)
  if (parsedAmount === null) {
    amountError.value = 'مبلغ را با عدد معتبر وارد کنید.'
    return
  }

  const isoDate = isoFromDateString(paidAt.value)
  if (!isoDate) {
    dateError.value = 'تاریخ پرداخت را مشخص کنید.'
    return
  }

  if (!user.value) return
  saving.value = true
  const payment = store.recordPayment(
    props.charge,
    props.member,
    { amount: parsedAmount, paidAt: isoDate, note: note.value },
    { id: user.value.id },
  )

  if (!payment) {
    saving.value = false
    toast.add({ title: 'برای این عضو قبلاً پرداخت ثبت شده است', color: 'error' })
    return
  }

  toast.add({ title: `پرداخت ${props.member.name} ثبت شد`, color: 'success' })
  open.value = false
  emit('saved')
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="ثبت پرداخت"
    :description="`${member.name} • ${charge.title} (${charge.period})`"
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <form class="space-y-4" @submit.prevent="submit">
        <BaseTextField
          v-model="amount"
          label="مبلغ پرداختی (تومان)"
          required
          placeholder="مثلاً: ۸۵۰٬۰۰۰"
          :error="amountError"
          @update:model-value="amountError = ''"
        />
        <BaseTextField
          v-model="paidAt"
          label="تاریخ پرداخت"
          required
          type="date"
          dir="ltr"
          :error="dateError"
          @update:model-value="dateError = ''"
        />
        <BaseTextField
          v-model="note"
          label="یادداشت"
          placeholder="اختیاری — مثلاً: کارت به کارت"
        />
        <div class="flex w-full flex-row-reverse gap-2">
          <UButton type="submit" color="primary" variant="solid" size="md" block label="ثبت پرداخت" icon="i-lucide-badge-check" :loading="saving" />
          <UButton type="button" color="neutral" variant="soft" size="md" block label="انصراف" @click="open = false" />
        </div>
      </form>
    </template>
  </UModal>
</template>
