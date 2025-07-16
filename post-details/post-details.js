// جلب عناصر DOM لصفحة تفاصيل المنشور
const postDetailContainer = document.getElementById('post-detail-container');
const detailImage = document.getElementById('detail-image');
const imagePlaceholder = document.getElementById('image-placeholder');
const detailTitle = document.getElementById('detail-title');
const detailDescription = document.getElementById('detail-description');
const detailPrice = document.getElementById('detail-price');
const detailLocation = document.getElementById('detail-location');
const detailAuthorName = document.getElementById('detail-author-name');
const detailTimestamp = document.getElementById('detail-timestamp');
const contactBtn = document.getElementById('contact-btn');
const securePaymentBtn = document.getElementById('secure-payment-btn');
const postNotFoundMessage = document.getElementById('post-not-found');
const backToHomeIcon = document.getElementById('back-to-home-icon');

// جلب أيقونات الفوتر (للتوجيه السليم من هذه الصفحة)
const profileIcon = document.getElementById('profile-icon');
const notificationsIcon = document.getElementById('notifications-icon');
const addPostIcon = document.getElementById('add-post-icon');
const supportIcon = document.getElementById('support-icon');
const moreIcon = document.getElementById('more-icon');

// استدعاء Firebase Auth و Database من الملف المشترك
const auth = firebase.auth();
const database = firebase.database();

let currentPostData = null; // لتخزين بيانات المنشور الحالي


// تحميل تفاصيل المنشور عند فتح الصفحة
document.addEventListener('DOMContentLoaded', () => {
    showLoading('جاري تحميل تفاصيل المنشور...');
    const postId = localStorage.getItem('currentPostId'); // جلب معرف المنشور من التخزين المحلي

    if (postId) {
        const postRef = database.ref('posts/' + postId);
        postRef.once('value', (snapshot) => {
            hideLoading();
            if (snapshot.exists()) {
                currentPostData = snapshot.val();
                currentPostData.id = postId; // إضافة معرف المنشور إلى البيانات
                displayPostDetails(currentPostData);
                postDetailContainer.classList.remove('hidden');
            } else {
                postNotFoundMessage.classList.remove('hidden');
                console.warn('Post not found for ID:', postId);
            }
        }).catch(error => {
            hideLoading();
            console.error("Error fetching post details:", error);
            showMessage('حدث خطأ أثناء تحميل تفاصيل المنشور.', 'error');
            postNotFoundMessage.classList.remove('hidden');
        });
    } else {
        hideLoading();
        postNotFoundMessage.classList.remove('hidden');
        showMessage('لم يتم تحديد منشور لعرض تفاصيله.', 'error');
    }

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

// عرض تفاصيل المنشور على الصفحة
function displayPostDetails(post) {
    if (post.imageUrl) {
        detailImage.src = post.imageUrl;
        detailImage.classList.remove('hidden');
        imagePlaceholder.classList.add('hidden');
    } else {
        detailImage.classList.add('hidden');
        imagePlaceholder.classList.remove('hidden');
    }
    
    detailTitle.textContent = post.title;
    detailDescription.textContent = post.description;
    detailPrice.textContent = post.price ? `${post.price} ريال` : 'غير محدد';
    detailLocation.textContent = post.location;
    detailAuthorName.textContent = post.authorName;
    detailTimestamp.textContent = formatDate(post.timestamp); // استخدام دالة تنسيق التاريخ من firebase-init.js

    // تعيين رابط زر التواصل
    contactBtn.href = `tel:${post.phone}`;
}

// زر الدفع المضمون
securePaymentBtn.addEventListener('click', () => {
    // التحقق من تسجيل الدخول قبل المتابعة
    const user = auth.currentUser;
    if (!user) {
        showMessage('يرجى تسجيل الدخول قبل متابعة عملية الدفع.', 'error');
        setTimeout(() => {
            window.location.href = '../auth/auth.html'; // توجيه لصفحة تسجيل الدخول
        }, 1500);
        return;
    }

    // التحقق من وجود بيانات المنشور وقيمة السعر
    if (!currentPostData || !currentPostData.price) {
        showMessage('لا يمكن متابعة الدفع. السعر غير محدد أو بيانات المنشور مفقودة.', 'error');
        return;
    }

    // التحقق مما إذا كان المستخدم هو نفسه ناشر المنشور
    if (user.uid === currentPostData.authorId) {
        showMessage('لا يمكنك الدفع لنفسك!', 'warning');
        return;
    }
    
    // حفظ بيانات المنشور الحالي ورقم حساب البائع في التخزين المحلي
    // لتتمكن صفحة الدفع من الوصول إليها
    localStorage.setItem('paymentPostId', currentPostData.id);
    localStorage.setItem('paymentPostTitle', currentPostData.title);
    localStorage.setItem('paymentAmount', currentPostData.price);
    localStorage.setItem('sellerUid', currentPostData.authorId); // حفظ UID البائع
    localStorage.setItem('sellerAccount', currentPostData.sellerAccount); // حفظ رقم حساب الكريمي للبائع

    // الانتقال إلى صفحة الدفع المضمون
    window.location.href = '../payment/payment.html';
});


// معالجات الأحداث لأيقونات شريط الرأس والتذييل
backToHomeIcon.addEventListener('click', () => {
    window.location.href = '../index.html'; // العودة للصفحة الرئيسية
});

addPostIcon.addEventListener('click', () => {
    if (auth.currentUser) {
        window.location.href = '../add-post/add-post.html';
    } else {
        showMessage('يرجى تسجيل الدخول لنشر منشور جديد.', 'error');
        setTimeout(() => { window.location.href = '../auth/auth.html'; }, 1500);
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
