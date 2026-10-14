# بناء تطبيق حساباتي (ELYAMANI Money) لأندرويد — تعليمات كاملة

> لم يتسنَّ لي تشغيل هذه الخطوات فعليًا في بيئتي (لا يوجد Android SDK ولا اتصال إنترنت لتنزيل Gradle/Capacitor هنا)، لذلك هذا الملف تعليمات دقيقة تنفذها أنت على جهازك. هذا موثّق بصراحة في تقرير QA المرفق تحت "لم يُختبر".

## المتطلبات (كلها مجانية)
1. **Node.js** (نسخة 18 أو أحدث) — https://nodejs.org
2. **Android Studio** (مجاني) — https://developer.android.com/studio
3. لا حاجة لحساب Google Play ولا لأي اشتراك مدفوع.

## الخطوات

### 1) تثبيت الحزم
افتح طرفية (Terminal) داخل مجلد `android-project` ونفّذ:
```bash
npm install
npx cap init "حساباتي" "com.elyamani.money" --web-dir www
```
(إن طلب منك تأكيد القيم الموجودة في `capacitor.config.json` اختر الإبقاء عليها كما هي — appId و appName مضبوطان مسبقًا.)

### 2) إضافة منصة أندرويد
```bash
npx cap add android
```
هذا يُنشئ مجلد `android/` بمشروع Android Studio كامل.

### 3) مزامنة ملفات الويب
بعد أي تعديل على ملفات `www/` (وهي نسخة من PWA: index.html, manifest.webmanifest, icon.svg, sw.js):
```bash
npx cap sync android
```

### 4) ضبط الأيقونة وشاشة البداية (Splash)
شعار ELYAMANI (`www/icon.svg`) جاهز بالألوان الرسمية (أسود #0A0E14 وذهبي #C5A059). لإنتاج أيقونات PNG بكل الأحجام المطلوبة لأندرويد:
```bash
npm install -g @capacitor/assets
npx capacitor-assets generate --android
```
هذه الأداة مجانية بالكامل وتعمل محليًا من ملف `icon.svg` نفسه الذي لم يُعدَّل بأي شكل.

### 5) ضبط الصلاحيات (أقل صلاحيات ممكنة)
افتح `android/app/src/main/AndroidManifest.xml` بعد `cap add android` وتأكد أنه **لا يحتوي** على أي من:
```xml
<uses-permission android:name="android.permission.READ_SMS" />
<uses-permission android:name="android.permission.READ_CONTACTS" />
<uses-permission android:name="android.permission.CALL_LOG" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.CAMERA" />
```
Capacitor الأساسي لا يضيف أيًا منها افتراضيًا. الإضافات المستخدمة هنا (`local-notifications`, `filesystem`, `share`) تحتاج فقط صلاحية الإشعارات على أندرويد 13+ (`POST_NOTIFICATIONS`) وصلاحية تخزين محدودة للنسخ الاحتياطي — راجع الـ manifest بعد البناء وتأكد عدم وجود صلاحيات زائدة.

### 6) ضبط زر الرجوع / RTL / لوحة المفاتيح
- زر الرجوع: Capacitor يتعامل معه تلقائيًا مع WebView؛ تم بناء الواجهة بحيث تستخدم `dialog` للنوافذ المنبثقة والتي يُغلقها زر الرجوع افتراضيًا في WebView الحديث.
- RTL: الصفحة بالكامل `dir="rtl" lang="ar"` من جذر `<html>`، وهذا يُفعّل RTL تلقائيًا في WebView بدون إعداد إضافي.
- لوحة المفاتيح: الحقول الرقمية تستخدم `inputmode="decimal"` أو `inputmode="numeric"` فتظهر لوحة أرقام مناسبة.

### 7) بناء Debug APK (للاختبار على هاتفك)
```bash
npx cap sync android
cd android
./gradlew assembleDebug
```
الناتج: `android/app/build/outputs/apk/debug/app-debug.apk` — انقله لهاتفك وثبّته مباشرة (فعّل "السماح بالتثبيت من مصادر غير معروفة" في إعدادات أندرويد).

### 8) إنشاء Android Keystore (لتوقيع نسخة Release)
```bash
keytool -genkey -v -keystore elyamani-release.keystore -alias elyamani -keyalg RSA -keysize 2048 -validity 10000
```
سيطلب منك كلمة مرور ومعلومات — اخترها بنفسك واحتفظ بها.

**تحذير مهم جدًا:**
- **لا** ترفع ملف `elyamani-release.keystore` إلى GitHub أو أي مكان عام.
- **لا** تضع كلمة مرور الـ Keystore داخل الكود المصدري.
- احتفظ بهذا الملف وبكلمة المرور في مكان آمن (مثلًا مدير كلمات مرور + نسخة احتياطية مشفرة). **فقدان هذا الملف يمنعك من تحديث التطبيق مستقبلًا بنفس التوقيع**، وستضطر لإصدار تطبيق جديد بمعرّف مختلف.

### 9) بناء Release APK موقّع
أنشئ ملف `android/keystore.properties` (ولا تضيفه لأي نظام تحكم بالنسخ عام):
```properties
storeFile=../../elyamani-release.keystore
storePassword=PUT_YOUR_PASSWORD_HERE
keyAlias=elyamani
keyPassword=PUT_YOUR_PASSWORD_HERE
```
ثم في `android/app/build.gradle` أضف داخل `android { ... }`:
```groovy
def keystoreProps = new Properties()
def keystorePropsFile = rootProject.file('keystore.properties')
if (keystorePropsFile.exists()) {
    keystoreProps.load(new FileInputStream(keystorePropsFile))
}
signingConfigs {
    release {
        storeFile file(keystoreProps['storeFile'] ?: 'none')
        storePassword keystoreProps['storePassword']
        keyAlias keystoreProps['keyAlias']
        keyPassword keystoreProps['keyPassword']
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
    }
}
```
ثم:
```bash
./gradlew assembleRelease
```
الناتج: `android/app/build/outputs/apk/release/app-release.apk` — هذا هو الملف الجاهز للتوزيع والتثبيت المباشر بدون Google Play.

## تحديث التطبيق مستقبلًا
1. عدّل الملفات في `www/` (أو في `index.html` الأصلي ثم انسخه إلى `android-project/www/`).
2. ارفع رقم `versionCode` و `versionName` في `android/app/build.gradle`.
3. `npx cap sync android`
4. `./gradlew assembleRelease` بنفس الـ Keystore المحفوظ من الخطوة 8 (إلزامي لنفس التوقيع).
5. وزّع الـ APK الجديد لمستخدميك (نسخ مباشر، أو من داخل التطبيق نفسه لاحقًا إذا أضفت فحص تحديثات).

## تثبيت APK على الهاتف (للمستخدم النهائي)
1. انقل ملف `app-release.apk` (أو `app-debug.apk` للاختبار) إلى الهاتف.
2. افتح إعدادات أندرويد → الأمان → فعّل "تثبيت من مصادر غير معروفة" لتطبيق الملفات الذي ستستخدمه لفتح الـ APK.
3. افتح الملف من مدير الملفات واتبع خطوات التثبيت.
4. لا حاجة لأي حساب Google أو Play Store.
