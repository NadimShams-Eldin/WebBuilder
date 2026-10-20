# تشغيل قطمة على كل منصة

المحرّر تطبيق ويب (React + Vite). لا يحتاج قاعدة بيانات. المتطلب الوحيد:
**Node.js 20 أو أحدث** وnpm.

المستودع: https://github.com/NadimShams-Eldin/WebBuilder

## 1. الحصول على المشروع

```bash
git clone https://github.com/NadimShams-Eldin/WebBuilder.git
cd WebBuilder
```

أو نزّل ZIP من GitHub (Code → Download ZIP) وفكّه ثم ادخل المجلد.

## 2. Windows

1. ثبّت Node.js LTS من https://nodejs.org
2. افتح PowerShell داخل مجلد المشروع:

```powershell
npm install
npm run dev
```

أو:

```powershell
.\scripts\dev.ps1
```

افتح http://localhost:5173

البناء للإنتاج:

```powershell
npm run build
npm run preview
```

## 3. macOS

1. ثبّت Node عبر https://nodejs.org أو:

```bash
brew install node
```

2. داخل مجلد المشروع:

```bash
chmod +x scripts/*.sh
./scripts/dev.sh
```

أو:

```bash
npm install
npm run dev
```

افتح http://localhost:5173

## 4. Linux

1. ثبّت Node 20+ (مثال Debian/Ubuntu):

```bash
sudo apt-get update
sudo apt-get install -y nodejs npm
```

أو استخدم https://nodejs.org / nvm.

2. داخل مجلد المشروع:

```bash
chmod +x scripts/*.sh
./scripts/dev.sh
```

افتح http://localhost:5173

## 5. Docker

لا تحتاج Node على الجهاز:

```bash
docker compose up --build
```

ثم افتح http://localhost:8080

بدون Compose:

```bash
docker build -t qitma .
docker run --rm -p 8080:80 qitma
```

## 6. أوامر الجودة

```bash
npm test
npm run lint
npx tsc -b
```

أو دفعة واحدة:

```bash
npm run check
```

على Unix: `./scripts/check.sh`

## 7. هيكل المجلدات

```
src/editor/     منطق المحرّر والحالة
src/components/ واجهة المحرّر
src/export/     توليد الموقع وZIP
src/view/       عارض الموقع المنشور
src/blocks/     تعريفات القطع
docs/           الخطة والسجلات
scripts/        تشغيل وتحقق لكل منصة
docker/         إعداد nginx للحاوية
public/         أصول ثابتة والنموذج التجريبي
```

## 8. إرسال المشروع لصديق

- **المحرّر كاملًا:** أرسل رابط GitHub أو ZIP للمجلد (بدون `node_modules` و`dist`).
- **موقع بناه في قطمة:** من المحرّر «نشر» لنسخ رابط، أو «تصدير ويب» لملف ZIP يُفتح مباشرة في المتصفح.
