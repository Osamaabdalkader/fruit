// جلب عناصر DOM الخاصة بصفحة التوثيق
const authMessage = document.getElementById('global-message'); // نستخدم العنصر العام للرسائل
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const closeAuthBtn = document.getElementById('close-auth');
const homeIcon = document.getElementById('home-icon'); // أيقونة العودة للرئيسية في الهيدر

// جلب أيقونات الفوتر (للتوجيه السليم من هذه الصفحة)
const profileIcon = document.getElementById('profile-icon');
const addPostIcon = document.getElementById('add-post-icon');
const notificationsIcon = document.getElementById('notifications-icon');
const supportIcon = document.getElementById('support-icon');
const moreIcon = document.getElementById('more-icon');


// استدعاء Firebase Auth و Database من الملف المشترك
const auth = firebase.auth();
const database = firebase.database();

// تحميل بيانات المستخدم عند فتح الصفحة
document.addEventListener('DOMContentLoaded', () => {
    // استمع لتغير حالة المستخدم لتحديد سلوك أيقونة الحساب
    auth.onAuthStateChanged(user => {
        if (user && user.email === 'admin@tasre.com') {
            profileIcon.onclick = () => {
                window.location.href = '../admin/admin.html'; // توجيه المسؤول إلى لوحة التحكم
            };
        } else {
            profileIcon.onclick = () => {
                window.location.href = '../profile/profile.html'; // توجيه المستخدم العادي إلى صفحته الشخصية
            };
        }
    });
});


// تسجيل الدخول
loginBtn.addEventListener('click', async e => {
    e.preventDefault(); // منع إعادة تحميل الصفحة الافتراضية
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        showMessage('يرجى ملء جميع الحقول.', 'error');
        return;
    }

    showLoading('جاري تسجيل الدخول...');
    try {
        await auth.signInWithEmailAndPassword(email, password);
        hideLoading();
        showMessage('تم تسجيل الدخول بنجاح!', 'success');
        resetAuthForms();
        setTimeout(() => {
            window.location.href = '../index.html'; // العودة للصفحة الرئيسية
        }, 1500);
    } catch (error) {
        hideLoading();
        showMessage(getAuthErrorMessage(error.code), 'error');
        console.error('Login error:', error);
    }
});

// إنشاء حساب
signupBtn.addEventListener('click', async e => {
    e.preventDefault(); // منع إعادة تحميل الصفحة الافتراضية
    
    const name = document.getElementById('signup-name').value;
    const phone = document.getElementById('signup-phone').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const address = document.getElementById('signup-address').value;
    const account = document.getElementById('signup-account').value;
    
    if (!name || !phone || !email || !password || !address || !account) {
        showMessage('يرجى ملء جميع الحقول المطلوبة.', 'error');
        return;
    }

    showLoading('جاري إنشاء الحساب...');
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // حفظ معلومات المستخدم الإضافية
        await database.ref('users/' + user.uid).set({
            name: name,
            phone: phone,
            email: email,
            address: address,
            account: account // رقم حساب الكريمي
        });
        
        hideLoading();
        showMessage('تم إنشاء الحساب بنجاح!', 'success');
        resetAuthForms();
        setTimeout(() => {
            window.location.href = '../index.html'; // العودة للصفحة الرئيسية
        }, 1500);
    } catch (error) {
        hideLoading();
        showMessage(getAuthErrorMessage(error.code), 'error');
        console.error('Signup error:', error);
    }
});

// تغيير علامات التوثيق (Login/Signup tabs)
document.querySelectorAll('.auth-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.auth-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        if (btn.dataset.tab === 'login') {
            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
        } else {
            loginForm.classList.add('hidden');
            signupForm.classList.remove('hidden');
        }
        resetAuthForms(); // مسح الرسائل والنماذج عند التبديل
    });
});

// إعادة تعيين نماذج تسجيل الدخول/الاشتراك
function resetAuthForms() {
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('signup-name').value = '';
    document.getElementById('signup-phone').value = '';
    document.getElementById('signup-email').value = '';
    document.getElementById('signup-password').value = '';
    document.getElementById('signup-address').value = '';
    document.getElementById('signup-account').value = '';
    // إخفاء رسالة التنبيه
    if (authMessage) {
        authMessage.textContent = '';
        authMessage.className = 'auth-message hidden';
    }
}

// معالجات الأحداث لأيقونات شريط التذييل والهيدر
closeAuthBtn.addEventListener('click', () => {
    window.location.href = '../index.html'; // العودة للصفحة الرئيسية
});

homeIcon.addEventListener('click', () => {
    window.location.href = '../index.html'; // العودة للصفحة الرئيسية
});

addPostIcon.addEventListener('click', () => {
    // التحقق من تسجيل الدخول قبل التوجيه
    if (auth.currentUser) {
        window.location.href = '../add-post/add-post.html';
    } else {
        showMessage('يرجى تسجيل الدخول لنشر منشور جديد.', 'error');
        // لا داعي لإعادة التوجيه إلى نفس الصفحة التي أنت فيها حالياً (Auth page)
    }
});

notificationsIcon.addEventListener('click', () => {
    showMessage('وظيفة الإشعارات قيد التطوير!', 'info');
    // window.location.href = '../notifications/notifications.html';
});

supportIcon.addEventListener('click', () => {
    showMessage('للدعم الفني، يرجى التواصل على الهاتف: 77XXXXXXX', 'info');
    // window.location.href = '../support/support.html';
});

moreIcon.addEventListener('click', () => {
    showMessage('المزيد من الخيارات ستتوفر قريباً!', 'info');
    // window.location.href = '../more/more.html';
});
