<script setup lang="ts">
import type { BuildingUnit } from '~/types'

const toast = useToast()
const { user, isManager } = useAuth()
const store = useAppStore()

useSeoMeta({ title: 'واحدها', ogTitle: 'واحدها' })

const building = computed(() => store.buildingOfUser(user.value))
const units = computed(() => (building.value ? store.buildingUnits(building.value.id) : []))

const occupiedCount = computed(
  () => units.value.filter(unit => store.memberOfUnit(unit.id)).length,
)

// ——— افزودن/ویرایش واحد ———
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

// ——— تخصیص ساکن ———
const isAssignDialogOpen = ref(false)
const unitToAssign = ref<BuildingUnit | null>(null)

function openAssign(unit: BuildingUnit) {
  unitToAssign.value = unit
  isAssignDialogOpen.value = true
}

// ——— حذف واحد ———
const isRemoveDialogOpen = ref(false)
const unitToRemove = ref<BuildingUnit | null>(null)

function askRemove(unit: BuildingUnit) {
  unitToRemove.value = unit
  isRemoveDialogOpen.value = true
}

async function confirmRemove() {
  if (!unitToRemove.value) return
  try {
    await store.deleteUnit(unitToRemove.value.id)
    toast.add({ title: 'واحد حذف شد', color: 'success' })
  }
  catch (error) {
    toast.add({ title: apiErrorMessage(error, 'حذف واحد انجام نشد'), color: 'error' })
  }
}
</script>

<template>
  <div v-if="building" class="space-y-7">
    <PageHeader title="واحدها" :description="`مدیریت واحدهای ${building.name}`">
      <template #actions>
        <UButton
          v-if="isManager"
          color="primary"
          variant="solid"
          size="md"
          icon="i-lucide-plus"
          label="افزودن واحد"
          @click="openAddUnit"
        />
      </template>
    </PageHeader>

    <!-- خلاصه -->
    <section class="grid grid-cols-3 gap-2.5">
      <AppCard padding="sm" class="text-center">
        <p class="text-lg font-extrabold text-slate-900 dark:text-white">{{ toPersianDigits(units.length) }}</p>
        <p class="text-[11px] font-semibold text-slate-500 dark:text-slate-400">کل واحدها</p>
      </AppCard>
      <AppCard padding="sm" class="text-center">
        <p class="text-lg font-extrabold text-teal-600 dark:text-teal-300">{{ toPersianDigits(occupiedCount) }}</p>
        <p class="text-[11px] font-semibold text-slate-500 dark:text-slate-400">دارای ساکن</p>
      </AppCard>
      <AppCard padding="sm" class="text-center">
        <p class="text-lg font-extrabold text-slate-400 dark:text-slate-500">{{ toPersianDigits(units.length - occupiedCount) }}</p>
        <p class="text-[11px] font-semibold text-slate-500 dark:text-slate-400">خالی</p>
      </AppCard>
    </section>

    <!-- فهرست واحدها -->
    <section>
      <EmptyState
        v-if="units.length === 0"
        icon="i-lucide-door-open"
        title="هنوز واحدی ثبت نشده است"
        description="اولین واحد ساختمان را اضافه کنید."
      >
        <template v-if="isManager" #action>
          <UButton color="primary" variant="soft" size="sm" icon="i-lucide-plus" label="افزودن واحد" @click="openAddUnit" />
        </template>
      </EmptyState>

      <div v-else class="space-y-3">
        <AppCard v-for="unit in units" :key="unit.id" padding="sm">
          <div class="flex items-center gap-3">
            <span class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-base font-extrabold text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">
              {{ toPersianDigits(unit.number) }}
            </span>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <p class="truncate text-sm font-bold text-slate-800 dark:text-slate-100">واحد {{ toPersianDigits(unit.number) }}</p>
                <StatusBadge
                  :status="store.memberOfUnit(unit.id) ? (store.memberOfUnit(unit.id)?.unitStatus ?? 'owner') : 'vacant'"
                />
              </div>
              <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                طبقه {{ toPersianDigits(unit.floor) }}
                <template v-if="store.memberOfUnit(unit.id)">
                  • {{ store.memberOfUnit(unit.id)?.name }}
                </template>
              </p>
            </div>
            <div v-if="isManager" class="flex shrink-0 items-center gap-0.5">
              <UButton color="neutral" variant="ghost" size="sm" icon="i-lucide-user-plus" aria-label="تخصیص ساکن" @click="openAssign(unit)" />
              <UButton color="neutral" variant="ghost" size="sm" icon="i-lucide-pencil" aria-label="ویرایش واحد" @click="openEditUnit(unit)" />
              <UButton color="error" variant="ghost" size="sm" icon="i-lucide-trash-2" aria-label="حذف واحد" @click="askRemove(unit)" />
            </div>
          </div>
        </AppCard>
      </div>
    </section>

    <UnitFormDialog v-model:open="isUnitDialogOpen" :building-id="building.id" :unit="unitToEdit" />
    <UnitAssignDialog v-model:open="isAssignDialogOpen" :building-id="building.id" :unit="unitToAssign" />
    <ConfirmDialog
      v-model:open="isRemoveDialogOpen"
      title="حذف واحد"
      :description="unitToRemove ? `آیا از حذف «واحد ${toPersianDigits(unitToRemove.number)}» مطمئن هستید؟ ساکن آن بدون واحد خواهد شد.` : ''"
      tone="danger"
      confirm-label="حذف واحد"
      @confirm="confirmRemove"
    />
  </div>
</template>
