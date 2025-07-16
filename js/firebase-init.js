// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAzYZMxqNmnLMGYnCyiJYPg2MbxZMt0co0",
    authDomain: "osama-91b95.firebaseapp.com",
    databaseURL: "https://osama-91b95-default-rtdb.firebaseio.com",
    projectId: "osama-91b95",
    storageBucket: "osama-91b95.appspot.com",
    messagingSenderId: "118875905722",
    appId: "1:118875905722:web:200bff1bd99db2c1caac83",
    measurementId: "G-LEM5PVPJZC"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const analytics = firebase.analytics; // إذا كنت تستخدم تحليلات Firebase
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

// دالة مساعدة لرسائل التنبيه (يمكن استخدامها في أي صفحة)
function showMessage(message, type) {
    const messageContainer = document.getElementById('global-message'); // ستحتاج لإضافة هذا العنصر في كل صفحة HTML
    if (messageContainer) {
        messageContainer.textContent = message;
        messageContainer.className = 'global-message ' + type + '-message';
        setTimeout(() => {
            messageContainer.textContent = '';
            messageContainer.className = 'global-message hidden';
        }, 3000);
    } else {
        // Fallback to alert if no global-message container found
        alert(message); 
    }
}

// دالة مساعدة لرسائل أخطاء المصادقة (يمكن استخدامها في أي صفحة)
function getAuthErrorMessage(code) {
    switch(code) {
        case 'auth/invalid-email':
            return 'البريد الإلكتروني غير صالح';
        case 'auth/user-disabled':
            return 'هذا الحساب معطل';
        case 'auth/user-not-found':
            return 'لا يوجد حساب مرتبط بهذا البريد الإلكتروني';
        case 'auth/wrong-password':
            return 'كلمة المرور غير صحيحة';
        case 'auth/email-already-in-use':
            return 'هذا البريد الإلكتروني مستخدم بالفعل';
        case 'auth/weak-password':
            return 'كلمة المرور ضعيفة (يجب أن تحتوي على 6 أحرف على الأقل)';
        default:
            return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى';
    }
}

// دالة تنسيق التاريخ (يمكن استخدامها في أي صفحة)
function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    // تنسيق الوقت والتاريخ باللغة العربية مع توقيت اليمن (GMT+3)
    // لاحظ: يجب التأكد أن جهاز المستخدم مضبوط بشكل صحيح للتوقيت المحلي
    return date.toLocaleString('ar-YE', { 
        year: 'numeric', 
        month: 'numeric', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: true 
    });
}

// الدالة لعرض شاشة التحميل
function showLoading(message = 'جاري النشر...', showProgress = false) {
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingText = loadingOverlay.querySelector('p');
    const progressBar = loadingOverlay.querySelector('.progress-bar');
    
    if (loadingOverlay) {
        loadingText.textContent = message;
        if (showProgress) {
            progressBar.classList.remove('hidden');
        } else {
            progressBar.classList.add('hidden');
        }
        loadingOverlay.classList.remove('hidden');
    }
}

// الدالة لإخفاء شاشة التحميل
function hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }
}

// الدالة لتحديث شريط التقدم
function updateProgress(percentage) {
    const uploadProgress = document.getElementById('upload-progress');
    if (uploadProgress) {
        uploadProgress.style.width = percentage + '%';
    }
}














// --------------------------------------------------------
// وظائف مساعدة عامة
// --------------------------------------------------------

// عناصر DOM لشاشة التحميل والرسائل العامة
const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = loadingOverlay ? loadingOverlay.querySelector('p') : null;
const uploadProgress = loadingOverlay ? document.getElementById('upload-progress') : null;
const globalMessageElem = document.getElementById('global-message');

/**
 * يعرض شاشة التحميل مع رسالة اختيارية وشريط تقدم.
 * @param {string} message - الرسالة المراد عرضها (اختياري، الافتراضي "جاري التحميل...").
 * @param {boolean} showProgress - تحديد ما إذا كان سيتم إظهار شريط التقدم (الافتراضي: false).
 */
function showLoading(message = 'جاري التحميل...', showProgress = false) {
    if (loadingOverlay) {
        loadingOverlay.classList.remove('hidden');
        if (loadingText) {
            loadingText.textContent = message;
        }
        if (uploadProgress) {
            if (showProgress) {
                uploadProgress.parentElement.classList.remove('hidden');
                uploadProgress.style.width = '0%';
            } else {
                uploadProgress.parentElement.classList.add('hidden');
            }
        }
    }
}

/**
 * يقوم بتحديث شريط التقدم على شاشة التحميل.
 * @param {number} percentage - نسبة التقدم المئوية (0-100).
 */
function updateProgress(percentage) {
    if (uploadProgress) {
        uploadProgress.style.width = `${percentage}%`;
    }
}

/**
 * يخفي شاشة التحميل.
 */
function hideLoading() {
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }
}

/**
 * يعرض رسالة عامة للمستخدم.
 * @param {string} message - نص الرسالة.
 * @param {string} type - نوع الرسالة ("success", "error", "warning", "info").
 * @param {number} duration - مدة عرض الرسالة بالمللي ثانية (الافتراضي: 3000).
 */
function showMessage(message, type = 'info', duration = 3000) {
    if (globalMessageElem) {
        // إزالة أي فئات سابقة وتعيين الفئات الجديدة
        globalMessageElem.className = ''; // مسح جميع الفئات
        globalMessageElem.classList.add(type);
        globalMessageElem.textContent = message;
        globalMessageElem.classList.remove('hidden'); // تأكد من إظهاره إذا كان مخفيا بـ display: none
        globalMessageElem.classList.add('show'); // إضافة فئة لعرضه مع انتقال

        setTimeout(() => {
            globalMessageElem.classList.remove('show'); // إزالة فئة العرض
            // بعد انتهاء الانتقال، قم بإخفائه تمامًا
            setTimeout(() => {
                globalMessageElem.classList.add('hidden');
            }, 300); // يجب أن تتوافق هذه المدة مع مدة الانتقال في CSS
        }, duration);
    }
}

/**
 * تنسيق الطابع الزمني ليعرض التاريخ والوقت بشكل مقروء.
 * @param {number} timestamp - الطابع الزمني (مللي ثانية منذ Epoch).
 * @returns {string} التاريخ والوقت المنسق.
 */
function formatDate(timestamp) {
    if (!timestamp) return 'غير متوفر';
    const date = new Date(timestamp);
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true // لعرض صباحاً/مساءً
    };
    return date.toLocaleString('ar-SA', options); // تنسيق عربي سعودي
}

// تصدير Firebase والوظائف المساعدة لسهولة الوصول إليها في ملفات JavaScript الأخرى
// (على الرغم من أنها ستكون متاحة عالميًا بما أنها في <script> علوية،
// إلا أن هذا يوضح الغرض)
window.firebase = firebase;
window.auth = auth;
window.database = database;
window.storage = storage;
window.showLoading = showLoading;
window.updateProgress = updateProgress;
window.hideLoading = hideLoading;
window.showMessage = showMessage;
window.formatDate = formatDate;
