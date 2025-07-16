// جلب عناصر DOM الخاصة بصفحة إضافة منشور
const postTitleInput = document.getElementById('post-title');
const postDescriptionInput = document.getElementById('post-description');
const postPriceInput = document.getElementById('post-price');
const postLocationInput = document.getElementById('post-location');
const postPhoneInput = document.getElementById('post-phone');
const postImageInput = document.getElementById('post-image');
const chooseImageBtn = document.getElementById('choose-image-btn');
const cameraBtn = document.getElementById('camera-btn');
const imageNameSpan = document.getElementById('image-name');
const imagePreviewDiv = document.getElementById('image-preview');
const previewImg = document.getElementById('preview-img');
const removeImageBtn = document.getElementById('remove-image-btn');
const publishBtn = document.getElementById('publish-btn');
const closeAddPostBtn = document.getElementById('close-add-post');
const homeIcon = document.getElementById('home-icon'); // أيقونة العودة للرئيسية في الهيدر

// جلب أيقونات الفوتر (للتوجيه السليم من هذه الصفحة)
const profileIcon = document.getElementById('profile-icon');
const notificationsIcon = document.getElementById('notifications-icon');
const addPostIcon = document.getElementById('add-post-icon'); // لجعلها نشطة بصريا فقط
const supportIcon = document.getElementById('support-icon');
const moreIcon = document.getElementById('more-icon');


// استدعاء Firebase Auth و Database و Storage من الملف المشترك
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

// تحميل بيانات المستخدم عند فتح الصفحة
document.addEventListener('DOMContentLoaded', () => {
    // التحقق مما إذا كان المستخدم مسجلاً للدخول
    const user = auth.currentUser;
    if (!user) {
        showMessage('يرجى تسجيل الدخول لنشر منشور جديد.', 'error');
        setTimeout(() => {
            window.location.href = '../auth/auth.html'; // توجيه المستخدم لصفحة تسجيل الدخول
        }, 1500);
        return; // توقف عن تنفيذ المزيد من الكود إذا لم يكن هناك مستخدم
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

    // إذا كان المستخدم مسجلاً للدخول، قم بملء رقم الهاتف تلقائياً
    // يمكن تحسين هذا لجلب بيانات المستخدم مرة واحدة فقط من DB
    if (user) {
        const userRef = database.ref('users/' + user.uid);
        userRef.once('value', (snapshot) => {
            if (snapshot.exists()) {
                const userData = snapshot.val();
                if (userData.phone) {
                    postPhoneInput.value = userData.phone;
                }
            }
        }).catch(error => {
            console.error("Error fetching user data:", error);
            showMessage('حدث خطأ أثناء جلب بيانات المستخدم.', 'error');
        });
    }
});


// نشر منشور جديد
publishBtn.addEventListener('click', async e => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
        showMessage('يرجى تسجيل الدخول أولاً.', 'error');
        setTimeout(() => {
            window.location.href = '../auth/auth.html';
        }, 1500);
        return;
    }

    const title = postTitleInput.value.trim();
    const description = postDescriptionInput.value.trim();
    const price = postPriceInput.value.trim();
    const location = postLocationInput.value.trim();
    const phone = postPhoneInput.value.trim();
    const imageFile = postImageInput.files[0];

    if (!title || !description || !location || !phone) {
        showMessage('يرجى ملء جميع الحقول المطلوبة (العنوان، الوصف، الموقع، رقم التواصل).', 'error');
        return;
    }
    
    // التحقق من صلاحية رقم الهاتف (يمكن تحسين هذه الوظيفة)
    if (!/^\d{9}$/.test(phone)) { // يفترض رقم يمني 9 أرقام فقط
        showMessage('يرجى إدخال رقم هاتف صحيح مكون من 9 أرقام.', 'error');
        return;
    }

    try {
        showLoading('جاري رفع الصورة ونشر المنشور...', true); // إظهار شاشة التحميل مع شريط التقدم

        let imageUrl = ''; // قيمة افتراضية في حالة عدم وجود صورة
        if (imageFile) {
            const fileRef = storage.ref('post_images/' + Date.now() + '_' + imageFile.name);
            const uploadTask = fileRef.put(imageFile);

            // متابعة تقدم الرفع
            await new Promise((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        updateProgress(progress); // تحديث شريط التقدم من firebase-init.js
                        showLoading(`جاري رفع الصورة: ${Math.round(progress)}%`, true);
                    },
                    (error) => {
                        console.error('Upload error:', error);
                        reject(error);
                    },
                    () => {
                        // الرفع اكتمل بنجاح
                        resolve();
                    }
                );
            });

            // الحصول على رابط التحميل بعد اكتمال الرفع
            imageUrl = await uploadTask.snapshot.ref.getDownloadURL();
        }

        // الحصول على بيانات المستخدم (الاسم وحساب الكريمي) من قاعدة البيانات
        const userRef = database.ref('users/' + user.uid);
        const userSnapshot = await userRef.once('value');

        if (!userSnapshot.exists()) {
            throw new Error('بيانات المستخدم غير موجودة. يرجى تحديث ملفك الشخصي.');
        }

        const userData = userSnapshot.val();

        // إنشاء كائن المنشور
        const postData = {
            title: title,
            description: description,
            price: price || null, // حفظ السعر كـ null إذا كان فارغاً
            location: location,
            phone: phone, // رقم التواصل الذي أدخله المستخدم
            authorId: user.uid,
            authorName: userData.name, // اسم المستخدم من بياناته
            sellerAccount: userData.account, // حساب الكريمي من بيانات المستخدم
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            imageUrl: imageUrl
        };

        // حفظ المنشور في قاعدة البيانات
        await database.ref('posts').push(postData);

        hideLoading();
        showMessage('تم نشر المنشور بنجاح!', 'success');
        resetAddPostForm();
        setTimeout(() => {
            window.location.href = '../index.html'; // العودة للصفحة الرئيسية بعد النشر
        }, 1500);

    } catch (error) {
        hideLoading();
        console.error('Error adding post:', error);
        showMessage('حدث خطأ أثناء نشر المنشور: ' + error.message, 'error');
    }
});

