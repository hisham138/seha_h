/**
 * سكريبت نظام منصة صحة - لوحة المسؤول لإدخال وتوثيق الإجازات المرضية حياً
 * التوثيق: تم تعديل الدالة لتخزين البيانات حياً في جدول Google Sheets مثبت الأبعاد
 */

// ⚠️ ضع هنا الرابط الطويل الذي نسخته بنجاح من الـ Google Apps Script وينتهي بـ /exec
const GOOGLE_SCRIPT_URL = "t.google.com/macros/s/AKfycbwa-SWU2u88TILv44ccxrqkL-2z3DfcVjZ46g3SDFvXS7N-9skAwAJc8lag5e7wMqxlfQ/exec";

/**
 * دالة حفظ البيانات المحدثة: ترسل البيانات حياً إلى الإكسل وتحتفظ بنسخة احتياطية محلية
 * @param {Object} leaveData - كائن يحتوي على تفاصيل الإجازة المرضية المعتمدة
 */
async function saveToGoogleSheets(leaveData) {
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("ضع_رابط")) {
    console.error("خطأ: لم يتم تكوين رابط قاعدة بيانات Google Sheets بعد.");
    return false;
  }

  try {
    // 1. إرسال البيانات فورياً وحياً إلى سكريبت جوجل شيت عبر طلب POST آمن
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors", // لمنع قيود الحماية والأمان أثناء الإرسال من الجوال
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(leaveData) // تحويل كائن البيانات إلى نص JSON مرن ليفهمه الإكسل
    });

    // 2. عمل نسخة احتياطية في الذاكرة المحلية للمتصفح لزيادة استقرار النظام
    const arr = JSON.parse(localStorage.getItem("seha_leaves") || "[]");
    arr.push(leaveData);
    localStorage.setItem("seha_leaves", JSON.stringify(arr));
    
    return true; // إرجاع نجاح العملية لفتح واجهة العرض والطباعة للمسؤول
  } catch (error) {
    console.error("فشل في مزامنة البيانات مع جوجل شيت:", error);
    return false;
  }
}

