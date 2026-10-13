<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const toast = useToast()
const { isManager } = useAuth()
const store = useAppStore()

const announcementId = computed(() => String(route.params.id))

const announcement = computed(() => store.getAnnouncement(announcementId.value))

useSeoMeta({
  title: () => announcement.value?.title ?? 'اطلاعیه',
  ogTitle: () => announcement.value?.title ?? 'اطلاعیه',
})

const isDeleteOpen = ref(false)

function onEdit() {
  router.push(`/announcements/${announcementId.value}/edit`)
}

async function onDelete() {
  const target = announcement.value
  if (!target) return
  try {
    await store.deleteAnnouncement(target.id)
    removeImage(target.image)
    toast.add({ title: 'اطلاعیه حذف شد', color: 'success' })
    await router.push('/announcements')
  }
  catch (error) {
    toast.add({ title: apiErrorMessage(error, 'حذف اطلاعیه انجام نشد'), color: 'error' })
  }
}
</script>

<template>
  <div class="space-y-5">
    <PageHeader
      v-if="announcement"
      :title="announcement.title"
      :description="`ثبت‌شده توسط ${announcement.createdByName} • ${formatDate(announcement.createdAt, 'full')}`"
    />
    <PageHeader v-else title="اطلاعیه" />

    <template v-if="announcement">
      <AppCard as="article">
        <div class="flex items-center justify-between gap-2">
          <StatusBadge :status="announcement.importance" />
          <time class="text-[11px] text-slate-400 dark:text-slate-500">
            {{ formatRelative(announcement.createdAt) }}
          </time>
        </div>

        <h1 class="mt-3 text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
          {{ announcement.title }}
        </h1>

        <AppImage
          v-if="announcement.image"
          :src="announcement.image"
          :alt="announcement.title"
          aspect="aspect-[2/1]"
          class="mt-4"
        />

        <p class="mt-4 text-sm leading-7 whitespace-pre-line text-slate-600 dark:text-slate-300">
          {{ announcement.body }}
        </p>

        <div class="mt-5 flex items-center justify-between gap-2 border-t border-slate-100 pt-4 dark:border-white/5">
          <p class="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Icon name="i-lucide-user-round" class="size-4" />
            {{ announcement.createdByName }}
          </p>
          <p v-if="announcement.updatedAt" class="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
            <Icon name="i-lucide-history" class="size-3.5" />
            ویرایش‌شده {{ formatRelative(announcement.updatedAt) }}
          </p>
        </div>

        <div v-if="isManager" class="mt-4 flex gap-2">
          <UButton color="neutral" variant="soft" size="md" block label="ویرایش" icon="i-lucide-pencil" @click="onEdit" />
          <UButton color="error" variant="soft" size="md" block label="حذف" icon="i-lucide-trash-2" @click="isDeleteOpen = true" />
        </div>
      </AppCard>

      <UButton color="neutral" variant="ghost" size="md" icon="i-lucide-arrow-right" label="بازگشت به اطلاعیه‌ها" @click="router.push('/announcements')" />

      <ConfirmDialog
        v-model:open="isDeleteOpen"
        title="حذف اطلاعیه"
        description="این اطلاعیه برای همیشه حذف می‌شود و ساکنین دیگر آن را نخواهند دید. مطمئن هستید؟"
        confirm-label="حذف اطلاعیه"
        tone="danger"
        @confirm="onDelete"
      />
    </template>

    <template v-else>
      <EmptyState
        icon="i-lucide-megaphone-off"
        title="اطلاعیه پیدا نشد"
        description="ممکن است این اطلاعیه حذف شده باشد یا پیوند معتبر نباشد."
      >
        <template #action>
          <UButton
            color="primary"
            variant="solid"
            size="md"
            icon="i-lucide-arrow-right"
            label="بازگشت به اطلاعیه‌ها"
            @click="router.push('/announcements')"
          />
        </template>
      </EmptyState>
    </template>
  </div>
</template>