// اختيار صورة من المعرض
chooseImageBtn.addEventListener('click', () => {
    postImageInput.click();
});

// فتح الكاميرا (إذا كان الجهاز يدعمها)
cameraBtn.addEventListener('click', () => {
    postImageInput.setAttribute('capture', 'environment'); // تفتح الكاميرا الخلفية
    postImageInput.click();
});

// عرض معاينة الصورة عند اختيار ملف
postImageInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
        const file = this.files[0];
        imageNameSpan.textContent = file.name;

        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            imagePreviewDiv.classList.remove('hidden');
        }
        reader.readAsDataURL(file);
    } else {
        imageNameSpan.textContent = 'لم يتم اختيار صورة';
        imagePreviewDiv.classList.add('hidden');
    }
});

// إزالة الصورة المختارة
removeImageBtn.addEventListener('click', () => {
    postImageInput.value = ''; // مسح الملف المحدد
    imageNameSpan.textContent = 'لم يتم اختيار صورة';
    imagePreviewDiv.classList.add('hidden');
    previewImg.src = '#'; // إعادة تعيين src
});


// إعادة تعيين نموذج إضافة المنشور
function resetAddPostForm() {
    postTitleInput.value = '';
    postDescriptionInput.value = '';
    postPriceInput.value = '';
    postLocationInput.value = '';
    postPhoneInput.value = '';
    postImageInput.value = ''; // مسح الملف المحدد
    imageNameSpan.textContent = 'لم يتم اختيار صورة';
    imagePreviewDiv.classList.add('hidden');
    previewImg.src = '#';
}

// معالجات الأحداث لأيقونات شريط التذييل والهيدر
closeAddPostBtn.addEventListener('click', () => {
    window.location.href = '../index.html'; // العودة للصفحة الرئيسية
});

homeIcon.addEventListener('click', () => {
    window.location.href = '../index.html'; // العودة للصفحة الرئيسية
});

profileIcon.addEventListener('click', () => {
    if (auth.currentUser) {
        if (auth.currentUser.email === 'admin@tasre.com') {
            window.location.href = '../admin/admin.html';
        } else {
            window.location.href = '../profile/profile.html';
        }
    } else {
        showMessage('يرجى تسجيل الدخول أولاً.', 'error');
        setTimeout(() => { window.location.href = '../auth/auth.html'; }, 1500);
    }
});

// الأيقونة النشطة (Add Post)
addPostIcon.addEventListener('click', () => {
    // لا تفعل شيئًا سوى إعادة تحميل الصفحة إذا تم النقر عليها، أو لا شيء
    // window.location.href = 'add-post.html';
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
