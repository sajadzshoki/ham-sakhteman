<script setup lang="ts">
import type { BuildingRole, UnitStatus } from '~/types'

const props = defineProps<{
  buildingId: string
}>()

const store = useAppStore()
const toast = useToast()

const open = defineModel<boolean>('open', { default: false })

const name = ref('')
const phone = ref('')
const role = ref<BuildingRole>('resident')
const unitId = ref('')
const unitStatus = ref<UnitStatus>('owner')

const nameError = ref('')
const phoneError = ref('')

const roleOptions = [
  { label: 'ساکن', value: 'resident' },
  { label: 'مدیر ساختمان', value: 'manager' },
]

const unitOptions = computed(() => {
  const occupied = new Set(
    store.buildingMembers(props.buildingId).map(member => member.unitId).filter(Boolean),
  )
  return [
    { label: 'بدون واحد', value: '' },
    ...store
      .buildingUnits(props.buildingId)
      .filter(unit => !occupied.has(unit.id))
      .map(unit => ({ label: `واحد ${toPersianDigits(unit.number)} — طبقه ${toPersianDigits(unit.floor)}`, value: unit.id })),
  ]
})

watch(open, (value) => {
  if (!value) return
  name.value = ''
  phone.value = ''
  role.value = 'resident'
  unitId.value = ''
  unitStatus.value = 'owner'
  nameError.value = ''
  phoneError.value = ''
})

const saving = ref(false)

async function submit() {
  if (saving.value) return
  nameError.value = ''
  phoneError.value = ''

  if (!name.value.trim()) {
    nameError.value = 'نام عضو را وارد کنید.'
    return
  }
  if (phone.value && !isValidPhone(phone.value)) {
    phoneError.value = 'شماره موبایل معتبر نیست.'
    return
  }

  saving.value = true
  try {
    await store.addMember(props.buildingId, {
      name: name.value.trim(),
      phone: phone.value || undefined,
      role: role.value,
      unitId: unitId.value || undefined,
      unitStatus: unitId.value ? unitStatus.value : undefined,
    })
    toast.add({ title: 'عضو به ساختمان اضافه شد', color: 'success' })
    open.value = false
  }
  catch (error) {
    // مثلاً شماره تکراری یا واحد اشغال‌شده (۴۰۹)
    toast.add({ title: apiErrorMessage(error, 'افزودن عضو انجام نشد'), color: 'error' })
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open" title="افزودن عضو" description="ساکن یا مدیر جدید را به ساختمان اضافه کنید" :ui="{ content: 'max-w-md' }">
    <template #body>
      <form class="space-y-4" @submit.prevent="submit">
        <BaseTextField
          v-model="name"
          label="نام و نام خانوادگی"
          required
          icon="i-lucide-user-round"
          placeholder="مثلاً: مریم کریمی"
          :error="nameError"
          @update:model-value="nameError = ''"
        />
        <BaseTextField
          v-model="phone"
          label="شماره تماس"
          type="tel"
          dir="ltr"
          icon="i-lucide-smartphone"
          placeholder="09123456789"
          hint="اختیاری"
          :error="phoneError"
          @update:model-value="phoneError = ''"
        />
        <BaseSelectField v-model="role" label="نقش" :items="roleOptions" />
        <BaseSelectField v-model="unitId" label="واحد" hint="اختیاری — می‌توانید بعداً تخصیص دهید" :items="unitOptions" />
        <BaseSelectField
          v-if="unitId"
          v-model="unitStatus"
          label="وضعیت سکونت"
          :items="[{ label: 'مالک', value: 'owner' }, { label: 'مستأجر', value: 'tenant' }]"
        />
        <div class="flex w-full flex-row-reverse gap-2">
          <UButton type="submit" color="primary" variant="solid" size="md" block :loading="saving" label="افزودن عضو" />
          <UButton type="button" color="neutral" variant="soft" size="md" block label="انصراف" @click="open = false" />
        </div>
      </form>
    </template>
  </UModal>
</template>
