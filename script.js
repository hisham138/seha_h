/**
 * سكريبت نظام منصة صحة - صفحة الاستعلام والتحقق الفوري للمستخدمين
 * التوثيق: تم ربط هذا المحرك بالملي مع معرّفات صفحة الـ HTML المعتمدة لديك وقاعدة بيانات جوجل شيت
 */

// ⚠️ ضع هنا الرابط الطويل الخاص بك المستخرج من الـ Google Apps Script (ينتهي بـ /exec)
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/library/d/1Pkk39nLwlN4ryxHF9sz2EuL71knIPImGE-eIUxzLsfMxZt0E9W2zGUze/1";

document.addEventListener("DOMContentLoaded", () => {
  const searchButton = document.getElementById("searchButton");
  const newSearchButton = document.getElementById("newSearchButton");
  
  // تفعيل مستمع الضغط لزر "استعلام"
  if (searchButton) {
    searchButton.addEventListener("click", validateAndCheckData);
  }
  
  // تفعيل مستمع الضغط لزر "استعلام جديد" لإعادة تهيئة الواجهة
  if (newSearchButton) {
    newSearchButton.addEventListener("click", resetSearchForm);
  }
});

/**
 * الدالة الأساسية: للتحقق من المدخلات وجلب البيانات حياً من جوجل شيت
 */
async function validateAndCheckData() {
  const serviceCodeInput = document.getElementById("serviceCode");
  const identityNumberInput = document.getElementById("identityNumber");
  
  const emptyFieldsErrorMessage = document.getElementById("emptyFieldsErrorMessage");
  const errorMessageTab = document.getElementById("errorMessageTab");
  const resultsDisplayBox = document.getElementById("resultsDisplayBox");
  
  const searchButtonText = document.getElementById("searchButtonText");
  const loadingSpinnerElement = document.getElementById("loadingSpinnerElement");
  const searchButton = document.getElementById("searchButton");
  const newSearchButton = document.getElementById("newSearchButton");

  // إخفاء رسائل الخطأ السابقة وصندوق النتائج
  if (emptyFieldsErrorMessage) emptyFieldsErrorMessage.style.display = "none";
  if (errorMessageTab) errorMessageTab.style.display = "none";
  if (resultsDisplayBox) { resultsDisplayBox.style.display = "none"; resultsDisplayBox.innerHTML = ""; }

  const serviceCode = serviceCodeInput ? serviceCodeInput.value.trim() : "";
  const identityNumber = identityNumberInput ? identityNumberInput.value.trim() : "";

  // 1. التحقق من تعبئة الحقول
  if (!serviceCode || !identityNumber) {
    if (emptyFieldsErrorMessage) emptyFieldsErrorMessage.style.display = "block";
    return;
  }

  // 2. تشغيل مؤشر التحميل (Spinner) وتجميد الزر أثناء الجلب
  if (searchButtonText) searchButtonText.style.display = "none";
  if (loadingSpinnerElement) loadingSpinnerElement.style.display = "inline-block";
  if (searchButton) searchButton.disabled = true;

  try {
    // 3. جلب البيانات حياً ومباشرة من سكريبت جوجل شيت المعتمد
    const response = await fetch(GOOGLE_SCRIPT_URL);
    const result = await response.json();
    const leaves = result.leaves || [];

    // 4. مطابقة نصية ذكية وصارمة لتفادي المسافات واختلاف الحروف
    const matchedRecord = leaves.find(record => 
      normalizeForCompare(record.serviceCode) === normalizeForCompare(serviceCode) &&
      normalizeForCompare(record.nationalId) === normalizeForCompare(identityNumber)
    );

    // إيقاف مؤشر التحميل وإعادة نص الزر
    if (searchButtonText) searchButtonText.style.display = "inline";
    if (loadingSpinnerElement) loadingSpinnerElement.style.display = "none";
    if (searchButton) searchButton.disabled = false;

    if (matchedRecord) {
      // 5. إذا وُجد التقرير، نقوم بصياغته وعرضه داخل صندوق النتائج بتصميم فاخر ومتوافق مع تطبيق صحتي
      displayLeaveDetails(matchedRecord);
      
      // إخفاء حقول الإدخال وزر الاستعلام القديم لإفساح المجال للنتيجة
      if (document.getElementById("serviceCodeContainer")) document.getElementById("serviceCodeContainer").style.display = "none";
      if (document.getElementById("identityNumberContainer")) document.getElementById("identityNumberContainer").style.display = "none";
      if (searchButton) searchButton.style.display = "none";
      if (document.getElementById("backButton")) document.getElementById("backButton").style.display = "none";
      
      // إظهار زر استعلام جديد ورجوع للقائمة
      if (newSearchButton) newSearchButton.style.display = "block";
      if (document.getElementById("backToListButton")) document.getElementById("backToListButton").style.display = "block";
    } else {
      // إذا لم يتم العثور على المريض في الجدول
      if (errorMessageTab) errorMessageTab.style.display = "block";
    }

  } catch (error) {
    console.error("خطأ أثناء الاتصال بقاعدة بيانات جوجل شيت الحية:", error);
    if (searchButtonText) searchButtonText.style.display = "inline";
    if (loadingSpinnerElement) loadingSpinnerElement.style.display = "none";
    if (searchButton) searchButton.disabled = false;
    alert("عذراً، حدث خطأ أثناء الاتصال بالخادم الرئيسي. يرجى المحاولة لاحقاً.");
  }
}

