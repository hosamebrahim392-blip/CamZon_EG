# CamZone-EG | كاميرات مراقبة وتركيب 🇪🇬

المنصة الذكية المتكاملة لحساب وتصميم ومحاكاة باقات كاميرات المراقبة في مصر مع المصمم ثلاثي الأبعاد ووضع الفني ومتجر المكونات.

---

## 🚀 كيفية تشغيل المشروع محلياً (Local Development)

1. **تثبيت التبعيات**:
```bash
npm install
```

2. **تشغيل خادم التطوير**:
```bash
npm run dev
```
سيعمل المشروع على الرابط: `http://localhost:3000`

3. **بناء المشروع للإنتاج (Production Build)**:
```bash
npm run build
```
سيقوم هذا الأمر ببناء ملفات الإنتاج في مجلد `dist/` ونسخها تلقائياً إلى مجلد `docs/` لدعم النشر المباشر.

---

## 📦 رفع المشروع إلى مستودع GitHub جديد (New Repository)

1. أنشئ مستودعاً جديداً على حسابك في GitHub (مثلاً: `CamZone-EG`).
2. في مجلد المشروع، قم بتنفيذ الأوامر التالية:

```bash
git init
git add .
git commit -m "feat: initial release of CamZone-EG"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_NEW_REPO_NAME.git
git push -u origin main
```

---

## 🌐 تفعيل الاستضافة الحية على GitHub Pages

يدعم المشروع طريقتين للنشر المباشر:

### الطريقة الأولى: عبر GitHub Actions (موصى بها)
1. ادخل إلى إعدادات المستودع **Settings** -> **Pages**.
2. تحت قسم **Build and deployment**، اختر **Source**: `GitHub Actions`.
3. سيعمل ملف `.github/workflows/deploy.yml` المرفق تلقائياً ببناء ونشر الموقع عند كل Push.

### الطريقة الثانية: عبر مجلد `/docs`
1. ادخل إلى **Settings** -> **Pages**.
2. اختر **Source**: `Deploy from a branch`.
3. اختر الفرع: `main` والمجلد: `/docs`.
4. اضغط **Save** وسيعمل الموقع الحي فوراً.

---

## ⚙️ إعدادات Supabase (قاعدة البيانات والـ RLS)
- رابط المشروع: `https://qlzgcwmdaiverqrbmmah.supabase.co`
- تم تضمين ملف الإعدادات في `config.js` و `src/config.ts`.
- كود الـ SQL وسياسات الأمان متوفر داخل لوحة الفني `TechnicianPortal.tsx`.
