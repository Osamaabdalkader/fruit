// جلب عناصر DOM لصفحة الملف الشخصي
const profileNameElem = document.getElementById('profile-name');
const profileEmailElem = document.getElementById('profile-email');
const detailPhoneElem = document.getElementById('detail-phone');
const detailAddressElem = document.getElementById('detail-address');
const detailAccountElem = document.getElementById('detail-account');
const editProfileBtn = document.getElementById('edit-profile-btn');
const logoutBtn = document.getElementById('logout-btn');
const editProfileForm = document.getElementById('edit-profile-form');
const editNameInput = document.getElementById('edit-name');
const editPhoneInput = document.getElementById('edit-phone');
const editAddressInput = document.getElementById('edit-address');
const editAccountInput = document.getElementById('edit-account');
const saveProfileBtn = document.getElementById('save-profile-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const userPostsContainer = document.getElementById('user-posts-container');
const noUserPostsMessage = document.getElementById('no-user-posts');
const closeProfileBtn = document.getElementById('close-profile');
const homeIcon = document.getElementById('home-icon');

// جلب أيقونات الفوتر (للتوجيه السليم من هذه الصفحة)
const notificationsIcon = document.getElementById('notifications-icon');
const addPostIcon = document.getElementById('add-post-icon');
const profileIcon = document.getElementById('profile-icon'); // لجعلها نشطة بصريا فقط
const supportIcon = document.getElementById('support-icon');
const moreIcon = document.getElementById('more-icon');

// استدعاء Firebase Auth و Database من الملف المشترك
const auth = firebase.auth();
const database = firebase.database();

let currentUserUid = null;

// تحميل بيانات المستخدم والمنشورات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    showLoading('جاري تحميل بياناتك...');
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUserUid = user.uid;
            // عرض البريد الإلكتروني مباشرة
            profileEmailElem.textContent = user.email;
            
            // جلب بيانات المستخدم من قاعدة البيانات
            const userRef = database.ref('users/' + user.uid);
            userRef.once('value', (snapshot) => {
                hideLoading();
                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    profileNameElem.textContent = userData.name || 'اسم غير محدد';
                    detailPhoneElem.textContent = userData.phone || 'غير متوفر';
                    detailAddressElem.textContent = userData.address || 'غير متوفر';
                    detailAccountElem.textContent = userData.account || 'غير متوفر';

                    // ملء النموذج للتحرير
                    editNameInput.value = userData.name || '';
                    editPhoneInput.value = userData.phone || '';
                    editAddressInput.value = userData.address || '';
                    editAccountInput.value = userData.account || '';
                } else {
                    showMessage('لم يتم العثور على بيانات المستخدم في قاعدة البيانات.', 'warning');
                }
            }).catch(error => {
                hideLoading();
                console.error("Error fetching user data:", error);
                showMessage('حدث خطأ أثناء جلب بيانات المستخدم.', 'error');
            });

            // تحميل منشورات المستخدم
            loadUserPosts(user.uid);
            
            // تحديد سلوك أيقونة الحساب في الفوتر (في هذه الصفحة لا تفعل شيئًا خاصًا)
            if (user.email === 'admin@tasre.com') {
                profileIcon.onclick = () => { /* لا تفعل شيئًا، أنت بالفعل في هذه الصفحة */ };
            } else {
                profileIcon.onclick = () => { /* لا تفعل شيئًا، أنت بالفعل في هذه الصفحة */ };
            }

        } else {
            // إذا لم يكن المستخدم مسجلاً للدخول، إعادة توجيهه لصفحة المصادقة
            hideLoading();
            showMessage('يرجى تسجيل الدخول لعرض ملفك الشخصي.', 'error');
            setTimeout(() => {
                window.location.href = '../auth/auth.html';
            }, 1500);
        }
    });
});

// تحميل منشورات المستخدم
function loadUserPosts(uid) {
    userPostsContainer.innerHTML = ''; // مسح المنشورات الموجودة
    noUserPostsMessage.classList.add('hidden'); // إخفاء رسالة لا توجد منشورات

    const postsRef = database.ref('posts').orderByChild('authorId').equalTo(uid);
    postsRef.on('value', (snapshot) => {
        userPostsContainer.innerHTML = ''; // مسح قبل إعادة التعبئة
        if (snapshot.exists()) {
            const posts = snapshot.val();
            let hasPosts = false;
            Object.keys(posts).reverse().forEach(postId => { // عرض الأحدث أولاً
                const post = posts[postId];
                createUserPostCard({ ...post, id: postId });
                hasPosts = true;
            });
            if (!hasPosts) {
                noUserPostsMessage.classList.remove('hidden');
            }
        } else {
            noUserPostsMessage.classList.remove('hidden');
        }
    }, (error) => {
        console.error("Error loading user posts: ", error);
        showMessage('حدث خطأ أثناء تحميل منشوراتك.', 'error');
    });
}

