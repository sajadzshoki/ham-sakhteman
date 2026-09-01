<script setup lang="ts">
const { t } = useI18n()
const auth = useAuth()
const { buildings } = useBuildings()
const { getByBuilding, getById, create, update, remove } = useAnnouncements()

const route = useRoute()
const id = computed(() => route.query.id as string)
const detail = computed(() => id.value ? getById(id.value) : null)

const currentBuildingId = computed(() => buildings.value[0]?.id || 'b-1')
const list = computed(() => getByBuilding(currentBuildingId.value))

const showForm = ref(false)
const title = ref('')
const desc = ref('')
const importance = ref<'normal' | 'important'>('normal')

const submit = () => {
  if (!title.value.trim()) return
  create({ buildingId: currentBuildingId.value, title: title.value, description: desc.value, importance: importance.value, imageUrl: '', createdBy: (auth.user as any)?.id || 'system' })
  title.value = ''; desc.value = ''; importance.value = 'normal'; showForm.value = false
}

const deleteAnn = (annId: string) => {
  if (confirm('حذف اطلاعیه؟')) remove(annId)
}
</script>

<template>
  <div>
    <AppHeader title="اعلان‌ها" subtitle="اطلاعیه‌های ساختمان" back />

    <div v-if="auth.isManager" class="mb-4 flex justify-end">
      <button @click="showForm = !showForm" class="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-extrabold shadow-soft hover:bg-primary-700 transition-colors">{{ showForm ? 'بستن' : 'ایجاد اطلاعیه' }}</button>
    </div>

    <AppCard v-if="showForm" padding="md" class="mb-6">
      <h3 class="text-base font-extrabold text-slate-900 mb-3">اعلان جدید</h3>
      <div class="flex flex-col gap-3">
        <AppInput v-model="title" label="عنوان" placeholder="عنوان اطلاعیه" />
        <AppInput v-model="desc" label="توضیحات" placeholder="متن اطلاعیه" />
        <AppSelect label="اهمیت" v-model="importance" :options="[{value:'normal',label:'عادی'},{value:'important',label:'مهم'}]" />
        <button @click="submit" class="h-11 rounded-xl bg-gradient-to-br from-primary-500 to-teal-600 text-white font-extrabold shadow-soft">ذخیره</button>
      </div>
    </AppCard>

    <div v-if="detail" class="mb-6">
      <AppCard padding="lg">
        <button @click="$router.push('/announcements')" class="text-xs text-primary-600 font-bold mb-2">← بازگشت به لیست</button>
        <div class="flex items-center gap-2 mb-2">
          <StatusBadge :status="detail.importance === 'important' ? 'warning' : 'success'" :label="detail.importance === 'important' ? 'مهم' : 'عادی'" />
          <span class="text-[10px] text-slate-300 font-medium">{{ detail.createdAt ? detail.createdAt.slice(0,10) : '' }}</span>
        </div>
        <h2 class="text-xl font-extrabold text-slate-900 leading-tight mb-2">{{ detail.title }}</h2>
        <p class="text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">{{ detail.description }}</p>
        <div v-if="auth.isManager" class="flex gap-2 mt-4">
          <button @click="deleteAnn(detail.id)" class="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-extrabold">حذف</button>
        </div>
      </AppCard>
    </div>

    <div v-else class="flex flex-col gap-3">
      <EmptyState v-if="list.length === 0" title="اعلانی یافت نشد" message="هنوز اطلاعیه‌ای ثبت نشده است." />
      <AppCard v-for="a in list" :key="a.id" padding="md" hover>
        <NuxtLink :to="'/announcements?id=' + a.id" class="block">
          <div class="flex items-center justify-between gap-2 mb-1">
            <StatusBadge :status="a.importance === 'important' ? 'warning' : 'success'" :label="a.importance === 'important' ? 'مهم' : 'عادی'" />
            <span class="text-[10px] text-slate-300 font-medium">{{ a.createdAt ? a.createdAt.slice(0,10) : '' }}</span>
          </div>
          <h4 class="text-base font-extrabold text-slate-900 leading-snug">{{ a.title }}</h4>
          <p class="text-xs text-slate-400 font-medium truncate">{{ a.description }}</p>
        </NuxtLink>
      </AppCard>
    </div>
  </div>
</template>