/**
 * دالة صياغة ورسم تفاصيل الإجازة المرضية المعتمدة بداخل كرت النتائج المصمم
 */
function displayLeaveDetails(record) {
  const resultsDisplayBox = document.getElementById("resultsDisplayBox");
  if (!resultsDisplayBox) return;

  // تحويل كود نوع الإجازة إلى مسمى عربي مفهوم
  let displayType = "إجازة مرضية (GSL)";
  if (record.leaveType === "SPL") displayType = "إجازة مرافق مريض (PSL)";
  else if (record.leaveType === "اعتيادية") displayType = "إجازة اعتيادية (NSL)";

  // بناء واجهة عرض تفصيلية وأنيقة تعكس الطابع الرسمي لمنصة صحة
  resultsDisplayBox.innerHTML = `
    <div style="background: #ffffff; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: right; border-right: 6px solid #2e6fb9;">
      <h3 style="color: #2e6fb9; margin-top: 0; border-bottom: 2px solid #f0f4f8; padding-bottom: 10px; display: flex; align-items: center; gap: 8px;">
        <i class="fas fa-check-circle" style="color: #2ec4b6;"></i> تقرير طبي معتمد ورسمي
      </h3>
      <div style="display: grid; grid-template-columns: 1fr; gap: 12px; font-size: 15px; color: #333333; margin-top: 15px;">
        <div><strong>👤 اسم المريض:</strong> <span style="color: #1a1a1a; font-weight: bold;">${record.name}</span></div>
        <div><strong>🆔 رقم الهوية / الإقامة:</strong> <span>${record.nationalId}</span></div>
        <div><strong>🔢 رمز الخدمة المعتمد:</strong> <span style="font-family: monospace; font-weight: bold; color: #2e6fb9;">${record.serviceCode}</span></div>
        <div><strong>📋 نوع الإجازة:</strong> <span>${displayType}</span></div>
        <div><strong>📅 تاريخ الدخول:</strong> <span>${record.admissionDate}</span></div>
        <div><strong>📅 تاريخ الخروج:</strong> <span>${record.dischargeDate}</span></div>
        <div><strong>⏱️ مدة الإجازة الممنوحة:</strong> <span style="background: #eef5fc; color: #2e6fb9; padding: 2px 10px; border-radius: 20px; font-weight: bold;">${record.leaveDuration} أيام</span></div>
        <div><strong>🩺 الطبيب الممارس:</strong> <span>${record.doctorName} (${record.jobTitle})</span></div>
        <div><strong>🗓️ تاريخ إصدار التقرير:</strong> <span>${record.issueDate}</span></div>
      </div>
    </div>
  `;
  
  resultsDisplayBox.style.display = "block";
}

/**
 * دالة تنظيف وإعادة الواجهة لحالتها الطبيعية لإجراء استعلام جديد
 */
function resetSearchForm() {
  if (document.getElementById("serviceCode")) document.getElementById("serviceCode").value = "";
  if (document.getElementById("identityNumber")) document.getElementById("identityNumber").value = "";
  
  if (document.getElementById("serviceCodeContainer")) document.getElementById("serviceCodeContainer").style.display = "block";
  if (document.getElementById("identityNumberContainer")) document.getElementById("identityNumberContainer").style.display = "block";
  
  if (document.getElementById("searchButton")) document.getElementById("searchButton").style.display = "block";
  if (document.getElementById("backButton")) document.getElementById("backButton").style.display = "block";
  
  if (document.getElementById("newSearchButton")) document.getElementById("newSearchButton").style.display = "none";
  if (document.getElementById("backToListButton")) document.getElementById("backToListButton").style.display = "none";
  if (document.getElementById("resultsDisplayBox")) {
    document.getElementById("resultsDisplayBox").style.display = "none";
    document.getElementById("resultsDisplayBox").innerHTML = "";
  }
}

/**
 * دالة معالجة لتفادي الأخطاء الناجمة عن الفراغات وحالة الأحرف
 */
function normalizeForCompare(text) {
  if (!text) return "";
  return String(text).trim().toLowerCase();
}

/**
 * دالة مساعدة تُستدعى من الـ HTML لإخفاء رسالة خطأ الحقول الفارغة تلقائياً عند بدء الكتابة
 */
function hideEmptyFieldError() {
  const emptyFieldsErrorMessage = document.getElementById("emptyFieldsErrorMessage");
  if (emptyFieldsErrorMessage) emptyFieldsErrorMessage.style.display = "none";
                                                              }
