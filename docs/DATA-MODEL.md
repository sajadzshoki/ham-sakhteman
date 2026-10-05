# مدل داده هم‌ساختمان

این سند معماری داده **فعلی** اپ را مستند می‌کند (نه یک طراحی آرمانی). همه موارد
زیر از روی کد واقعی (`app/types/index.ts`، `app/composables/useStoreRefs.ts`،
`app/composables/useAppStore.ts`، `app/data/*`) استخراج شده‌اند.

## ذخیره‌سازی

- اپ در فاز نمایشی است؛ لایه حالت کوکی‌محور و سازگار با SSR است تا در اتصال بک‌اند
  واقعی فقط همین لایه جایگزین شود.
- کوکی‌ها (پیشوند `ham-`) در `useStoreRefs()` یک‌بار در هر درخواست ساخته می‌شوند و بین
  کامپوننت‌ها/میدلورها مشترک‌اند. مجموعه‌های پرمحتوا با پایه۶۴ (`useBase64JsonCookie`)
  ذخیره می‌شوند تا از سقف حجم هدر عبور نکنند.
- دو داده عمداً خارج از کوکی‌اند:
  - **تصاویر آپلودی**: دیتای فشرده‌شده در `localStorage` با کلید مرجع `img:` (`app/utils/image.ts`).
  - **اعلان‌ها**: `localStorage` (`useClientJsonStore`)؛ سرور اسکلت رندر می‌کند و کلاینت
    پس از mount جایگزین می‌کند (الگوی `AppImage`) تا بودجه کوکی حفظ شود.
- دیتای دمو با اولین بازدید بذرپاشی می‌شود (`ensureSeeded` در میدلور سراسری) و کوکی
  `ham-seeded` از بذرپاشی مجدد جلوگیری می‌کند. اگر این کوکی از بین برود ولی ساختمانی
  از قبل وجود داشته باشد، داده‌های کاربر دوباره با دمو جایگزین نمی‌شوند.

---

## AuthUser

کاربر حساب اپ (ورود با رمز عبور؛ معماری آماده برای OTP).

| فیلد | نوع | الزامی | توضیح |
| --- | --- | --- | --- |
| id | string | بله | `createId('user')` یا شناسه دمو (`user-manager`، `user-resident`، `user-admin`) |
| name | string | بله | نام نمایشی |
| phone | string | بله | شماره موبایل؛ **شناسه ورود** و یکتا |
| role | MemberRole | بله | `manager` / `resident` / `superadmin` |
| password | string | خیر | فقط نسخه نمایشی؛ در بک‌اند واقعی سمت کلاینت ذخیره نمی‌شود |
| createdAt | string (ISO) | بله | زمان ساخت حساب |

- ذخیره در کوکی‌های `ham-users` (فهرست) و `ham-user` (نشست فعلی).
- رابطه: `AuthUser → BuildingMember.userId` (حداکثر یک عضویت فعال).
- قید: نقش `superadmin` سطح پلتفرم است و عضو ساختمان نمی‌شود.

## Building

| فیلد | نوع | الزامی | توضیح |
| --- | --- | --- | --- |
| id | string | بله | |
| name | string | بله | نام ساختمان |
| address | string | بله | آدرس |
| unitsCount | number | بله | تعداد واحدهای تعریف‌شده (با افزودن واحد خودکار به‌روز می‌شود) |
| description | string | خیر | |
| managerId | string | بله | شناسه AuthUser سازنده |
| createdAt | string | بله | |

- رابطه: `Building → BuildingUnit[]`، `Building → BuildingMember[]`،
  `Building → Invitation[]`، `Building → Announcement[]`، `Building → ProblemReport[]`،
  `Building → BuildingCharge[]`، `Building → Expense[]`.
- قید: هر کاربر حداکثر عضو یک ساختمان است (`membershipOfUser`).

## BuildingUnit

| فیلد | نوع | الزامی | توضیح |
| --- | --- | --- | --- |
| id | string | بله | |
| buildingId | string | بله | رابطه به Building |
| number | number | بله | شماره واحد |
| floor | number | بله | طبقه |

- قید: هر واحد حداکثر یک عضو اصلی دارد؛ تخصیص واحد به عضو جدید، عضو قبلی را آزاد می‌کند.
- حذف واحد، اعضای تخصیص‌یافته را آزاد می‌کند (`removeUnit`).
- تولید خودکار در `createBuilding`: هر طبقه ۲ واحد.

## BuildingMember

عضویت یک شخص در ساختمان (با یا بدون حساب کاربری).

