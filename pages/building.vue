<script setup lang="ts">
import type { Building } from '../types'

const route = useRoute()
const auth = useAuth()
const currentUser = computed(() => auth.user.value || null)
const { getBuilding, units, members, invitations, invite, addUnit, removeUnit, addMember, removeMember, updateBuilding } = useBuildings()

const buildingId = computed<string>(() => String(route.query.id || ''))
const b = computed<import('../types').Building | null>(() => getBuilding(buildingId.value))

const isMgr = computed(() => b.value?.managerId === currentUser.value?.id || auth.isManager)

const unitList = computed(() => units.value[buildingId.value] || [])
const memberList = computed(() => members.value[buildingId.value] || [])
const invitationList = computed(() => invitations.value[buildingId.value] || [])

const showEdit = ref(false)
const editName = ref('')
const editAddr = ref('')
const editDesc = ref('')

watch(b, (val) => {
  if (val) { editName.value = val.name; editAddr.value = val.address; editDesc.value = val.description || '' }
}, { immediate: true })

const saveEdit = () => {
  if (b.value) updateBuilding(b.value.id, { name: editName.value, address: editAddr.value, description: editDesc.value })
  showEdit.value = false
}

const copyCode = async () => {
  if (b.value) await navigator.clipboard.writeText(b.value.invitationCode)
}

const shareLink = async () => {
  if (b.value) await navigator.clipboard.writeText(b.value.invitationLink)
}
</script>

