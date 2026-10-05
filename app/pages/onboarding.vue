<script setup lang="ts">
import type { Building, BuildingUnit, Invitation } from '~/types'

definePageMeta({ layout: 'auth' })

const router = useRouter()
const { user } = useAuth()
const store = useAppStore()
const toast = useToast()

useSeoMeta({ title: 'راه‌اندازی ساختمان', ogTitle: 'راه‌اندازی ساختمان' })

const steps = ['ساخت ساختمان', 'افزودن واحدها', 'دعوت ساکنان']
const step = ref(0)

const building = ref<Building | null>(null)
const invitation = ref<Invitation | null>(null)

// ——— مرحله ۱: ساخت ساختمان ———
const name = ref('')
const address = ref('')
const unitsCount = ref('12')
const description = ref('')
const nameError = ref('')
const addressError = ref('')
const unitsCountError = ref('')

function submitBuilding() {
  nameError.value = ''
  addressError.value = ''
  unitsCountError.value = ''

  if (!name.value.trim()) {
    nameError.value = 'نام ساختمان را وارد کنید.'
    return
  }
  if (!address.value.trim()) {
    addressError.value = 'آدرس ساختمان را وارد کنید.'
    return
  }
  const count = parseInteger(unitsCount.value, { min: 1, max: 500 })
  if (count === null) {
    unitsCountError.value = 'تعداد واحدها را با عدد معتبر وارد کنید.'
    return
  }

  if (!user.value) return

  if (building.value) {
    store.updateBuilding(building.value.id, {
      name: name.value.trim(),
      address: address.value.trim(),
      description: description.value.trim() || undefined,
    })
    if (store.buildingUnits(building.value.id).length !== count) {
      store.replaceGeneratedUnits(building.value.id, count)
    }
    building.value = store.buildingById(building.value.id)
  }
  else {
    building.value = store.createBuilding(
      { name: name.value, address: address.value, unitsCount: count, description: description.value || undefined },
      user.value,
    )
  }

  step.value = 1
}

function editBuildingInfo() {
  if (!building.value) return
  name.value = building.value.name
  address.value = building.value.address
  unitsCount.value = String(building.value.unitsCount)
  description.value = building.value.description ?? ''
  step.value = 0
}

// ——— مرحله ۲: واحدها ———
const isUnitDialogOpen = ref(false)
const unitToEdit = ref<BuildingUnit | null>(null)

function openAddUnit() {
  unitToEdit.value = null
  isUnitDialogOpen.value = true
}

function openEditUnit(unit: BuildingUnit) {
  unitToEdit.value = unit
  isUnitDialogOpen.value = true
}

// ——— مرحله ۳: دعوت ———
function goToInviteStep() {
  if (building.value && user.value && !invitation.value) {
    invitation.value = store.createInvitation(building.value.id, 'resident', user.value.id)
  }
  step.value = 2
}

function finish() {
  toast.add({ title: 'ساختمان شما آماده است 🎉', description: 'ساکنین را با کد دعوت اضافه کنید.', color: 'success' })
  router.push('/building')
}
</script>

<template>
  <div v-if="user" class="space-y-5">
    <div class="space-y-1 text-center">
      <h1 class="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">راه‌اندازی ساختمان</h1>
      <p class="text-sm text-slate-500 dark:text-slate-400">در سه مرحله ساختمان خود را آماده کنید</p>
    </div>

    <AppStepper :steps="steps" :current="step" />

    <!-- مرحله ۱: ساخت ساختمان -->
    <AppCard v-if="step === 0" as="section">
      <form class="space-y-4" @submit.prevent="submitBuilding">
        <BaseTextField
          v-model="name"
          label="نام ساختمان"
          required
          icon="i-lucide-building-2"
          placeholder="مثلاً: ساختمان آسمان"
          :error="nameError"
          @update:model-value="nameError = ''"
        />
        <BaseTextField
          v-model="address"
          label="آدرس"
          required
          icon="i-lucide-map-pin"
          placeholder="شهر، محله، خیابان، پلاک"
          :error="addressError"
          @update:model-value="addressError = ''"
        />
        <BaseTextField
          v-model="unitsCount"
          label="تعداد واحدها"
          required
          type="text"
          inputmode="numeric"
          dir="ltr"
          icon="i-lucide-door-open"
          hint="واحدها به‌صورت خودکار ساخته می‌شوند (هر طبقه ۲ واحد)"
          :error="unitsCountError"
          @update:model-value="unitsCountError = ''"
        />
        <BaseTextAreaField
          v-model="description"
          label="توضیحات"
          hint="اختیاری"
          placeholder="مثلاً: ساختمان مسکونی ۶ طبقه با لابی و پارکینگ…"
        />
        <UButton
          type="submit"
          color="primary"
          variant="solid"
          size="lg"
          block
          :label="building ? 'ذخیره و ادامه' : 'ساخت ساختمان'"
        />
      </form>
    </AppCard>

    <!-- مرحله ۲: افزودن واحدها -->
    <div v-else-if="step === 1 && building" class="space-y-3">
      <AppCard padding="none">
        <ul class="max-h-72 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
          <li
            v-for="unit in store.buildingUnits(building.id)"
            :key="unit.id"
            class="flex items-center gap-3 px-4 py-3"
          >
            <span class="flex size-9 items-center justify-center rounded-xl bg-teal-50 text-sm font-extrabold text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">
              {{ toPersianDigits(unit.number) }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-bold text-slate-800 dark:text-slate-100">واحد {{ toPersianDigits(unit.number) }}</p>
              <p class="text-xs text-slate-500 dark:text-slate-400">طبقه {{ toPersianDigits(unit.floor) }}</p>
            </div>
            <UButton color="neutral" variant="ghost" size="sm" icon="i-lucide-pencil" aria-label="ویرایش واحد" @click="openEditUnit(unit)" />
          </li>
        </ul>
      </AppCard>

      <UButton color="neutral" variant="soft" size="md" block icon="i-lucide-plus" label="افزودن واحد" @click="openAddUnit" />

      <div class="flex w-full gap-2">
        <UButton color="primary" variant="solid" size="lg" block icon="i-lucide-arrow-left" label="ادامه — دعوت ساکنان" @click="goToInviteStep" />
        <UButton color="neutral" variant="soft" size="lg" label="مرحله قبل" @click="editBuildingInfo" />
      </div>
    </div>

    <!-- مرحله ۳: دعوت ساکنان -->
    <div v-else-if="step === 2 && building && invitation" class="space-y-3">
      <InvitationCard :invitation="invitation" :building="building" />
      <UButton color="primary" variant="solid" size="lg" block icon="i-lucide-party-popper" label="پایان — ورود به ساختمان" @click="finish" />
      <button type="button" class="block w-full text-center text-xs font-semibold text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300" @click="step = 1">
        مرحله قبل
      </button>
    </div>

    <UnitFormDialog v-if="building" v-model:open="isUnitDialogOpen" :building-id="building.id" :unit="unitToEdit" />
  </div>
</template>