| فیلد | نوع | الزامی | توضیح |
| --- | --- | --- | --- |
| id | string | بله | |
| buildingId | string | بله | |
| userId | string | خیر | فقط اگر حساب کاربری داشته باشد |
| name | string | بله | |
| phone | string | خیر | |
| role | BuildingRole | بله | `manager` / `resident` |
| unitId | string | خیر | واحد تخصیص‌یافته |
| unitStatus | UnitStatus | خیر | `owner` / `tenant` (فقط همراه unitId) |
| joinedAt | string | بله | |

- قید: سازنده ساختمان عضو مدیر است. دعوت یا افزودن عضو با نقش مدیر، دسترسی مدیریت را به همان عضویت می‌دهد و نقش حساب پس از پیوستن با نقش دعوت هم‌تراز می‌شود. سوپرادمین عضو ساختمان نمی‌شود.
- اعضای بدون `userId` (مثلاً دمو) وارد اپ نمی‌شوند ولی در شمارش سهم شارژ و فهرست اعضا لحاظ‌اند.

## Invitation

| فیلد | نوع | الزامی | توضیح |
| --- | --- | --- | --- |
| id | string | بله | |
| buildingId | string | بله | |
| code | string | بله | کد ۶ کاراکتری اشتراک‌پذیر |
| role | BuildingRole | بله | نقش پس از پیوستن |
| createdBy | string | بله | |
| createdAt / expiresAt | string | بله | اعتبار یک‌ساله |
| status | InvitationStatus | بله | `active` / `used` / `expired` (انقضا هنگام خواندن محاسبه می‌شود) |

- قید: پیوستن با کد فعال، عضو می‌سازد و کد را `used` می‌کند؛ کاربر دارای عضویت، خطای `duplicate` می‌گیرد.

## Announcement

| فیلد | نوع | الزامی | توضیح |
| --- | --- | --- | --- |
| id | string | بله | |
| buildingId | string | بله | |
| title / body | string | بله | |
| importance | `normal` / `important` | بله | |
| image | string | خیر | کلید مرجع `img:` |
| createdBy / createdByName | string | بله | نویسنده (اسم به‌صورت snapshot) |
| createdAt | string | بله | |
| updatedAt | string | خیر | |

- فقط مدیر ایجاد/ویرایش/حذف می‌کند؛ ساکن فقط مشاهده.

## ProblemReport

| فیلد | نوع | الزامی | توضیح |
| --- | --- | --- | --- |
| id | string | بله | |
| buildingId | string | بله | |
| category | ProblemCategory | بله | آب/برق/آسانسور/گاز/مشاعات/نظافت/سایر |
| title / description | string | بله | |
| image | string | خیر | کلید مرجع `img:` |
| status | ProblemStatus | بله | `new` / `in-progress` / `resolved` |
| reportedBy / reportedByName | string | بله | گزارش‌دهنده (AuthUser id) |
| createdAt / updatedAt? | string | بله/خیر | |

- ساکن فقط گزارش‌های خودش را می‌بیند؛ مدیر همه را. تغییر وضعیت فقط مدیر
  (و برای گزارش‌دهنده اعلان می‌سازد).

## BuildingCharge

دوره شارژ؛ هر عضو ساختمان یک سهم با مبلغ یکسان دارد.

| فیلد | نوع | الزامی | توضیح |
| --- | --- | --- | --- |
| id | string | بله | |
| buildingId | string | بله | |
| title | string | بله | |
| period | string | بله | مثال: شهریور ۱۴۰۵ |
| amount | number | بله | مبلغ سهم هر واحد (تومان) |
| dueAt | string | بله | سررسید |
| notes | string | خیر | |
| createdBy / createdByName / createdAt | | بله | |

- قید: وضعیت پرداخت **ذخیره نمی‌شود**؛ از رکورد پرداخت و سررسید مشتق می‌شود
  (`chargeStatusFor`): پرداخت → `paid`؛ سررسید گذشته و بی‌پرداخت → `overdue`؛ وگرنه `unpaid`.
- حذف شارژ، همه پرداخت‌های آن را هم حذف می‌کند.

## ChargePayment

| فیلد | نوع | الزامی | توضیح |
| --- | --- | --- | --- |
| id | string | بله | |
| chargeId | string | بله | رابطه به BuildingCharge |
| memberId / memberName | string | بله | رابطه به BuildingMember |
| amount | number | بله | تومان |
| paidAt | string | بله | تاریخ پرداخت |
| note | string | خیر | |
| method | `'manual'` | بله | برای پرداخت آنلاین آینده باز نگه داشته شده |
| recordedBy | string | بله | مدیر ثبت‌کننده |

- قید: هر عضو برای هر شارژ حداکثر یک رکورد (`recordPayment` در تکرار `null` برمی‌گرداند).

## Expense

