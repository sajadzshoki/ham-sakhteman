<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const auth = useAuth()
const currentUser = computed(() => auth.user || null)
const { buildings, createBuilding, joinByCode, loading, loadError, refresh, actionError } = useBuildings()

const showCreate = ref(false)
const name = ref('')
const address = ref('')
const desc = ref('')
const unitsCount = ref('4')
const joinCode = ref('')
const joining = ref(false)
const joinMessage = ref('')

const submit = async () => {
  if (!name.value.trim()) return
  try {
    const b = await createBuilding({
      name: name.value,
      address: address.value,
      description: desc.value,
      unitCount: Number(unitsCount.value) || 0,
      residentCount: 0,
    })
    showCreate.value = false
    name.value = ''
    address.value = ''
    desc.value = ''
    await navigateTo(`/building?id=${b.id}`)
  } catch {
    // actionError is set by the composable
  }
}

const submitJoin = async (code = joinCode.value) => {
  const normalized = code.trim()
  if (!normalized) return
  joining.value = true
  joinMessage.value = ''
  const ok = await joinByCode(normalized)
  joining.value = false
  if (ok) {
    joinMessage.value = t('buildings.joinSuccess')
    joinCode.value = ''
    if (route.query.code) {
      await navigateTo({ path: '/buildings', query: {} })
    }
  }
}

watch(
  () => [auth.isAuthenticated, route.query.code] as const,
  async ([authenticated, code]) => {
    if (!authenticated || typeof code !== 'string' || !code.trim()) return
    joinCode.value = code
    await submitJoin(code)
  },
  { immediate: true },
)
</script>

<template>
  <div>
    <PageHeader :title="t('buildings.myBuildings')" :subtitle="t('building.subtitle')" />

    <section v-if="auth.isAuthenticated" class="mb-6">
      <AppCard padding="md">
        <h3 class="text-sm font-extrabold text-slate-900 dark:text-white mb-3">{{ t('buildings.joinBuilding') }}</h3>
        <div class="flex flex-col sm:flex-row gap-2">
          <div class="flex-1">
            <AppInput v-model="joinCode" :label="t('buildings.joinCode')" placeholder="ABC123" />
          </div>
          <button
            type="button"
            class="h-11 sm:self-end px-4 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-extrabold disabled:opacity-60"
            :disabled="joining || !joinCode.trim()"
            @click="submitJoin()"
          >
            {{ joining ? t('buildings.joining') : t('buildings.join') }}
          </button>
        </div>
        <p v-if="joinMessage" class="text-xs text-emerald-600 font-bold mt-2">{{ joinMessage }}</p>
        <p v-if="actionError && !showCreate" class="text-xs text-rose-500 font-bold mt-2">{{ actionError }}</p>
      </AppCard>
    </section>

    <div class="flex items-center justify-between mb-4 gap-3">
      <h2 class="text-lg font-extrabold text-slate-800 dark:text-slate-100">{{ t('buildings.myBuildings') }}</h2>
      <button
        v-if="auth.isManager"
        type="button"
        class="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary-600 text-white text-xs font-extrabold shadow-soft hover:bg-primary-700 transition-colors"
        @click="showCreate = true"
      >
        <Icon name="i-lucide-plus" class="w-4 h-4" /> {{ t('buildings.createBuilding') }}
      </button>
    </div>

    <div v-if="showCreate" class="mb-6">
      <AppCard padding="lg">
        <h3 class="text-base font-extrabold text-slate-900 dark:text-white mb-3">{{ t('buildings.createBuilding') }}</h3>
        <div class="grid sm:grid-cols-2 gap-3 mb-3">
          <AppInput v-model="name" :label="t('buildings.buildingName')" />
          <AppInput v-model="address" :label="t('buildings.address')" />
        </div>
        <AppInput v-model="desc" :label="t('buildings.description')" />
        <AppSelect
          v-model="unitsCount"
          :label="t('buildings.unitCount')"
          :options="[
            { value: '4', label: '4' },
            { value: '8', label: '8' },
            { value: '12', label: '12' },
            { value: '24', label: '24' },
          ]"
        />
        <p v-if="actionError" class="text-xs text-rose-500 font-bold mt-2">{{ actionError }}</p>
        <div class="mt-3 flex gap-2 justify-end">
          <button type="button" class="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold text-sm" @click="showCreate = false">
            {{ t('common.cancel') }}
          </button>
          <button type="button" class="px-4 py-2 rounded-xl bg-primary-600 text-white font-extrabold text-sm shadow-soft hover:bg-primary-700 transition-colors" @click="submit">
            {{ t('buildings.createBuilding') }}
          </button>
        </div>
      </AppCard>
    </div>

    <LoadingState v-if="loading" />
    <ErrorState v-else-if="loadError" :message="loadError" :retry="refresh" />
    <div v-else class="flex flex-col gap-3">
      <AppCard v-for="b in buildings" :key="b.id" padding="md" hover>
        <NuxtLink :to="`/building?id=${b.id}`" class="flex items-start gap-3">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-teal-500 text-white flex items-center justify-center shadow-soft shadow-inner-soft shrink-0">
            <Icon name="i-lucide-building-2" class="w-6 h-6" />
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="text-base font-extrabold text-slate-900 dark:text-white leading-tight">{{ b.name }}</h3>
            <p class="text-xs text-slate-400 font-medium truncate">{{ b.address }}</p>
            <div class="flex flex-wrap items-center gap-2 mt-2 text-xs font-bold text-slate-500">
              <span class="bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-700">{{ b.unitCount }} {{ t('buildings.units') }}</span>
              <span class="bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-700">{{ b.residentCount }} {{ t('building.residents') }}</span>
              <span class="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-lg border border-amber-100 dark:border-amber-900">
                {{ t('buildings.managerLabel') }}: {{ b.managerId === (currentUser?.id || '') ? t('buildings.you') : t('buildings.other') }}
              </span>
            </div>
          </div>
        </NuxtLink>
      </AppCard>
      <EmptyState v-if="buildings.length === 0" :title="t('buildings.noBuildings')" :message="t('buildings.noBuildingsHint')" />
    </div>
  </div>
</template>
