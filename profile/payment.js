// جلب عناصر DOM لصفحة الدفع
const paymentPostTitle = document.getElementById('payment-post-title');
const paymentAmount = document.getElementById('payment-amount');
const sellerAccountDisplay = document.getElementById('seller-account-display');
const nextToReceiptBtn = document.getElementById('next-to-receipt-btn');
const sendReceiptBtn = document.getElementById('send-receipt-btn');
const backToDetailsBtn = document.getElementById('back-to-details-btn');
const paymentDetailsSection = document.getElementById('payment-details-section');
const paymentReceiptSection = document.getElementById('payment-receipt-section');
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');

// عناصر رفع الإيصال
const receiptImageInput = document.getElementById('receipt-image');
const chooseReceiptImageBtn = document.getElementById('choose-receipt-image-btn');
const cameraReceiptBtn = document.getElementById('camera-receipt-btn');
const receiptImageNameSpan = document.getElementById('receipt-image-name');
const receiptImagePreviewDiv = document.getElementById('receipt-image-preview');
const previewReceiptImg = document.getElementById('preview-receipt-img');
const removeReceiptImageBtn = document.getElementById('remove-receipt-image-btn');
const transactionIdInput = document.getElementById('transaction-id');

// أيقونة العودة في الهيدر
const backToPostDetailsIcon = document.getElementById('back-to-post-details-icon');

// جلب أيقونات الفوتر (للتوجيه السليم من هذه الصفحة)
const profileIcon = document.getElementById('profile-icon');
const notificationsIcon = document.getElementById('notifications-icon');
const addPostIcon = document.getElementById('add-post-icon');
const supportIcon = document.getElementById('document.getElementById');
const moreIcon = document.getElementById('more-icon');

// استدعاء Firebase Auth و Database و Storage من الملف المشترك
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

let currentPostId = null;
let currentSellerUid = null;
let currentAmount = null;
let currentSellerAccount = null;

// تحميل بيانات المنشور والدفع عند فتح الصفحة
document.addEventListener('DOMContentLoaded', () => {
    showLoading('جاري تحضير صفحة الدفع...');
    // جلب البيانات من LocalStorage التي تم حفظها من صفحة تفاصيل المنشور
    currentPostId = localStorage.getItem('paymentPostId');
    const postTitle = localStorage.getItem('paymentPostTitle');
    currentAmount = localStorage.getItem('paymentAmount');
    currentSellerUid = localStorage.getItem('sellerUid'); // UID البائع
    currentSellerAccount = localStorage.getItem('sellerAccount'); // رقم حساب الكريمي للبائع

    // التحقق من تسجيل الدخول
    const user = auth.currentUser;
    if (!user) {
        hideLoading();
        showMessage('يرجى تسجيل الدخول لمتابعة عملية الدفع.', 'error');
        setTimeout(() => {
            window.location.href = '../auth/auth.html';
        }, 1500);
        return;
    }

    // التحقق من أن المشتري ليس هو البائع
    if (user.uid === currentSellerUid) {
        hideLoading();
        showMessage('لا يمكنك إجراء عملية دفع لنفسك!', 'error');
        setTimeout(() => {
            window.location.href = '../post-details/post-details.html'; // العودة لصفحة تفاصيل المنشور
        }, 2000);
        return;
    }

    if (currentPostId && postTitle && currentAmount && currentSellerUid && currentSellerAccount) {
        paymentPostTitle.textContent = postTitle;
        paymentAmount.textContent = currentAmount;
        sellerAccountDisplay.textContent = currentSellerAccount;
        hideLoading();
        // يمكنك هنا توليد QR Code إذا كان لديك API أو مكتبة لذلك
        // مثال: karimiQrCode.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${currentSellerAccount}`;
    } else {
        hideLoading();
        showMessage('حدث خطأ في جلب بيانات المنشور للدفع. يرجى العودة ومحاولة مرة أخرى.', 'error');
        setTimeout(() => {
            window.location.href = '../index.html'; // العودة للصفحة الرئيسية إذا لم تكن البيانات متوفرة
        }, 2000);
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

// الانتقال من الخطوة 1 إلى الخطوة 2
nextToReceiptBtn.addEventListener('click', () => {
    paymentDetailsSection.classList.add('hidden');
    paymentReceiptSection.classList.remove('hidden');
    step1.classList.remove('active');
    step2.classList.add('active');
});

// العودة من الخطوة 2 إلى الخطوة 1
backToDetailsBtn.addEventListener('click', () => {
    paymentReceiptSection.classList.add('hidden');
    paymentDetailsSection.classList.remove('hidden');
    step2.classList.remove('active');
    step1.classList.add('active');
});

// إرسال إشعار الدفع
sendReceiptBtn.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) {
        showMessage('يرجى تسجيل الدخول لإرسال إشعار الدفع.', 'error');
        setTimeout(() => { window.location.href = '../auth/auth.html'; }, 1500);
        return;
    }

    const receiptImageFile = receiptImageInput.files[0];
    const transactionId = transactionIdInput.value.trim();

    if (!receiptImageFile) {
        showMessage('يرجى إرفاق صورة إيصال الدفع.', 'error');
        return;
    }

    showLoading('جاري إرسال إشعار الدفع...', true); // إظهار شاشة التحميل مع شريط التقدم

    try {
        let receiptImageUrl = '';
        if (receiptImageFile) {
            const fileRef = storage.ref('payment_receipts/' + Date.now() + '_' + receiptImageFile.name);
            const uploadTask = fileRef.put(receiptImageFile);

            await new Promise((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        updateProgress(progress);
                        showLoading(`جاري رفع الإيصال: ${Math.round(progress)}%`, true);
                    },
                    (error) => {
                        console.error('Upload error:', error);
                        reject(error);
                    },
                    () => {
                        resolve();
                    }
                );
            });
            receiptImageUrl = await uploadTask.snapshot.ref.getDownloadURL();
        }

        // حفظ تفاصيل المعاملة في قاعدة البيانات (ضمن عقد المعاملات)
        const transactionData = {
            postId: currentPostId,
            postTitle: paymentPostTitle.textContent,
            amount: currentAmount,
            buyerUid: user.uid,
            buyerName: user.displayName || user.email, // استخدام الاسم المعروض أو البريد الإلكتروني للمشتري
            sellerUid: currentSellerUid,
            sellerAccount: currentSellerAccount,
            receiptImageUrl: receiptImageUrl,
            transactionId: transactionId || null,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            status: 'pending' // pending, completed, cancelled
        };

        await database.ref('transactions').push(transactionData);

        hideLoading();
        showMessage('تم إرسال إشعار الدفع بنجاح! سيتم مراجعة طلبك.', 'success');
        resetPaymentForm();
        setTimeout(() => {
            window.location.href = '../index.html'; // العودة للصفحة الرئيسية
        }, 2000);

    } catch (error) {
        hideLoading();
        console.error('Error sending payment receipt:', error);
        showMessage('حدث خطأ أثناء إرسال إشعار الدفع: ' + error.message, 'error');
    }
});