| فیلد | نوع | الزامی | توضیح |
| --- | --- | --- | --- |
| id | string | بله | |
| buildingId | string | بله | |
| title | string | بله | |
| amount | number | بله | تومان |
| category | ExpenseCategory | بله | آب/گاز/برق/آسانسور/نظافت/تعمیرات/سایر |
| date | string | بله | تاریخ وقوع |
| notes | string | خیر | |
| receipt | string | خیر | کلید مرجع تصویر رسید |
| createdBy / createdByName / createdAt | | بله | |

- شفاف برای همه اعضا؛ حذف فقط مدیر (تصویر رسید هم پاک می‌شود).

## ServiceCategory (متادیتا)

داده پلتفرم در `app/data/mock.ts` (`providerCategories`)؛ موجودیت ذخیره‌شده نیست.

| فیلد | توضیح |
| --- | --- |
| id | `plumbing, electrical, elevator, cleaning, painting, cooler, heating, installations, glazing, locksmith, other` |
| label / icon / tint | برچسب فارسی، آیکون lucide و رنگ آواتار |

## ServiceProvider

دایره خدمات؛ داده استاتیک پلتفرم (`app/data/providers.ts`) — در کوکی ذخیره نمی‌شود.

| فیلد | نوع | الزامی | توضیح |
| --- | --- | --- | --- |
| id | string | بله | `sp-*` |
| name | string | بله | |
| category | ProviderCategory | بله | رابطه به متادیتای دسته |
| description | string | بله | |
| rating | number | بله | از ۵ |
| phone | string | بله | ارقام لاتین برای `tel:` |
| serviceArea | string | بله | محدوده خدمات |
| workingHours | string | بله | |
| image | string | خیر | مسیر عمومی (`/images/providers/*`) |

- **مورد اعتماد ساختمان**: جدا از مدل، در کوکی پایه۶۴ `ham-trusted-providers`
  به‌صورت `Record<buildingId, providerId[]>`؛ فقط مدیر تغییر می‌دهد؛
  مرتب‌سازی «مورد اعتماد اول» و نشان طلایی از آن مشتق می‌شود.

## AppNotification

اعلان درون‌اپی؛ فقط در `localStorage` (کلید `ham-notifications`)، سقف ۸ رکورد برای هر کاربر.

| فیلد | نوع | الزامی | توضیح |
| --- | --- | --- | --- |
| id | string | بله | `ntf-*` |
| userId | string | بله | گیرنده (AuthUser) |
| type | NotificationType | بله | `announcement`, `announcement-important`, `problem-new`, `problem-status`, `charge-new`, `payment-recorded` |
| title | string | بله | |
| body | string | خیر | |
| link | string | خیر | مسیر صفحه مرتبط (همیشه به موجودیت واقعی اشاره می‌کند) |
| createdAt | string | بله | |
| readAt | string | خیر | وضعیت خوانده‌شده |

- تولید در اکشن‌های استور برای کاربران مقصد (به‌جز انجام‌دهنده عمل).

---

## روابط کلی

- `AuthUser → BuildingMember → Building`
- `Building → Units / Members / Invitations / Announcements / ProblemReports / Charges / Expenses`
- `Charge → ChargePayments` (و پرداخت → عضو)
- `ServiceCategory → ServiceProviders`
- `Building → trustedProviderIds ← ServiceProvider`
- `AuthUser → Notifications`

## قواعد کسب‌وکار (پیاده‌سازی‌شده)

1. هر کاربر حداکثر عضو یک ساختمان است.
2. ساکن بدون ساختمان به `/building` یا `/join` هدایت می‌شود؛ مسیرهای داخلی گارد دارند.
3. اقدام‌های نوشتنی ساختمان/مالی/اعلان فقط مدیر؛ سوپرادمین فقط `/admin`.
4. هر واحد یک عضو اصلی؛ هر عضو برای هر شارژ یک پرداخت.
5. وضعیت شارژ مشتق‌شده است (نه ذخیره‌شده).
6. گزارش مشکل برای ساکنِ دیگر قابل مشاهده نیست (متا هم افشا نمی‌شود).
7. اعلان به انجام‌دهنده عمل نمی‌رسد.
8. حذف‌های مخرب (واحد/عضو/شارژ/اطلاعیه/هزینه/دعوت/پرداخت) همه با دیالوگ تأیید.

## TODO / محدودیت‌های شناخته‌شده داده

- پرداخت آنلاین نیست؛ `method` فقط `manual`.
- اعلان‌ها بین مرورگرها همگام نیستند (localStorage)؛ در بک‌اند واقعی باید سروری شوند.
- تصاویر در `localStorage` هر مرورگر است (آپلود واقعی سروری نیست).
- جستجوی خدمات فقط کلاینتی روی فهرست استاتیک است.
