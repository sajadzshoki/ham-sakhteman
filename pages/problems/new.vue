<script setup lang="ts">
const { t } = useI18n()
const auth = useAuth()
const { buildings } = useBuildings()
const { create } = useProblems()
const route = useRoute()

const cat = ref('other')
const title = ref('')
const desc = ref('')
const currentBuildingId = computed(() => buildings.value[0]?.id || 'b-1')

const submit = () => {
  if (!title.value.trim()) return
  create({ buildingId: currentBuildingId.value, category: cat.value as any, title: title.value, description: desc.value, createdBy: (auth.user as any)?.id || 'system' })
  navigateTo('/problems')
}
</script>

<template>
  <div>
    <AppHeader title="گزارش مشکل" subtitle="ثبت درخواست جدید" back />
    <AppCard padding="lg">
      <div class="flex flex-col gap-3">
        <AppSelect label="دسته‌بندی" v-model="cat" :options="[{value:'water',label:'آب'},{value:'electricity',label:'برق'},{value:'elevator',label:'آسانسور'},{value:'gas',label:'گاز'},{value:'common',label:'مشاعات'},{value:'cleaning',label:'نظافت'},{value:'other',label:'سایر'}]" />
        <AppInput v-model="title" label="عنوان" placeholder="مثلاً آسانسور کار نمی‌کند" />
        <AppInput v-model="desc" label="توضیحات" placeholder="توضیح کوتاه درباره مشکل" />
        <button @click="submit" class="h-12 rounded-xl bg-gradient-to-br from-primary-500 to-teal-600 text-white font-extrabold shadow-soft hover:shadow-soft-lg transition-all">ثبت گزارش</button>
      </div>
    </AppCard>
  </div>
</template>