<template>
  <div>
    <AppHeader title="ساختمان" subtitle="مدیریت ساختمان" back />

    <AppCard v-if="b" padding="lg" class="mb-6">
      <div class="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 v-if="!showEdit" class="text-xl font-extrabold text-slate-900 leading-tight">{{ b.name }}</h2>
          <div v-else class="flex flex-col gap-2 mb-2">
            <AppInput v-model="editName" label="نام" />
            <AppInput v-model="editAddr" label="آدرس" />
            <AppInput v-model="editDesc" label="توضیحات" />
          </div>
          <p v-if="!showEdit" class="text-xs text-slate-400 font-medium truncate">{{ b.address }}</p>
          <p v-if="b.description && !showEdit" class="text-xs text-slate-300 font-medium mt-0.5">{{ b.description }}</p>
        </div>
        <button v-if="isMgr && !showEdit" @click="showEdit = true" class="shrink-0 w-9 h-9 rounded-xl bg-slate-50 text-slate-600 hover:text-slate-900 flex items-center justify-center border border-slate-100 transition-colors" aria-label="edit">
          <Icon name="i-lucide-pencil" class="w-4 h-4" />
        </button>
      </div>

      <div v-if="showEdit" class="flex gap-2 mb-4">
        <button @click="saveEdit" class="px-4 py-2 rounded-xl bg-primary-600 text-white text-xs font-extrabold shadow-soft">ذخیره</button>
        <button @click="showEdit = false" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-extrabold">لغو</button>
      </div>

      <div class="grid grid-cols-3 gap-3 mb-4">
        <div class="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-center">
          <div class="text-xl font-extrabold text-slate-900">{{ b.unitCount }}</div>
          <div class="text-[10px] text-slate-400 font-bold">واحد</div>
        </div>
        <div class="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-center">
          <div class="text-xl font-extrabold text-primary-600">{{ b.residentCount }}</div>
          <div class="text-[10px] text-slate-400 font-bold">ساکن</div>
        </div>
        <div class="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-center">
          <div class="text-xl font-extrabold text-teal-600">{{ invitationList.length }}</div>
          <div class="text-[10px] text-slate-400 font-bold">دعوت</div>
        </div>
      </div>

      <div class="rounded-2xl bg-gradient-to-r from-primary-50 to-teal-50 border border-primary-100/60 p-4 flex items-center justify-between">
        <div>
          <div class="text-sm font-extrabold text-slate-900">کد دعوت: <span class="text-primary-600 tracking-widest">{{ b.invitationCode }}</span></div>
          <div class="text-xs text-slate-400 font-medium truncate">{{ b.invitationLink }}</div>
        </div>
        <div class="flex gap-2 shrink-0">
          <button @click="copyCode" class="px-3 py-1.5 rounded-xl bg-white text-primary-600 text-xs font-extrabold shadow-sm border border-primary-100 hover:bg-primary-50 transition-colors">کپی کد</button>
          <button @click="shareLink" class="px-3 py-1.5 rounded-xl bg-white text-primary-600 text-xs font-extrabold shadow-sm border border-primary-100 hover:bg-primary-50 transition-colors">کپی لینک</button>
        </div>
      </div>
    </AppCard>

    <!-- Units -->
    <section class="mb-8">
      <PageHeader title="واحدها" subtitle="وضعیت واحدها" />
      <div class="flex flex-col gap-3">
        <AppCard v-for="u in unitList" :key="u.id" padding="md" hover>
          <div class="flex items-center justify-between gap-3">
            <div>
              <h4 class="text-base font-extrabold text-slate-900">واحد {{ u.number }}</h4>
              <p class="text-xs text-slate-400 font-medium">طبقه {{ u.floor }}</p>
              <div class="flex items-center gap-2 mt-1">
                <StatusBadge :status="u.status === 'occupied' ? 'completed' : u.status === 'vacant' ? 'pending' : 'warning'" :label="u.status === 'occupied' ? 'اشغال' : u.status === 'vacant' ? 'خالی' : 'تعمیر'" />
                <span v-if="u.residentName" class="text-xs text-slate-500 font-medium">{{ u.residentName }}</span>
              </div>
            </div>
            <button v-if="isMgr" @click="removeUnit(b?.id || '', u.id)" class="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100 transition-colors" aria-label="delete">
              <Icon name="i-lucide-trash-2" class="w-4 h-4" />
            </button>
          </div>
        </AppCard>
        <EmptyState v-if="unitList.length === 0" title="واحدی یافت نشد" message="واحدها را از صفحه ساختمان اضافه کنید." />
      </div>
      <div v-if="isMgr" class="mt-3">
        <button @click="addUnit(b?.id || '', { number: '۰۰۰', floor: '۱', status: 'vacant' })" class="w-full h-11 rounded-xl bg-slate-900 text-white font-extrabold text-sm shadow-soft hover:bg-slate-800 transition-colors">+ اضافه کردن واحد</button>
      </div>
    </section>

    <!-- Members -->
    <section class="mb-8">
      <PageHeader title="اعضا" subtitle="ساکنان و مدیران" />
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <AppCard v-for="m in memberList" :key="m.id" padding="md" hover>
          <div class="flex items-center gap-3">
            <UserAvatar :name="m.user?.name || 'عضو'" :initials="m.user?.avatarInitials || 'ع'" size="md" />
            <div class="min-w-0">
              <div class="text-sm font-extrabold text-slate-900 truncate">{{ m.user?.name || 'عضو' }}</div>
              <div class="text-xs text-slate-400 font-medium">{{ m.role === 'manager' ? 'مدیر' : 'ساکن' }}</div>
              <div v-if="m.unitId" class="text-[10px] text-slate-300 font-medium">واحد: {{ unitList.find(u => u.id === m.unitId)?.number || '-' }}</div>
            </div>
          </div>
        </AppCard>
      </div>
      <EmptyState v-if="memberList.length === 0" title="عضوی یافت نشد" message="ساکنان را از طریق کد دعوت اضافه کنید." />
    </section>

    <!-- Invitation actions -->
    <section v-if="isMgr" class="mb-8">
      <PageHeader title="دعوت" subtitle="ارسال لینک و کد دعوت" />
      <AppCard padding="md" class="flex flex-col sm:flex-row items-center gap-3">
        <div class="flex-1 w-full">
          <div class="text-sm font-extrabold text-slate-900">کد دعوت: <span class="text-primary-600">{{ b?.invitationCode }}</span></div>
          <div class="text-xs text-slate-400 font-medium truncate">{{ b?.invitationLink }}</div>
        </div>
        <button @click="invite(b?.id || '')" class="h-11 px-5 rounded-xl bg-gradient-to-br from-primary-500 to-teal-600 text-white font-extrabold shadow-soft hover:shadow-soft-lg transition-all text-sm whitespace-nowrap">ایجاد دعوت جدید</button>
      </AppCard>
    </section>
  </div>
</template>
