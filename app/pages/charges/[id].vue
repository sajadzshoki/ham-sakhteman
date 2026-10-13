<script setup lang="ts">
import type { BuildingMember } from '~/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { user, isManager } = useAuth()
const store = useAppStore()

const chargeId = computed(() => String(route.params.id))
const charge = computed(() => store.getCharge(chargeId.value))

useSeoMeta({
  title: () => charge.value?.title ?? 'شارژ',
  ogTitle: () => charge.value?.title ?? 'شارژ',
})

const building = computed(() => store.buildingOfUser(user.value))
const membership = computed(() => store.membershipOfUser(user.value))

const buildingMembers = computed(() =>
  building.value ? store.buildingMembers(building.value.id) : [],
)

const progress = computed(() => {
  if (!building.value) return { paid: 0, total: 0, collected: 0 }
  const chargePayments = charge.value ? store.chargePayments(charge.value.id) : []
  return {
    paid: chargePayments.length,
    total: store.chargePayerCount(building.value.id),
    collected: chargePayments.reduce((sum, payment) => sum + payment.amount, 0),
  }
})

const paymentOf = (memberId: string) =>
  charge.value ? store.chargePayments(charge.value.id).find(payment => payment.memberId === memberId) ?? null : null

const myPayment = computed(() =>
  membership.value ? paymentOf(membership.value.id) : null,
)

const myStatus = computed(() => {
  if (!charge.value || !membership.value) return 'unpaid'
  return store.chargeStatusFor(charge.value, membership.value.id)
})

function unitLabelOf(member: BuildingMember): string | null {
  if (!building.value || !member.unitId) return null
  const unit = store.buildingUnits(building.value.id).find(item => item.id === member.unitId)
  return unit ? `واحد ${toPersianDigits(unit.number)}` : null
}

// ——— ثبت پرداخت (مدیر) ———
const paymentMember = ref<BuildingMember | null>(null)
const isPaymentDialogOpen = ref(false)

function openPaymentDialog(member: BuildingMember) {
  paymentMember.value = member
  isPaymentDialogOpen.value = true
}

// ——— حذف پرداخت (مدیر) ———
const deletingPaymentId = ref<string | null>(null)
const isDeletePaymentOpen = ref(false)

function askDeletePayment(paymentId: string) {
  deletingPaymentId.value = paymentId
  isDeletePaymentOpen.value = true
}

async function confirmDeletePayment() {
  if (!deletingPaymentId.value) return
  const paymentId = deletingPaymentId.value
  deletingPaymentId.value = null
  try {
    await store.removePayment(paymentId)
    toast.add({ title: 'رکورد پرداخت حذف شد', color: 'success' })
  }
  catch (error) {
    toast.add({ title: apiErrorMessage(error, 'حذف پرداخت انجام نشد'), color: 'error' })
  }
}

// ——— حذف شارژ (مدیر) ———
const isDeleteChargeOpen = ref(false)

async function confirmDeleteCharge() {
  if (!charge.value) return
  try {
    await store.deleteCharge(charge.value.id)
    toast.add({ title: 'شارژ حذف شد', color: 'success' })
    await router.push('/charges')
  }
  catch (error) {
    toast.add({ title: apiErrorMessage(error, 'حذف شارژ انجام نشد'), color: 'error' })
  }
}
</script>

