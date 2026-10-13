<script setup lang="ts">
import type { BuildingMember } from '~/types'

const router = useRouter()
const toast = useToast()
const { user, isManager } = useAuth()
const store = useAppStore()

useSeoMeta({ title: 'اعضای ساختمان', ogTitle: 'اعضای ساختمان' })

const building = computed(() => store.buildingOfUser(user.value))
const members = computed(() => {
  if (!building.value) return []
  return store.buildingMembers(building.value.id)
})

const unitLabel = (member: BuildingMember): string => {
  if (!member.unitId || !building.value) return 'بدون واحد'
  const unit = store.buildingUnits(building.value.id).find(item => item.id === member.unitId)
  return unit ? `واحد ${toPersianDigits(unit.number)} • طبقه ${toPersianDigits(unit.floor)}` : 'بدون واحد'
}

// ——— افزودن عضو ———
const isAddDialogOpen = ref(false)

// ——— تخصیص واحد ———
const isAssignDialogOpen = ref(false)
const memberToAssign = ref<BuildingMember | null>(null)

function openAssign(member: BuildingMember) {
  memberToAssign.value = member
  isAssignDialogOpen.value = true
}

// ——— حذف عضو ———
const isRemoveDialogOpen = ref(false)
const memberToRemove = ref<BuildingMember | null>(null)

function askRemove(member: BuildingMember) {
  memberToRemove.value = member
  isRemoveDialogOpen.value = true
}

async function confirmRemove() {
  if (!memberToRemove.value) return
  try {
    await store.removeMember(memberToRemove.value.id)
    toast.add({ title: 'عضو از ساختمان حذف شد', color: 'success' })
  }
  catch (error) {
    toast.add({ title: apiErrorMessage(error, 'حذف عضو انجام نشد'), color: 'error' })
  }
}
</script>

<template>
  <div v-if="building" class="space-y-7">
    <PageHeader title="اعضای ساختمان" :description="`${toPersianDigits(members.length)} عضو در ${building.name}`">
      <template #actions>
        <UButton
          v-if="isManager"
          color="primary"
          variant="solid"
          size="md"
          icon="i-lucide-user-plus"
          label="افزودن عضو"
          @click="isAddDialogOpen = true"
        />
      </template>
    </PageHeader>

    <!-- دعوت ساکنین -->
    <section v-if="isManager">
      <AppCard padding="sm">
        <button type="button" class="flex w-full items-center gap-3 px-1 py-1 text-start" @click="router.push('/building/invite')">
          <span class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-400/10 dark:text-violet-300">
            <Icon name="i-lucide-user-plus" class="size-4.5" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-bold text-slate-800 dark:text-slate-100">دعوت ساکن جدید</span>
            <span class="block text-xs text-slate-500 dark:text-slate-400">کد دعوت بسازید و با ساکنین به اشتراک بگذارید</span>
          </span>
          <Icon name="i-lucide-chevron-left" class="size-4 text-slate-300 dark:text-slate-600" />
        </button>
      </AppCard>
    </section>

    <!-- فهرست اعضا -->
    <section>
      <EmptyState
        v-if="members.length === 0"
        icon="i-lucide-users"
        title="هنوز عضوی ثبت نشده است"
        description="عضو جدید اضافه کنید یا با کد دعوت ساکنین را دعوت کنید."
      />

      <div v-else class="space-y-3">
        <AppCard v-for="member in members" :key="member.id" padding="sm">
          <div class="flex items-center gap-3">
            <UserAvatar :name="member.name" size="md" />
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-1.5">
                <p class="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{{ member.name }}</p>
                <StatusBadge :status="member.role" />
                <span
                  v-if="member.userId === user?.id"
                  class="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-600 dark:bg-teal-400/10 dark:text-teal-300"
                >
                  شما
                </span>
              </div>
              <p class="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-500 dark:text-slate-400">
                <span class="flex items-center gap-1">
                  <Icon name="i-lucide-door-open" class="size-3" />
                  {{ unitLabel(member) }}
                </span>
                <span v-if="member.unitStatus" class="flex items-center gap-1">
                  <Icon name="i-lucide-key-round" class="size-3" />
                  {{ member.unitStatus === 'owner' ? 'مالک' : 'مستأجر' }}
                </span>
                <span v-if="member.phone" dir="ltr">{{ formatPhone(member.phone) }}</span>
              </p>
            </div>
            <div v-if="isManager && member.role !== 'manager'" class="flex shrink-0 items-center gap-0.5">
              <UButton color="neutral" variant="ghost" size="sm" icon="i-lucide-door-open" aria-label="تخصیص واحد" @click="openAssign(member)" />
              <UButton color="error" variant="ghost" size="sm" icon="i-lucide-trash-2" aria-label="حذف عضو" @click="askRemove(member)" />
            </div>
          </div>
        </AppCard>
      </div>
    </section>

    <MemberFormDialog v-model:open="isAddDialogOpen" :building-id="building.id" />
    <AssignUnitDialog v-model:open="isAssignDialogOpen" :building-id="building.id" :member="memberToAssign" />
    <ConfirmDialog
      v-model:open="isRemoveDialogOpen"
      title="حذف عضو"
      :description="memberToRemove ? `آیا از حذف «${memberToRemove.name}» از ساختمان مطمئن هستید؟` : ''"
      tone="danger"
      confirm-label="حذف عضو"
      @confirm="confirmRemove"
    />
  </div>
</template>