// انتظر تحميل عناصر واجهة المستخدم بالكامل قبل تفعيل المستمعات البرمجية
document.addEventListener("DOMContentLoaded", () => {
  const submitBtn = document.getElementById("submit");
  const toggleBtn = document.getElementById("toggleButton");
  const alertError = document.getElementById("alerterror");
  const alertError2 = document.getElementById("alerterror2");
  const successAlert = document.getElementById("successAlert");

  const nationalId = document.getElementById("national_id");
  const patientName = document.getElementById("patientname");
  const hospitalName = document.getElementById("hospitalname");
  const issueDate = document.getElementById("issuedate");
  const admissionDate = document.getElementById("admissiondate");
  const dischargeDate = document.getElementById("dischargedate");
  const leaveDuration = document.getElementById("leaveduration");
  const doctorName = document.getElementById("doctorname");
  const jobTitle = document.getElementById("jobtitle");

  const leaveCodeSection = document.getElementById("leaveCodeSection");
  const leaveCodeDisplay = document.getElementById("leaveCodeDisplay");
  const leaveTypeSelect = document.getElementById("leaveTypeSelect");
  const copyLeaveBtn = document.getElementById("copyLeaveBtn");
  const typeChips = document.querySelectorAll(".type-chip");

  // دالة توليد رمز الخدمة العشوائي المكون من 11 رقماً
  function generateLeaveCode(length = 11) {
    let digits = "";
    for (let i = 0; i < length; i++) digits += Math.floor(Math.random() * 10);
    return digits;
  }

  // حساب مدة الإجازة تلقائياً بالأيام بناءً على تاريخ الدخول والخروج
  function calculateLeaveDuration() {
    if (!admissionDate || !dischargeDate || !leaveDuration) return;
    const s = admissionDate.value;
    const e = dischargeDate.value;
    if (!s || !e) return;
    const start = new Date(s);
    const end = new Date(e);
    if (isNaN(start) || isNaN(end) || end < start) { leaveDuration.value = ""; return; }
    const diffDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    leaveDuration.value = diffDays;
  }
  if (admissionDate) admissionDate.addEventListener("change", calculateLeaveDuration);
  if (dischargeDate) dischargeDate.addEventListener("change", calculateLeaveDuration);

  function normalize(v) {
    return String(v || "").trim();
  }

  function showTemporaryAlert(el, ms = 2500) {
    if (!el) return;
    el.style.display = "block";
    setTimeout(() => { el.style.display = "none"; }, ms);
  }

  // تحديث الرمز المعروض للمسؤول بناءً على نوع الإجازة المختار
  function updateLeaveDisplay(code, type) {
    if (!leaveCodeDisplay) return;
    leaveCodeDisplay.dataset.code = code;
    
    if (type) {
      let convertedType = type;
      if (type === "SPL") convertedType = "GSL";
      else if (type === "GPL") convertedType = "PSL";
      else if (type === "اعتيادية") convertedType = "NSL";
      
      leaveCodeDisplay.textContent = convertedType + code;
    } else {
      leaveCodeDisplay.textContent = code;
    }
  }

  typeChips.forEach(chip => {
    chip.addEventListener("click", () => {
      const val = chip.dataset.value || "";
      typeChips.forEach(c => c.classList.remove("active"));
      if (val) chip.classList.add("active");
      if (leaveTypeSelect) leaveTypeSelect.value = val;
      const code = leaveCodeDisplay?.dataset?.code || "";
      updateLeaveDisplay(code, val);
    });
  });

  if (leaveTypeSelect) {
    leaveTypeSelect.addEventListener("change", () => {
      const val = leaveTypeSelect.value || "";
      typeChips.forEach(c => {
        c.classList.toggle("active", c.dataset.value === val);
      });
      const code = leaveCodeDisplay?.dataset?.code || "";
      updateLeaveDisplay(code, val);
    });
  }

  // معالج الحدث عند الضغط على زر "إنشاء وحفظ الإجازة"
  if (submitBtn) {
    submitBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (alertError) alertError.style.display = "none";
      if (alertError2) alertError2.style.display = "none";
      if (successAlert) successAlert.style.display = "none";

      calculateLeaveDuration();

      const nid = normalize(nationalId?.value);
      const place = normalize(hospitalName?.value) || normalize(patientName?.value);
      const issue = normalize(issueDate?.value);
      const from = normalize(admissionDate?.value);
      const to = normalize(dischargeDate?.value);
      const days = normalize(leaveDuration?.value);
      const doc = normalize(doctorName?.value);
      const job = normalize(jobTitle?.value);

      // التحقق من ملء كافة الحقول قبل التوجيه لقاعدة البيانات
      if (!nid || !place || !issue || !from || !to || !days || !doc || !job) {
        if (alertError) { alertError.textContent = "الرجاء تعبئة جميع الحقول المطلوبة."; alertError.style.display = "block"; }
        return;
      }

      try {
        const leaveCode = generateLeaveCode(11);
        const leaveType = String(leaveTypeSelect?.value || "").trim();

        // بناء كائن البيانات المتوافق مع متطلبات الأبعاد في جدول جوجل شيت
        const leaveObj = {
          leaveCode: leaveCode,
          serviceCode: leaveCode,
          nationalId: nid,
          idNumber: nid,
          name: normalize(patientName?.value),
          hospitalName: place,
          issueDate: issue,
          admissionDate: from,
          dischargeDate: to,
          leaveDuration: days,
          doctorName: doc,
          jobTitle: job,
          leaveType: leaveType,
          date: issue
        };

        // استدعاء دالة المزامنة الحية مع جوجل شيت التي قمنا بتحديثها
        const saveResult = await saveToGoogleSheets(leaveObj);
        
        if (saveResult) {
          updateLeaveDisplay(leaveObj.leaveCode, leaveType);

          if (leaveCodeSection) leaveCodeSection.style.display = "flex";
          if (submitBtn) submitBtn.style.display = "none";
          if (toggleBtn) toggleBtn.style.display = "inline-block";

          // رسالة تأكيد للمستخدم بنجاح العمل والمزامنة الحية
          alert(`تم إنشاء الإجازة بنجاح ومزامنتها حياً مع جدول البيانات! ✅\n\nرمز الإجازة: ${leaveCode}`);
          
          if (successAlert) showTemporaryAlert(successAlert, 2000);
        } else {
          throw new Error("فشل في الحفظ");
        }
      } catch (err) {
        console.error("خطأ أثناء الإنشاء:", err);
        if (alertError2) { alertError2.textContent = "خطأ أثناء الإنشاء الفوري في قاعدة البيانات"; alertError2.style.display = "block"; }
      }
    });
  }

  // معالج تفعيل زر نسخ رمز الإجازة التلقائي
  if (copyLeaveBtn) {
    copyLeaveBtn.addEventListener("click", async () => {
      const code = leaveCodeDisplay?.dataset?.code || "";
      const type = leaveTypeSelect?.value || "";
      
      if (!code) return;
      
      let textToCopy = code;
      
      if (type) {
        let convertedType = type;
        if (type === "SPL") convertedType = "GSL";
        else if (type === "GPL") convertedType = "PSL";
        else if (type === "اعتيادية") convertedType = "NSL";
        
        textToCopy = convertedType + code;
      }
      
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(textToCopy);
        } else {
          const ta = document.createElement("textarea");
          ta.value = textToCopy;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }
        const orig = copyLeaveBtn.textContent;
        copyLeaveBtn.textContent = "تم النسخ";
        copyLeaveBtn.disabled = true;
        setTimeout(() => { 
          copyLeaveBtn.textContent = orig || "نسخ الرمز"; 
          copyLeaveBtn.disabled = false; 
        }, 1200);
      } catch (e) {
        console.error("فشل النسخ:", e);
        if (alertError2) showTemporaryAlert(alertError2, 1400);
      }
    });
  }

  // زر إفراغ الحقول وتجهيز الواجهة لإدخال مريض جديد آخر
  if (toggleBtn) {
    toggleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (nationalId) nationalId.value = "";
      if (patientName) patientName.value = "";
      if (hospitalName) hospitalName.value = "";
      if (issueDate) issueDate.value = "";
      if (admissionDate) admissionDate.value = "";
      if (dischargeDate) dischargeDate.value = "";
      if (leaveDuration) leaveDuration.value = "";
      if (doctorName) doctorName.value = "";
      if (jobTitle) jobTitle.value = "";
      if (leaveTypeSelect) leaveTypeSelect.value = "";

      typeChips.forEach(c => c.classList.remove("active"));
      if (leaveCodeDisplay) {
        leaveCodeDisplay.textContent = "";
        delete leaveCodeDisplay.dataset.code;
      }

      if (leaveCodeSection) leaveCodeSection.style.display = "none";
      if (alertError) alertError.style.display = "none";
      if (alertError2) alertError2.style.display = "none";
      if (successAlert) successAlert.style.display = "none";

      toggleBtn.style.display = "none";
      if (submitBtn) submitBtn.style.display = "inline-block";
    });
  }
});
