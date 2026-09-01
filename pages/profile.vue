<script setup lang="ts">
const { locale, switchLocale } = useAppLocale()
const auth = useAuth()
const { buildings } = useBuildings()
const currentBuilding = computed(() => buildings.value[0] || null)
</script>

<template>
  <div>
    <AppHeader title="حساب من" subtitle="تنظیمات و اطلاعات" back />

    <section class="mb-6">
      <AppCard padding="lg">
        <div class="flex items-center gap-4">
          <UserAvatar :name="(auth.user as any)?.name || 'علی رضایی'" :initials="(auth.user as any)?.avatarInitials || 'ع ر'" avatar-size="lg" />
          <div>
            <h2 class="text-xl font-extrabold text-slate-900 leading-none">{{ (auth.user as any)?.name || 'علی رضایی' }}</h2>
            <p class="text-sm text-slate-400 font-medium mt-1">{{ currentBuilding ? currentBuilding.address : 'واحد ۴۰۲ — طبقه ۴' }}</p>
            <div class="flex items-center gap-2 mt-2">
              <span class="text-xs font-bold bg-primary-50 text-primary-700 px-2 py-0.5 rounded-md border border-primary-100">{{ (auth.user as any)?.role === 'manager' ? 'مدیر' : 'ساکن' }}</span>
              <span class="text-xs font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-100">عضو از ۱۴۰۲</span>
            </div>
          </div>
        </div>
      </AppCard>
    </section>

    <PageHeader title="اطلاعات شخصی" subtitle="ویرایش پروفایل" />
    <AppCard padding="md" class="mb-6">
      <div class="grid md:grid-cols-2 gap-3">
        <AppInput label="نام" model-value="علی" />
        <AppInput label="نام خانوادگی" model-value="رضایی" />
        <AppInput label="شماره تماس" model-value="۰۹۱۲۱۲۳۴۵۶۷" type="tel" />
        <AppInput label="ایمیل" model-value="ali@example.com" type="email" />
      </div>
      <div class="mt-3 flex justify-end gap-2">
        <button class="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-sm transition-colors">لغو</button>
        <button class="h-11 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-extrabold shadow-soft text-sm transition-colors">ذخیره تغییرات</button>
      </div>
    </AppCard>

    <PageHeader title="تنظیمات" subtitle="ترجیحات شما" />
    <AppCard padding="md" class="mb-6">
      <div class="flex items-center justify-between py-2">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shadow-soft border border-violet-100">
            <Icon name="i-lucide-globe" class="w-4 h-4" />
          </div>
          <div>
            <div class="text-sm font-extrabold text-slate-900">زبان</div>
            <div class="text-xs text-slate-400 font-medium">فارسی / English</div>
          </div>
        </div>
        <button @click="switchLocale(locale === 'fa' ? 'en' : 'fa')" class="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold shadow-soft">{{ locale === 'fa' ? 'English' : 'فارسی' }}</button>
      </div>
      <div class="border-t border-slate-100 my-2" />
      <div class="flex items-center justify-between py-2">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-soft border border-amber-100">
            <Icon name="i-lucide-bell-ring" class="w-4 h-4" />
          </div>
          <div>
            <div class="text-sm font-extrabold text-slate-900">اعلان‌های صوتی</div>
            <div class="text-xs text-slate-400 font-medium">هشدارهای فوری</div>
          </div>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked class="sr-only peer" />
          <div class="w-10 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-primary-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
        </label>
      </div>
    </AppCard>

    <AppCard padding="md" class="mb-6">
      <div class="flex items-center gap-3 text-rose-600 hover:text-rose-700 cursor-pointer transition-colors" @click="auth.logout()">
        <Icon name="i-lucide-log-out" class="w-5 h-5" />
        <span class="text-sm font-extrabold">خروج از حساب</span>
      </div>
    </AppCard>
  </div>
</template>