// إنشاء بطاقة منشور المستخدم
function createUserPostCard(post) {
    const postCard = document.createElement('div');
    postCard.className = 'post-card';
    postCard.dataset.id = post.id;

    const imageContent = post.imageUrl
        ? `<div class="post-image"><img src="${post.imageUrl}" alt="${post.title}"></div>`
        : `<div class="post-image"><i class="fas fa-image fa-3x"></i></div>`;

    postCard.innerHTML = `
        ${imageContent}
        <div class="post-content">
            <h3 class="post-title">${post.title}</h3>
            <p class="post-description">${post.description}</p>
            <div class="post-meta">
                ${post.price ? `<div class="post-price">${post.price} ريال</div>` : ''}
                <div class="post-location"><i class="fas fa-map-marker-alt"></i> ${post.location}</div>
            </div>
            <button class="btn-outline delete-post-btn" data-id="${post.id}">
                <i class="fas fa-trash-alt"></i> حذف
            </button>
        </div>
    `;

    // إضافة حدث النقر على زر الحذف
    const deleteBtn = postCard.querySelector('.delete-post-btn');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // منع انتقال النقر لبطاقة المنشور
        if (confirm('هل أنت متأكد أنك تريد حذف هذا المنشور؟')) {
            deletePost(post.id, post.imageUrl);
        }
    });

    // إضافة حدث النقر لفتح صفحة التفاصيل
    postCard.addEventListener('click', () => {
        localStorage.setItem('currentPostId', post.id);
        window.location.href = '../post-details/post-details.html';
    });

    userPostsContainer.appendChild(postCard);
}

// حذف منشور
async function deletePost(postId, imageUrl) {
    showLoading('جاري حذف المنشور...');
    try {
        // حذف الصورة من التخزين إذا وجدت
        if (imageUrl) {
            const imageRef = storage.refFromURL(imageUrl);
            await imageRef.delete();
        }

        // حذف المنشور من قاعدة البيانات
        await database.ref('posts/' + postId).remove();
        hideLoading();
        showMessage('تم حذف المنشور بنجاح!', 'success');
    } catch (error) {
        hideLoading();
        console.error('Error deleting post:', error);
        showMessage('حدث خطأ أثناء حذف المنشور: ' + error.message, 'error');
    }
}

// فتح نموذج تعديل الملف الشخصي
editProfileBtn.addEventListener('click', () => {
    document.querySelector('.profile-details').classList.add('hidden');
    editProfileForm.classList.remove('hidden');
});

// إلغاء تعديل الملف الشخصي
cancelEditBtn.addEventListener('click', () => {
    editProfileForm.classList.add('hidden');
    document.querySelector('.profile-details').classList.remove('hidden');
});

// حفظ تغييرات الملف الشخصي
saveProfileBtn.addEventListener('click', async e => {
    e.preventDefault();
    if (!currentUserUid) {
        showMessage('لا يوجد مستخدم مسجل للدخول.', 'error');
        return;
    }

    const newName = editNameInput.value.trim();
    const newPhone = editPhoneInput.value.trim();
    const newAddress = editAddressInput.value.trim();
    const newAccount = editAccountInput.value.trim();

    if (!newName || !newPhone || !newAddress || !newAccount) {
        showMessage('يرجى ملء جميع حقول التعديل.', 'error');
        return;
    }
    
    // التحقق من صلاحية رقم الهاتف (يمكن تحسين هذه الوظيفة)
    if (!/^\d{9}$/.test(newPhone)) { // يفترض رقم يمني 9 أرقام فقط
        showMessage('يرجى إدخال رقم هاتف صحيح مكون من 9 أرقام.', 'error');
        return;
    }

    showLoading('جاري حفظ التغييرات...');
    try {
        await database.ref('users/' + currentUserUid).update({
            name: newName,
            phone: newPhone,
            address: newAddress,
            account: newAccount
        });
        hideLoading();
        showMessage('تم حفظ التغييرات بنجاح!', 'success');
        // تحديث عرض البيانات بعد الحفظ
        profileNameElem.textContent = newName;
        detailPhoneElem.textContent = newPhone;
        detailAddressElem.textContent = newAddress;
        detailAccountElem.textContent = newAccount;
        // إخفاء نموذج التعديل
        editProfileForm.classList.add('hidden');
        document.querySelector('.profile-details').classList.remove('hidden');
    } catch (error) {
        hideLoading();
        console.error('Error updating profile:', error);
        showMessage('حدث خطأ أثناء حفظ التغييرات: ' + error.message, 'error');
    }
});

// تسجيل الخروج
logoutBtn.addEventListener('click', async () => {
    showLoading('جاري تسجيل الخروج...');
    try {
        await auth.signOut();
        hideLoading();
        showMessage('تم تسجيل الخروج بنجاح!', 'success');
        setTimeout(() => {
            window.location.href = '../index.html'; // العودة للصفحة الرئيسية
        }, 1500);
    } catch (error) {
        hideLoading();
        console.error('Logout error:', error);
        showMessage('حدث خطأ أثناء تسجيل الخروج: ' + error.message, 'error');
    }
});

// معالجات الأحداث لأيقونات شريط التذييل والهيدر
closeProfileBtn.addEventListener('click', () => {
    window.location.href = '../index.html'; // العودة للصفحة الرئيسية
});

homeIcon.addEventListener('click', () => {
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
