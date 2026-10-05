<script setup lang="ts">
import type { AnnouncementImportance } from '~/types'

const router = useRouter()
const toast = useToast()
const { user } = useAuth()
const store = useAppStore()

useSeoMeta({
  title: 'اطلاعیه جدید',
  ogTitle: 'اطلاعیه جدید',
})

const building = computed(() => store.buildingOfUser(user.value))

const saving = ref(false)

function onSubmit(payload: { title: string; body: string; importance: AnnouncementImportance; image: string | undefined }) {
  if (saving.value || !building.value || !user.value) return
  saving.value = true
  const imageKey = resolveImagePayload(payload.image)
  const announcement = store.createAnnouncement(
    building.value.id,
    { title: payload.title, body: payload.body, importance: payload.importance, image: imageKey },
    { id: user.value.id, name: user.value.name },
  )
  toast.add({ title: 'اطلاعیه با موفقیت ثبت شد', color: 'success' })
  router.push(`/announcements/${announcement.id}`)
}

function onCancel() {
  router.push('/announcements')
}
</script>

<template>
  <div class="space-y-5">
    <PageHeader title="اطلاعیه جدید" description="ساکنین بلافاصله این اطلاعیه را مشاهده می‌کنند" />
    <AppCard>
      <AnnouncementForm submit-label="ثبت اطلاعیه" :busy="saving" @submit="onSubmit" @cancel="onCancel" />
    </AppCard>
  </div>
</template>
