# Seha Platform - منصة صحة

## هيكل المشروع
```
seha-full/
├── api/
│   └── save.js              # نقطة API لحفظ التقارير في data.json عبر GitHub
├── public/
│   ├── index.html           # صفحة الاستعلام (/ و /verify)
│   ├── MedicalReport.html   # صفحة إدخال التقرير الطبي (/medical)
│   ├── VisitReport.html     # صفحة إدخال تقرير الزيارة (/visit)
│   ├── script.js            # منطق صفحة الاستعلام
│   ├── stylee.css           # التنسيقات
│   └── data.json            # قاعدة البيانات (تُحدّث تلقائياً)
├── package.json
├── vercel.json              # إعدادات Vercel والمسارات
└── README.md
```

## تدفق العمل
1. افتح `/medical` أو `/visit` → أدخل بيانات التقرير → اطبع.
2. عند الطباعة يُرسل التقرير تلقائياً إلى `/api/save` → يُحفظ في `public/data.json` داخل مستودع GitHub.
3. زر التحقق في التقرير المطبوع يفتح `/` (صفحة الاستعلام).
4. أدخل **رمز الخدمة** + **رقم الهوية** → تظهر بيانات التقرير.

## النشر على GitHub + Vercel

### 1) رفع المشروع إلى GitHub
GitHub لا يقبل ملفات zip، يقبل الملفات والمجلدات. لديك ثلاث طرق:

**أ. عبر واجهة GitHub (أسهل):**
- أنشئ مستودع جديد (Empty repository).
- اضغط **Add file → Upload files**.
- اسحب **محتويات** مجلد `seha-full` (لا المجلد نفسه): `api/`, `public/`, `package.json`, `vercel.json`, `README.md`.
  - ملاحظة: GitHub يقبل سحب المجلدات بالكامل في ال��تصفح (Chrome/Edge/Firefox).
- اضغط **Commit changes**.

**ب. عبر Git (موصى به):**
```bash
cd seha-full
git init
git add .
git commit -m "initial"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

**ج. عبر GitHub Desktop:** اسحب المجلد إلى التطبيق ثم Publish.

### 2) متغيرات البيئة المطلوبة في Vercel
- `GITHUB_TOKEN` — Fine-grained token (Contents: Read & write)
- `GITHUB_OWNER` — اسم المستخدم/المنظمة
- `GITHUB_REPO` — اسم المستودع
- `GITHUB_BRANCH` — `main`
- `FILE_PATH` — `public/data.json`
- `ADMIN_TOKEN` (اختياري)

### 3) النشر
- Import repo في Vercel → Framework: **Other** → Output: `public` → Deploy.
