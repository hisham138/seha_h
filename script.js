/**
 * سكريبت نظام منصة صحة لإدارة وتوثيق الإجازات المرضية حياً عبر Google Sheets
 * التوثيق: تم إعداد هذا الملف ليتوافق مع أبعاد وترتيب جدول البيانات المعتمد
 */

// ⚠️ ضع هنا الرابط الطويل الذي نسخته بنجاح من الـ Google Apps Script وينتهي بـ /exec
const GOOGLE_SCRIPT_URL = "ضع_رابط_جوجل_شيت_الخاص_بك_هنا";

// ==========================================
// 1. قسم إدارة الحفظ (خاص بصفحة المسؤول)
// ==========================================

/**
 * دالة حفظ مريض جديد: ترسل البيانات مباشرة إلى جوجل شيت بالترتيب العربي المثبت
 * @param {Object} leaveData - كائن يحتوي على بيانات الإجازة المرضية للمريض
 */
async function saveToGoogleSheets(leaveData) {
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("ضع_رابط")) {
    console.error("خطأ: لم يتم تكوين رابط قاعدة بيانات Google Sheets بعد.");
    return false;
  }

  try {
    // إرسال البيانات آلياً إلى سكريبت جوجل شيت عبر طلب POST آمن
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors", // لمنع قيود الحماية (CORS) أثناء الإرسال من الهواتف الذكية
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(leaveData) // تحويل كائن البيانات إلى نص JSON مرن
    });
    
    // حفظ نسخة احتياطية في الذاكرة المحلية للمتصفح لضمان استقرار العمل
    const localData = JSON.parse(localStorage.getItem("seha_leaves") || "[]");
    localData.push(leaveData);
    localStorage.setItem("seha_leaves", JSON.stringify(localData));
    
    console.log("تم مزامنة البيانات بنجاح مع جدول جوجل شيت المثبت.");
    return true; 
  } catch (error) {
    console.error("خطأ أثناء المزامنة الحية مع قاعدة البيانات:", error);
    return false;
  }
}

// ==========================================
// 2. قسم الاستعلام والتحقق (خاص بصفحة المستخدم)
// ==========================================

/**
 * دالة جلب واستعلام: تبحث في جدول جوجل شيت بناءً على رمز الخدمة ورقم الهوية
 * @param {string} serviceCode - رمز الخدمة أو الإجازة المدخل
 * @param {string} identityNumber - رقم الهوية أو الإقامة المدخل
 */
async function searchInGoogleSheets(serviceCode, identityNumber) {
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("ضع_رابط")) {
    console.error("خطأ: لم يتم تكوين رابط قاعدة بيانات Google Sheets بعد.");
    return null;
  }

  try {
    // جلب مصفوفة البيانات الحية من دالة doGet البرمجية في السكريبت
    const response = await fetch(GOOGLE_SCRIPT_URL);
    const result = await response.json();
    const leaves = result.leaves || [];

    // المطابقة التامة والذكية لتفادي المسافات أو اختلافات الحروف
    const matchedRecord = leaves.find(record => 
      normalizeForCompare(record.serviceCode) === normalizeForCompare(serviceCode) &&
      normalizeForCompare(record.nationalId) === normalizeForCompare(identityNumber)
    );

    return matchedRecord || null;
  } catch (error) {
    console.error("خطأ أثناء استرجاع بيانات التحقق الفوري:", error);
    return null;
  }
}

/**
 * دالة معالجة النصوص لضمان دقة البحث وعدم تأثره بالمسافات الزائدة
 */
function normalizeForCompare(text) {
  if (!text) return "";
  return String(text).trim().toLowerCase();
}

// ==========================================
// 3. قسم التحكم والربط بالواجهة الرسومية (UI)
// ==========================================

/**
 * الدالة الأساسية المستدعاة عند ضغط المستخدم على زر "استعلام"
 */
async function validateAndCheckData() {
  // جلب العناصر المدخلة من شاشة هاتفك الأنيقة
  const serviceCodeInput = document.getElementById("serviceCode")?.value || "";
  const identityInput = document.getElementById("identityNumber")?.value || "";
  
  const loadingElement = document.getElementById("loadingStatus");
  if (loadingElement) loadingElement.style.display = "block"; // إظهار مؤشر التحميل

  // استدعاء قاعدة البيانات المستقلة والجديدة فوراً
  const matchedRecord = await searchInGoogleSheets(serviceCodeInput, identityInput);

  if (loadingElement) loadingElement.style.display = "none"; // إخفاء مؤشر التحميل

  if (matchedRecord) {
    // إذا وجد المريض، نقوم بتمرير البيانات إلى واجهة العرض الفاخرة الموضحة بصورتك
    displayLeaveDetails(matchedRecord);
  } else {
    alert("عذراً، لم يتم العثور على بيانات مطابقة. يرجى التحقق من المدخلات.");
  }
}

/**
 * دالة رسم البيانات على واجهة العرض الرسمية لمنصة صحة
 */
function displayLeaveDetails(record) {
  // مطابقة الحقول بالملي مع عناصر الـ HTML الخاصة بالتصميم الخاص بك
  if(document.getElementById("res_name")) document.getElementById("res_name").innerText = record.name;
  if(document.getElementById("res_issueDate")) document.getElementById("res_issueDate").innerText = record.issueDate;
  if(document.getElementById("res_admissionDate")) document.getElementById("res_admissionDate").innerText = record.admissionDate;
  if(document.getElementById("res_dischargeDate")) document.getElementById("res_dischargeDate").innerText = record.dischargeDate;
  if(document.getElementById("res_duration")) document.getElementById("res_duration").innerText = record.leaveDuration;
  if(document.getElementById("res_doctor")) document.getElementById("res_doctor").innerText = record.doctorName;
  if(document.getElementById("res_job")) document.getElementById("res_job").innerText = record.jobTitle;
  
  const resultCard = document.getElementById("resultCard");
  if (resultCard) resultCard.style.display = "block"; // إظهار كرت النتائج الأنيق
}
