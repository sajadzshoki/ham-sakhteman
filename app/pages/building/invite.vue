<script setup lang="ts">
import type { BuildingRole, Invitation } from '~/types'

const toast = useToast()
const { user } = useAuth()
const store = useAppStore()

useSeoMeta({ title: 'دعوت ساکنین', ogTitle: 'دعوت ساکنین' })

const building = computed(() => store.buildingOfUser(user.value))
const invitations = computed(() => (building.value ? store.buildingInvitations(building.value.id) : []))

const activeInvitation = computed(
  () => invitations.value.find(invitation => store.invitationDisplayStatus(invitation) === 'active') ?? null,
)

// ——— ساخت کد جدید ———
const newInviteRole = ref<BuildingRole>('resident')

const creating = ref(false)

async function createInvitation() {
  if (!building.value || creating.value) return
  creating.value = true
  try {
    const invitation = await store.createInvitation(building.value.id, newInviteRole.value)
    toast.add({
      title: 'کد دعوت جدید ساخته شد',
      description: `کد «${invitation.code}» را با ساکنین به اشتراک بگذارید.`,
      color: 'success',
    })
  }
  catch (error) {
    toast.add({ title: apiErrorMessage(error, 'ساخت کد دعوت انجام نشد'), color: 'error' })
  }
  finally {
    creating.value = false
  }
}

// ——— حذف دعوت‌نامه ———
const isRemoveDialogOpen = ref(false)
const invitationToRemove = ref<Invitation | null>(null)

function askRemove(invitation: Invitation) {
  invitationToRemove.value = invitation
  isRemoveDialogOpen.value = true
}

async function confirmRemove() {
  if (!invitationToRemove.value) return
  try {
    await store.deleteInvitation(invitationToRemove.value.id)
    toast.add({ title: 'دعوت‌نامه حذف شد', color: 'success' })
  }
  catch (error) {
    toast.add({ title: apiErrorMessage(error, 'حذف دعوت‌نامه انجام نشد'), color: 'error' })
  }
}

const roleLabel = (role: BuildingRole) => (role === 'manager' ? 'مدیر ساختمان' : 'ساکن')
</script>

<template>
  <div v-if="building" class="space-y-7">
    <PageHeader
      title="دعوت ساکنین"
      description="با کد دعوت یا لینک، ساکنین را به ساختمان اضافه کنید"
    />

    <!-- کد دعوت فعال -->
    <section v-if="activeInvitation">
      <InvitationCard :invitation="activeInvitation" :building="building" />
    </section>

    <EmptyState
      v-else
      icon="i-lucide-ticket"
      title="کد دعوت فعالی ندارید"
      description="یک کد دعوت بسازید و آن را با ساکنین به اشتراک بگذارید."
    />

    <!-- ساخت کد جدید -->
    <section>
      <AppCard>
        <p class="mb-3 text-sm font-bold text-slate-800 dark:text-slate-100">ساخت کد دعوت جدید</p>
        <div class="space-y-3">
          <BaseSelectField
            v-model="newInviteRole"
            label="نقش پس از پیوستن"
            :items="[{ label: 'ساکن', value: 'resident' }, { label: 'مدیر ساختمان', value: 'manager' }]"
          />
          <UButton
            color="primary"
            variant="solid"
            size="lg"
            block
            icon="i-lucide-plus"
            label="ساخت کد دعوت"
            :loading="creating"
            @click="createInvitation"
          />
        </div>
      </AppCard>
    </section>

    <!-- فهرست دعوت‌نامه‌ها -->
    <section v-if="invitations.length > 0">
      <SectionHeader title="همه دعوت‌نامه‌ها" />
      <AppCard padding="none">
        <ul class="divide-y divide-slate-100 dark:divide-slate-800">
          <li v-for="invitation in invitations" :key="invitation.id" class="flex items-center gap-3 px-4 py-3.5">
            <span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-400/10 dark:text-teal-300">
              <Icon name="i-lucide-ticket" class="size-5" />
            </span>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span dir="ltr" class="font-mono text-sm font-extrabold tracking-[0.2em] text-slate-800 dark:text-slate-100">
                  {{ invitation.code }}
                </span>
                <StatusBadge :status="store.invitationDisplayStatus(invitation)" />
              </div>
              <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                نقش: {{ roleLabel(invitation.role) }} • ساخته‌شده {{ formatRelative(invitation.createdAt) }}
              </p>
            </div>
            <UButton color="error" variant="ghost" size="sm" icon="i-lucide-trash-2" aria-label="حذف دعوت‌نامه" @click="askRemove(invitation)" />
          </li>
        </ul>
      </AppCard>
    </section>

    <ConfirmDialog
      v-model:open="isRemoveDialogOpen"
      title="حذف دعوت‌نامه"
      :description="invitationToRemove ? `آیا از حذف کد «${invitationToRemove.code}» مطمئن هستید؟ ساکنین دیگر نمی‌توانند با آن بپیوندند.` : ''"
      tone="danger"
      confirm-label="حذف دعوت‌نامه"
      @confirm="confirmRemove"
    />
  </div>
</template>
