# وضعیت فعلی — اول این را بخوان

این سند منبع حقیقت برای ادامه کار است. `BACKEND.md`، `docs/DATA-MODEL.md`، `docs/FLOWS.md` و بخش صفحات `README.md` قدیمی‌اند (استور کوکی، ورود با ایمیل، Netlify). برای باگ و فیچر جدید همین فایل و کدهای اشاره‌شده کافی است؛ کل ریپو را از نو نگرد.

تاریخ این وضعیت: ۱۳ اکتبر ۲۰۲۶. تغییرات هنوز روی git کامیت نشده‌اند. سرور با آرشیو همین درخت کد بالا آمده، نه با `git pull`.

## محصول

اپ فارسی RTL مدیریت ساختمان. UI همان برنچ `main` (Nuxt 4 + Nuxt UI 4) است و داده در Postgres است، نه کوکی.

| لایه | کجا |
| --- | --- |
| صفحات و کامپوننت | `app/` |
| استور کلاینت | `app/composables/useAppStore.ts` — `GET /api/bootstrap` و mutationهای API، نگهداشت در `useState` |
| نشست | `app/composables/useAuth.ts` — کوکی HttpOnly `hs_session`؛ آبجکت کاربر در `useState('auth-user')` |
| fetch | `app/composables/useApi.ts` + `app/utils/api.ts` — بدنه موفق `{ success, data }` |
| API | `server/api/**` |
| قوانین | `server/services/**` |
| اسکیما | `server/database/schema.ts` ، مایگریشن `server/database/migrations/0000_init.sql` |
| اعتبارسنجی | `shared/schemas/index.ts` |
| تایپ مشترک | `shared/types/index.ts` (با `app/types` ممکن است فاصله بگیرد) |

`useStoreRefs` و `app/data/seed.ts` و `app/data/providers.ts` حذف شده‌اند. دمو فقط با `pnpm db:seed` وارد دیتابیس می‌شود.

## ورود

فقط موبایل + OTP. رمز عبور نیست.

- `POST /api/auth/otp/request` با `{ phone, purpose: "login" | "register" }`
- `POST /api/auth/otp/verify` با `{ phone, code, name?, role? }` — کوکی را سرور می‌گذارد
- `GET /api/auth/me` ، `POST /api/auth/logout` ، `PATCH /api/me` (فقط نام)
- شماره نرمال به `09xxxxxxxxx`
- اگر `KAVENEGAR_API_KEY` خالی باشد پیامک نمی‌رود و کد `OTP_DEV_CODE` (پیش‌فرض `1111`) است و در پاسخ request فیلد `devCode` می‌آید
- اگر کلید ست باشد کد ۴ رقمی تصادفی با Kavenegar (`server/services/sms/kavenegar.ts`) می‌رود
- کلاینت نمی‌تواند نقش `superadmin` بسازد

## مدل دامنه (نسخه کامل‌تر UI)

- شارژ: مبلغ سهم هر واحد؛ وضعیت از روی `charge_payments` (یک پرداخت برای هر عضو). وضعیت سطح کل شارژ نداریم.
- عضو می‌تواند بدون `userId` باشد؛ `unitStatus` برابر `owner | tenant`.
- واحد: `number` و `floor` عدد صحیح. ساخت ساختمان با `unitCount` واحد می‌سازد (۴ تا در هر طبقه).
- دعوت یک‌بارمصرف، با نقش و انقضا. لینک: `/join?code=`.
- خدمات: پرچم «مورد اعتماد» برای هر ساختمان در `building_trusted_providers`، نه روی خود ارائه‌دهنده.
- اعلان‌ها در Postgres. تصویر اطلاعیه/رسید هنوز URL یا کلید محلی است؛ آپلود فایل روی سرور نیست.

## داده دمو (seed)

| نقش | موبایل |
| --- | --- |
| مدیر | 09121112233 |
| ساکن | 09123456789 |
| سوپرادمین | 09120000000 |

کد OTP بدون کلید کاوه‌نگار: `1111`. ساختمان دمو: آسمان.

## سرور

- میزبان `188.121.107.118` ، مسیر `/root/projects/ham-sakhteman` ، پورت `3001`
- `docker-compose.yml`: سرویس `app` (node:22 ، pnpm 11.25 ، migrate + seed + build) و `postgres:16`
- شبکه داکر خارجی به نام `main`
- `.env` فقط روی سرور است (از `.env.example`). ولوم Postgres قبلی موقع این دیپلوی پاک شد چون اسکیما عوض شده بود
- بالا آمدن کانتینر یعنی نصب و بیلد داخل کانتینر؛ تغییر کد بدون ری‌استارت `app` دیده نمی‌شود

## دستورها

`pnpm install` ، `pnpm dev` ، `pnpm db:migrate` ، `pnpm db:seed` (ریست با `SEED_RESET=1`)، `pnpm test` ، `pnpm build`.

## روت‌های API

`GET /api/bootstrap` بسته UI است. بقیه: auth بالا؛ buildings و زیرمجموعه‌های units، members، invitations، announcements، problems، charges، expenses، providers؛ `POST /api/invitations/join`؛ charges با payments؛ notifications و `read-all`؛ `GET /api/admin/overview`؛ providers لیست و جزئیات.

## موقع تغییر

1. فیلد UI را با `shared/schemas` و `server/utils/present.ts` یکی نگه دار.
2. منطق را در `server/services` بگذار، نه در صفحه Vue.
3. بعد از تغییر اسکیما مایگریشن جدید بساز؛ `0000_init.sql` را برای دیتابیس پروداکشن بازنویسی نکن.
4. این فایل را اگر رفتار محصول عوض شد به‌روز کن.
