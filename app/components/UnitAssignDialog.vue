<script setup lang="ts">
import type { BuildingUnit, UnitStatus } from '~/types'

const props = defineProps<{
  buildingId: string
  /** واحد موردنظر برای تخصیص */
  unit: BuildingUnit | null
}>()

const store = useAppStore()
const toast = useToast()

const open = defineModel<boolean>('open', { default: false })

const memberId = ref('')
const unitStatus = ref<UnitStatus>('owner')

/** اعضای قابل تخصیص: اعضای بدون واحد + ساکن فعلی همین واحد */
const memberOptions = computed(() => {
  if (!props.unit) return []
  return [
    { label: 'بدون ساکن', value: '' },
    ...store
      .buildingMembers(props.buildingId)
      .filter(member => member.role === 'resident' && (!member.unitId || member.unitId === props.unit?.id))
      .map(member => ({ label: member.name, value: member.id })),
  ]
})

watch(open, (value) => {
  if (!value || !props.unit) return
  const occupant = store.memberOfUnit(props.unit.id)
  memberId.value = occupant?.id ?? ''
  unitStatus.value = occupant?.unitStatus ?? 'owner'
})

const saving = ref(false)

async function submit() {
  if (!props.unit || saving.value) return
  saving.value = true
  try {
    if (memberId.value) {
      await store.assignMemberToUnit(memberId.value, props.unit.id, unitStatus.value)
      toast.add({ title: 'ساکن به واحد تخصیص یافت', color: 'success' })
    }
    else {
      const occupant = store.memberOfUnit(props.unit.id)
      if (occupant) {
        await store.assignMemberToUnit(occupant.id, null)
        toast.add({ title: 'واحد خالی شد', color: 'success' })
      }
    }
    open.value = false
  }
  catch (error) {
    toast.add({ title: apiErrorMessage(error, 'تخصیص ساکن انجام نشد'), color: 'error' })
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="تخصیص ساکن"
    :description="unit ? `ساکن واحد ${toPersianDigits(unit.number)} را انتخاب کنید` : ''"
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <form class="space-y-4" @submit.prevent="submit">
        <BaseSelectField v-model="memberId" label="ساکن" :items="memberOptions" />
        <BaseSelectField
          v-if="memberId"
          v-model="unitStatus"
          label="وضعیت سکونت"
          :items="[{ label: 'مالک', value: 'owner' }, { label: 'مستأجر', value: 'tenant' }]"
        />
        <div class="flex w-full flex-row-reverse gap-2">
          <UButton type="submit" color="primary" variant="solid" size="md" block :loading="saving" label="ذخیره" />
          <UButton type="button" color="neutral" variant="soft" size="md" block label="انصراف" @click="open = false" />
        </div>
      </form>
    </template>
  </UModal>
</template>
