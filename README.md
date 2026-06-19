# منصة صحة — مشروع متكامل (Vercel + GitHub)

## محتويات المشروع
```
seha-full/
├── public/
│   ├── index.html          صفحة التحقق (الواجهة الرئيسية)
│   ├── stylee.css          أنماط الواجهة
│   ├── script.js           منطق البحث في قاعدة البيانات
│   ├── data.json           قاعدة بيانات الإجازات (تُحدَّث تلقائياً)
│   ├── VisitReport.html    نموذج مشهد المراجعة
│   └── MedicalReport.html  نموذج التقرير الطبي / الإجازة المرضية
├── api/
│   └── save.js             Serverless Function لحفظ إجازة جديدة في data.json
├── vercel.json
├── package.json
└── README.md
```

## آلية العمل
1. تفتح `VisitReport.html` أو `MedicalReport.html`، تُدخل البيانات وتضغط **توليد التقرير النهائي**.
2. يقوم الكود قبل فتح نافذة الطباعة بإرسال بيانات الإجازة إلى `/api/save`.
3. الـ Function تحرّر `public/data.json` مباشرة في GitHub، فتتحدّث على Vercel خلال ثوانٍ.
4. عند زيارة الصفحة الرئيسية وإدخال **رمز الإجازة + رقم الهوية**، يظهر السجل فوراً.

## خطوات النشر

### 1) أنشئ مستودعاً جديداً في GitHub
- ارفع كامل محتويات هذا المجلد كما هو.

### 2) أنشئ Token من GitHub
- Settings → Developer Settings → Personal access tokens → **Fine-grained tokens** → Generate
- Repository access: حدّد المستودع الذي رفعت إليه المشروع.
- Permissions → Repository → **Contents: Read & write**.
- انسخ الـ Token (يبدأ بـ `github_pat_...`).

### 3) أنشئ مشروعاً في Vercel
- Import المستودع. الإطار: **Other**. مجلد Output: `public`.

### 4) أضف متغيرات البيئة في Vercel (Settings → Environment Variables)
| الاسم            | القيمة                                  |
|------------------|------------------------------------------|
| `GITHUB_TOKEN`   | الـ Token من الخطوة 2                    |
| `GITHUB_OWNER`   | اسم مستخدمك / منظمتك في GitHub          |
| `GITHUB_REPO`    | اسم المستودع                             |
| `GITHUB_BRANCH`  | `main` (أو الفرع المستخدم)              |
| `FILE_PATH`      | `public/data.json`                       |
| `ADMIN_TOKEN`    | (اختياري) كلمة سر لمنع الإضافة العامة   |

### 5) أعد النشر (Redeploy) بعد إضافة المتغيرات.

## ملاحظات
- يتم منع التكرار تلقائياً (نفس `leaveCode` + `nationalId`).
- يمكن فتح التحقق بالرابط مباشرةً: `https://yourdomain/?code=XXXX&id=YYYY`
- لزيادة الأمان فعّل `ADMIN_TOKEN` وأضِفه في كود التقرير عند `fetch('/api/save', { headers: { 'X-Admin-Token': '...' } })`.
- التخزين دائم لأنه ملف داخل المستودع نفسه — لا حاجة لقاعدة بيانات خارجية.