// اختيار صورة الإيصال من المعرض
chooseReceiptImageBtn.addEventListener('click', () => {
    receiptImageInput.click();
});

// فتح الكاميرا لالتقاط صورة الإيصال
cameraReceiptBtn.addEventListener('click', () => {
    receiptImageInput.setAttribute('capture', 'environment');
    receiptImageInput.click();
});

// عرض معاينة صورة الإيصال
receiptImageInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
        const file = this.files[0];
        receiptImageNameSpan.textContent = file.name;

        const reader = new FileReader();
        reader.onload = function(e) {
            previewReceiptImg.src = e.target.result;
            receiptImagePreviewDiv.classList.remove('hidden');
        }
        reader.readAsDataURL(file);
    } else {
        receiptImageNameSpan.textContent = 'لم يتم اختيار صورة';
        receiptImagePreviewDiv.classList.add('hidden');
    }
});

// إزالة صورة الإيصال المختارة
removeReceiptImageBtn.addEventListener('click', () => {
    receiptImageInput.value = '';
    receiptImageNameSpan.textContent = 'لم يتم اختيار صورة';
    receiptImagePreviewDiv.classList.add('hidden');
    previewReceiptImg.src = '#';
});

// إعادة تعيين نموذج الدفع
function resetPaymentForm() {
    receiptImageInput.value = '';
    receiptImageNameSpan.textContent = 'لم يتم اختيار صورة';
    receiptImagePreviewDiv.classList.add('hidden');
    previewReceiptImg.src = '#';
    transactionIdInput.value = '';
    paymentReceiptSection.classList.add('hidden');
    paymentDetailsSection.classList.remove('hidden');
    step2.classList.remove('active');
    step1.classList.add('active');
}

// معالجات الأحداث لأيقونات شريط الرأس والتذييل
backToPostDetailsIcon.addEventListener('click', () => {
    if (currentPostId) {
        localStorage.setItem('currentPostId', currentPostId); // للتأكد من العودة لنفس المنشور
        window.location.href = '../post-details/post-details.html';
    } else {
        window.location.href = '../index.html'; // العودة للصفحة الرئيسية إذا لم يكن معرف المنشور متاحًا
    }
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