<template>
  <div class="space-y-5">
    <PageHeader title="جزئیات شارژ" />

    <!-- شارژ پیدا نشد -->
    <template v-if="!charge">
      <EmptyState
        icon="i-lucide-wallet"
        title="شارژ پیدا نشد"
        description="ممکن است این شارژ حذف شده باشد یا پیوند معتبر نباشد."
      >
        <template #action>
          <UButton color="primary" variant="solid" size="md" label="بازگشت به شارژها" icon="i-lucide-arrow-right" @click="router.push('/charges')" />
        </template>
      </EmptyState>
    </template>

    <template v-else>
      <!-- اطلاعات شارژ -->
      <AppCard as="article">
        <div class="flex items-center justify-between gap-2">
          <UBadge color="neutral" variant="subtle" size="sm" class="font-semibold">
            {{ charge.period }}
          </UBadge>
          <StatusBadge v-if="!isManager" :status="myStatus" />
        </div>

        <h1 class="mt-3 text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
          {{ charge.title }}
        </h1>

        <p class="mt-3 text-2xl font-extrabold text-teal-600 dark:text-teal-300">
          {{ formatPrice(charge.amount) }}
        </p>

        <div class="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-white/5 dark:text-slate-400">
          <p class="flex items-center gap-1.5">
            <Icon name="i-lucide-calendar-clock" class="size-4" />
            سررسید: {{ formatDate(charge.dueAt, 'full') }}
          </p>
          <p class="flex items-center gap-1.5">
            <Icon name="i-lucide-user-round" class="size-4" />
            ثبت‌شده توسط {{ charge.createdByName }}
          </p>
        </div>

        <p v-if="charge.notes" class="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-6 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
          {{ charge.notes }}
        </p>
      </AppCard>

      <!-- نمای ساکن: وضعیت پرداخت خودش -->
      <template v-if="!isManager && membership">
        <AppCard v-if="myPayment">
          <div class="flex items-start gap-3">
            <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300">
              <Icon name="i-lucide-badge-check" class="size-5" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-bold text-slate-800 dark:text-slate-100">پرداخت شما ثبت شده</p>
              <p class="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                {{ formatPrice(myPayment.amount) }} • {{ formatDate(myPayment.paidAt, 'full') }}
              </p>
              <p v-if="myPayment.note" class="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {{ myPayment.note }}
              </p>
            </div>
          </div>
        </AppCard>
        <AppCard v-else>
          <div class="flex items-start gap-3">
            <span
              class="flex size-10 shrink-0 items-center justify-center rounded-xl"
              :class="myStatus === 'overdue'
                ? 'bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-300'
                : 'bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300'"
            >
              <Icon name="i-lucide-wallet" class="size-5" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-bold text-slate-800 dark:text-slate-100">
                {{ myStatus === 'overdue' ? 'پرداخت شما به تأخیر افتاده است' : 'این شارژ هنوز پرداخت نشده' }}
              </p>
              <p class="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                برای پرداخت با مدیر ساختمان هماهنگ کنید. امکان پرداخت آنلاین به‌زودی اضافه می‌شود.
              </p>
            </div>
          </div>
        </AppCard>
      </template>

      <!-- نمای مدیر: وضعیت پرداخت اعضا -->
      <template v-else-if="isManager">
        <AppCard>
          <div class="flex items-center justify-between gap-2">
            <p class="text-sm font-bold text-slate-800 dark:text-slate-100">وضعیت پرداخت ساکنین</p>
            <p class="text-xs font-bold text-slate-500 dark:text-slate-400">
              جمع دریافتی: {{ formatPrice(progress.collected) }}
            </p>
          </div>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {{ toPersianDigits(progress.paid) }} از {{ toPersianDigits(progress.total) }} سهم پرداخت شده
          </p>

          <div class="mt-4 space-y-2.5">
            <div
              v-for="member in buildingMembers"
              :key="member.id"
              class="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60"
            >
              <div class="flex items-center justify-between gap-2">
                <div class="flex min-w-0 items-center gap-2.5">
                  <UserAvatar :name="member.name" size="sm" />
                  <div class="min-w-0">
                    <p class="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                      {{ member.name }}
                    </p>
                    <p class="text-[11px] text-slate-400 dark:text-slate-500">
                      {{ unitLabelOf(member) ?? (member.role === 'manager' ? 'مدیر ساختمان' : 'بدون واحد') }}
                    </p>
                  </div>
                </div>

                <template v-if="paymentOf(member.id)">
                  <span class="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-300">
                    <Icon name="i-lucide-circle-check" class="size-4" />
                    {{ formatDate(paymentOf(member.id)!.paidAt, 'short') }}
                  </span>
                </template>
                <UButton
                  v-else
                  color="primary"
                  variant="soft"
                  size="sm"
                  label="ثبت پرداخت"
                  icon="i-lucide-plus"
                  class="shrink-0"
                  @click="openPaymentDialog(member)"
                />
              </div>

              <div
                v-if="paymentOf(member.id)"
                class="mt-2 flex items-center justify-between gap-2 border-t border-slate-200/70 pt-2 dark:border-white/5"
              >
                <p class="min-w-0 truncate text-[11px] text-slate-500 dark:text-slate-400">
                  {{ formatPrice(paymentOf(member.id)!.amount) }}
                  <template v-if="paymentOf(member.id)!.note">
                    • {{ paymentOf(member.id)!.note }}
                  </template>
                </p>
                <button
                  type="button"
                  aria-label="حذف رکورد پرداخت"
                  class="shrink-0 text-slate-400 transition-colors hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400"
                  @click="askDeletePayment(paymentOf(member.id)!.id)"
                >
                  <Icon name="i-lucide-trash-2" class="size-4" />
                </button>
              </div>
            </div>
          </div>
        </AppCard>

        <div class="flex gap-2">
          <UButton
            color="error"
            variant="soft"
            size="md"
            block
            label="حذف شارژ"
            icon="i-lucide-trash-2"
            @click="isDeleteChargeOpen = true"
          />
          <UButton
            color="neutral"
            variant="ghost"
            size="md"
            label="بازگشت به شارژها"
            icon="i-lucide-arrow-right"
            class="shrink-0"
            @click="router.push('/charges')"
          />
        </div>
      </template>

      <UButton
        v-else
        color="neutral"
        variant="ghost"
        size="md"
        icon="i-lucide-arrow-right"
        label="بازگشت به شارژها"
        @click="router.push('/charges')"
      />

      <!-- دیالوگ‌ها -->
      <PaymentRecordDialog
        v-if="paymentMember && charge"
        v-model:open="isPaymentDialogOpen"
        :charge="charge"
        :member="paymentMember"
      />

      <ConfirmDialog
        v-model:open="isDeletePaymentOpen"
        title="حذف رکورد پرداخت"
        description="با حذف این رکورد، وضعیت پرداخت این عضو به «پرداخت نشده» برمی‌گردد. مطمئن هستید؟"
        confirm-label="حذف پرداخت"
        tone="danger"
        @confirm="confirmDeletePayment"
      />

      <ConfirmDialog
        v-model:open="isDeleteChargeOpen"
        title="حذف شارژ"
        description="این شارژ به همراه همه رکوردهای پرداختش حذف می‌شود. مطمئن هستید؟"
        confirm-label="حذف شارژ"
        tone="danger"
        @confirm="confirmDeleteCharge"
      />
    </template>
  </div>
</template>
