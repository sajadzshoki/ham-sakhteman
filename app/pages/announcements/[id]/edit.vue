<script setup lang="ts">
import type { AnnouncementImportance } from '~/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const store = useAppStore()

const announcementId = computed(() => String(route.params.id))
const announcement = computed(() => store.getAnnouncement(announcementId.value))

useSeoMeta({
  title: 'ویرایش اطلاعیه',
  ogTitle: 'ویرایش اطلاعیه',
})

const saving = ref(false)

function onSubmit(payload: { title: string; body: string; importance: AnnouncementImportance; image: string | undefined }) {
  if (saving.value) return
  const target = announcement.value
  if (!target) return
  saving.value = true
  const imageKey = resolveImagePayload(payload.image, target.image)
  store.updateAnnouncement(target.id, {
    title: payload.title,
    body: payload.body,
    importance: payload.importance,
    image: imageKey,
  })
  toast.add({ title: 'اطلاعیه به‌روزرسانی شد', color: 'success' })
  router.push(`/announcements/${target.id}`)
}

function onCancel() {
  router.push(`/announcements/${announcementId.value}`)
}
</script>

<template>
  <div class="space-y-5">
    <template v-if="announcement">
      <PageHeader title="ویرایش اطلاعیه" :description="announcement.title" />
      <AppCard>
        <AnnouncementForm
          :initial-title="announcement.title"
          :initial-body="announcement.body"
          :initial-importance="announcement.importance"
          :initial-image="announcement.image"
          submit-label="ذخیره تغییرات"
          submit-icon="i-lucide-save"
          :busy="saving"
          @submit="onSubmit"
          @cancel="onCancel"
        />
      </AppCard>
    </template>

    <template v-else>
      <PageHeader title="ویرایش اطلاعیه" />
      <EmptyState
        icon="i-lucide-megaphone-off"
        title="اطلاعیه پیدا نشد"
        description="ممکن است این اطلاعیه حذف شده باشد."
      >
        <template #action>
          <UButton color="primary" variant="solid" size="md" label="بازگشت به اطلاعیه‌ها" icon="i-lucide-arrow-right" @click="router.push('/announcements')" />
        </template>
      </EmptyState>
    </template>
  </div>
</template>
