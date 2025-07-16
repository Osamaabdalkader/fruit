// جلب عناصر DOM الخاصة بالصفحة الرئيسية
const postsContainer = document.getElementById('posts-container');

// جلب الأيقونات التي تؤدي إلى صفحات أخرى
const profileIcon = document.getElementById('profile-icon');
const addPostIcon = document.getElementById('add-post-icon');
const homeIcon = document.getElementById('home-icon'); // في حال الحاجة للعودة من هذه الصفحة لنفسها

// استدعاء Firebase Auth و Database من الملف المشترك
const auth = firebase.auth();
const database = firebase.database();

// متغيرات عامة خاصة بهذه الصفحة
let currentProduct = null; // لتخزين بيانات المنتج الحالي عند النقر عليه

// تحميل المنشورات عند بدء تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    loadPosts();
    // استمع لتغير حالة المستخدم لتحديد سلوك أيقونة الحساب
    auth.onAuthStateChanged(user => {
        if (user && user.email === 'admin@tasre.com') {
            profileIcon.onclick = () => {
                window.location.href = 'admin/admin.html'; // توجيه المسؤول إلى لوحة التحكم
            };
        } else {
            profileIcon.onclick = () => {
                window.location.href = 'profile/profile.html'; // توجيه المستخدم العادي إلى صفحته الشخصية
            };
        }
    });
});

// تحميل المنشورات من قاعدة البيانات وعرضها
function loadPosts() {
    const postsRef = database.ref('posts');
    // استخدم 'on' للاستماع للتغييرات في الوقت الفعلي
    postsRef.on('value', (snapshot) => {
        postsContainer.innerHTML = ''; // مسح المنشورات الموجودة قبل إعادة التحميل

        if (snapshot.exists()) {
            const posts = snapshot.val();
            // عرض المنشورات الأحدث أولاً
            Object.keys(posts).reverse().forEach(postId => {
                const post = posts[postId];
                // إضافة معرف المنشور إلى كائن المنشور لسهولة الوصول إليه لاحقاً
                createPostCard({ ...post, id: postId });
            });
        } else {
            postsContainer.innerHTML = '<p class="no-posts">لا توجد منشورات بعد. كن أول من ينشر!</p>';
        }
    }, (error) => {
        console.error("Error loading posts: ", error);
        showMessage('حدث خطأ أثناء تحميل المنشورات.', 'error');
    });
}

// إنشاء بطاقة منشور HTML
function createPostCard(post) {
    const postCard = document.createElement('div');
    postCard.className = 'post-card';
    postCard.dataset.id = post.id; // حفظ معرف المنشور في بيانات العنصر

    // إذا كان هناك صورة، نعرضها. وإلا نعرض أيقونة افتراضية.
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
            <div class="post-author">
                <i class="fas fa-user"></i> ${post.authorName}
            </div>
        </div>
    `;

    // إضافة حدث النقر لفتح صفحة التفاصيل
    postCard.addEventListener('click', () => {
        // بدلاً من عرض صفحة تفاصيل كقسم، سننتقل إلى صفحة HTML مخصصة
        // سنستخدم LocalStorage لتمرير بيانات المنشور أو فقط معرفه
        localStorage.setItem('currentPostId', post.id);
        window.location.href = 'post-details/post-details.html';
    });

    postsContainer.appendChild(postCard);
}

// معالجات الأحداث لأيقونات شريط التذييل
addPostIcon.addEventListener('click', () => {
    // التحقق من تسجيل الدخول قبل التوجيه
    if (auth.currentUser) {
        window.location.href = 'add-post/add-post.html';
    } else {
        showMessage('يرجى تسجيل الدخول لنشر منشور جديد.', 'error');
        // يمكن التوجيه لصفحة تسجيل الدخول إذا أردت
        setTimeout(() => {
            window.location.href = 'auth/auth.html';
        }, 1500);
    }
});

// العودة للصفحة الرئيسية (في هذه الصفحة لا يفعل شيئًا سوى إعادة التحميل إذا تم الضغط عليه)
homeIcon.addEventListener('click', () => {
    window.location.href = 'index.html';
});

// ملاحظة: الأيقونات الأخرى مثل 'notifications-icon', 'support-icon', 'more-icon'
// ستحتاج إلى معالجات أحداث خاصة بها وتوجيه إلى صفحاتها المعنية
// أو فتح نوافذ منبثقة/مودالز إذا كانت وظائفها بسيطة.
// على سبيل المثال:
document.getElementById('notifications-icon').addEventListener('click', () => {
    showMessage('وظيفة الإشعارات قيد التطوير!', 'info');
    // window.location.href = 'notifications/notifications.html';
});

document.getElementById('support-icon').addEventListener('click', () => {
    showMessage('للدعم الفني، يرجى التواصل على الهاتف: 77XXXXXXX', 'info');
    // window.location.href = 'support/support.html';
});

document.getElementById('more-icon').addEventListener('click', () => {
    showMessage('المزيد من الخيارات ستتوفر قريباً!', 'info');
    // window.location.href = 'more/more.html';
});
