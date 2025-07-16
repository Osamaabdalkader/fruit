// جلب عناصر DOM للوحة تحكم المسؤول
const totalUsersElem = document.getElementById('total-users');
const totalPostsElem = document.getElementById('total-posts');
const pendingTransactionsElem = document.getElementById('pending-transactions');

const usersSection = document.getElementById('users-section');
const postsSection = document.getElementById('posts-section');
const transactionsSection = document.getElementById('transactions-section');

const userSearchInput = document.getElementById('user-search');
const postSearchInput = document.getElementById('post-search');
const transactionSearchInput = document.getElementById('transaction-search');

const usersTableBody = document.getElementById('users-table-body');
const postsTableBody = document.getElementById('posts-table-body');
const transactionsTableBody = document.getElementById('transactions-table-body');

const noUsersFoundMessage = document.getElementById('no-users-found');
const noPostsFoundMessage = document.getElementById('no-posts-found');
const noTransactionsFoundMessage = document.getElementById('no-transactions-found');

const closeAdminBtn = document.getElementById('close-admin');
const homeIcon = document.getElementById('home-icon');

// جلب أيقونات الفوتر (للتوجيه السليم من هذه الصفحة)
const profileIcon = document.getElementById('profile-icon'); // لجعلها نشطة بصريا فقط
const notificationsIcon = document.getElementById('notifications-icon');
const addPostIcon = document.getElementById('add-post-icon');
const supportIcon = document.getElementById('support-icon');
const moreIcon = document.getElementById('more-icon');

// استدعاء Firebase Auth و Database و Storage من الملف المشترك
const auth = firebase.auth();
const database = firebase.database();
const storage = firebase.storage();

let allUsers = [];
let allPosts = [];
let allTransactions = [];

// تحميل بيانات لوحة التحكم عند فتح الصفحة
document.addEventListener('DOMContentLoaded', () => {
    showLoading('جاري تحميل بيانات لوحة التحكم...');
    auth.onAuthStateChanged(user => {
        if (user && user.email === 'admin@tasre.com') {
            // قم بتحميل جميع البيانات
            loadAllData();
            // تحديث سلوك أيقونة الحساب في الفوتر (في هذه الصفحة لا تفعل شيئًا خاصًا)
            profileIcon.onclick = () => { /* لا تفعل شيئًا، أنت بالفعل في هذه الصفحة */ };

        } else {
            // إذا لم يكن المستخدم مسؤولاً، أعد توجيهه
            hideLoading();
            showMessage('غير مصرح لك بالوصول إلى هذه الصفحة.', 'error');
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1500);
        }
    });
});

// وظيفة تحميل جميع البيانات
async function loadAllData() {
    try {
        // تحميل المستخدمين
        const usersSnapshot = await database.ref('users').once('value');
        allUsers = [];
        if (usersSnapshot.exists()) {
            usersSnapshot.forEach(childSnapshot => {
                allUsers.push({ id: childSnapshot.key, ...childSnapshot.val() });
            });
        }
        totalUsersElem.textContent = allUsers.length;
        displayUsers(allUsers);

        // تحميل المنشورات
        const postsSnapshot = await database.ref('posts').once('value');
        allPosts = [];
        if (postsSnapshot.exists()) {
            postsSnapshot.forEach(childSnapshot => {
                allPosts.push({ id: childSnapshot.key, ...childSnapshot.val() });
            });
        }
        totalPostsElem.textContent = allPosts.length;
        displayPosts(allPosts);

        // تحميل المعاملات
        const transactionsSnapshot = await database.ref('transactions').once('value');
        allTransactions = [];
        let pendingCount = 0;
        if (transactionsSnapshot.exists()) {
            transactionsSnapshot.forEach(childSnapshot => {
                const transaction = { id: childSnapshot.key, ...childSnapshot.val() };
                allTransactions.push(transaction);
                if (transaction.status === 'pending') {
                    pendingCount++;
                }
            });
        }
        pendingTransactionsElem.textContent = pendingCount;
        displayTransactions(allTransactions);

        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Error loading admin data:', error);
        showMessage('حدث خطأ أثناء تحميل بيانات لوحة التحكم.', 'error');
    }
}

// عرض المستخدمين في الجدول
function displayUsers(users) {
    usersTableBody.innerHTML = '';
    if (users.length === 0) {
        noUsersFoundMessage.classList.remove('hidden');
        return;
    }
    noUsersFoundMessage.classList.add('hidden');

    users.forEach(user => {
        const row = usersTableBody.insertRow();
        row.innerHTML = `
            <td>${user.name || 'غير معروف'}</td>
            <td>${user.email || 'غير معروف'}</td>
            <td>${user.phone || 'غير متوفر'}</td>
            <td>${user.address || 'غير متوفر'}</td>
            <td>${user.account || 'غير متوفر'}</td>
            <td>
                <button class="btn-action btn-delete" onclick="deleteUser('${user.id}', '${user.email}')">
                    <i class="fas fa-trash-alt"></i> حذف
                </button>
            </td>
        `;
    });
}

// عرض المنشورات في الجدول
function displayPosts(posts) {
    postsTableBody.innerHTML = '';
    if (posts.length === 0) {
        noPostsFoundMessage.classList.remove('hidden');
        return;
    }
    noPostsFoundMessage.classList.add('hidden');

    posts.forEach(post => {
        const row = postsTableBody.insertRow();
        row.innerHTML = `
            <td>${post.title}</td>
            <td>${post.authorName || 'غير معروف'}</td>
            <td>${post.price ? `${post.price} ر.ي` : 'غير محدد'}</td>
            <td>${post.location}</td>
            <td>${formatDate(post.timestamp)}</td>
            <td>
                <button class="btn-action btn-delete" onclick="deletePost('${post.id}', '${post.imageUrl || ''}')">
                    <i class="fas fa-trash-alt"></i> حذف
                </button>
            </td>
        `;
    });
}

// عرض المعاملات في الجدول
function displayTransactions(transactions) {
    transactionsTableBody.innerHTML = '';
    if (transactions.length === 0) {
        noTransactionsFoundMessage.classList.remove('hidden');
        return;
    }
    noTransactionsFoundMessage.classList.add('hidden');

    transactions.forEach(transaction => {
        const statusClass = `status-${transaction.status}`;
        row = transactionsTableBody.insertRow();
        row.innerHTML = `
            <td>${transaction.postTitle || 'غير محدد'}</td>
            <td>${transaction.amount ? `${transaction.amount} ر.ي` : 'غير محدد'}</td>
            <td>${transaction.buyerName || 'غير معروف'}</td>
            <td>${transaction.sellerAccount || 'غير متوفر'}</td>
            <td>
                ${transaction.receiptImageUrl ? `<a href="${transaction.receiptImageUrl}" target="_blank" class="btn-action"><i class="fas fa-eye"></i> عرض</a>` : 'لا يوجد'}
            </td>
            <td>${transaction.transactionId || 'لا يوجد'}</td>
            <td class="${statusClass}">${getStatusDisplayName(transaction.status)}</td>
            <td>${formatDate(transaction.timestamp)}</td>
            <td>
                ${transaction.status === 'pending' ? `
                    <button class="btn-action btn-toggle" onclick="updateTransactionStatus('${transaction.id}', 'completed')">
                        <i class="fas fa-check"></i> إتمام
                    </button>
                    <button class="btn-action btn-delete" onclick="updateTransactionStatus('${transaction.id}', 'cancelled')">
                        <i class="fas fa-times"></i> إلغاء
                    </button>
                ` : 'لا يوجد إجراء'}
            </td>
        `;
    });
}

function getStatusDisplayName(status) {
    switch (status) {
        case 'pending': return 'قيد الانتظار';
        case 'completed': return 'مكتملة';
        case 'cancelled': return 'ملغاة';
        default: return status;
    }
}

// تبديل الأقسام
document.querySelectorAll('.admin-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // إزالة "active" من جميع الأزرار والأقسام
        document.querySelectorAll('.admin-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));

        // إضافة "active" للزر والقسم النشط
        btn.classList.add('active');
        const targetTab = btn.dataset.tab;
        document.getElementById(`${targetTab}-section`).classList.remove('hidden');
    });
});

// وظائف البحث
userSearchInput.addEventListener('input', () => {
    const searchTerm = userSearchInput.value.toLowerCase();
    const filteredUsers = allUsers.filter(user =>
        (user.name && user.name.toLowerCase().includes(searchTerm)) ||
        (user.email && user.email.toLowerCase().includes(searchTerm))
    );
    displayUsers(filteredUsers);
});

postSearchInput.addEventListener('input', () => {
    const searchTerm = postSearchInput.value.toLowerCase();
    const filteredPosts = allPosts.filter(post =>
        (post.title && post.title.toLowerCase().includes(searchTerm)) ||
        (post.description && post.description.toLowerCase().includes(searchTerm))
    );
    displayPosts(filteredPosts);
});

transactionSearchInput.addEventListener('input', () => {
    const searchTerm = transactionSearchInput.value.toLowerCase();
    const filteredTransactions = allTransactions.filter(transaction =>
        (transaction.postTitle && transaction.postTitle.toLowerCase().includes(searchTerm)) ||
        (transaction.buyerName && transaction.buyerName.toLowerCase().includes(searchTerm)) ||
        (transaction.transactionId && transaction.transactionId.toLowerCase().includes(searchTerm))
    );
    displayTransactions(filteredTransactions);
});


// وظائف الإدارة (حذف وتحديث) - يجب أن تكون هذه الوظائف موجودة بشكل عام
// حذف مستخدم (تحذير: هذا سيحذف المستخدم من Firebase Auth أيضاً!)
async function deleteUser(uid, email) {
    if (!confirm(`هل أنت متأكد من حذف المستخدم: ${email}؟ هذا الإجراء لا يمكن التراجع عنه!`)) {
        return;
    }

    showLoading('جاري حذف المستخدم...');
    try {
        // لا يمكن حذف مستخدم من Firebase Auth مباشرة من جانب العميل لأسباب أمنية.
        // ستحتاج إلى وظيفة Firebase Cloud Function أو مسؤول Node.js
        // التي يتم استدعاؤها من هنا. ولكن لأغراض هذا المشروع المبسط، سنقوم فقط بحذفه من Realtime Database.
        // في تطبيق حقيقي، هذا غير كافٍ.
        await database.ref('users/' + uid).remove();

        // حذف منشورات المستخدم
        const userPostsRef = database.ref('posts').orderByChild('authorId').equalTo(uid);
        const userPostsSnapshot = await userPostsRef.once('value');
        if (userPostsSnapshot.exists()) {
            const deletePromises = [];
            userPostsSnapshot.forEach(childSnapshot => {
                const post = childSnapshot.val();
                if (post.imageUrl) {
                    deletePromises.push(storage.refFromURL(post.imageUrl).delete());
                }
                deletePromises.push(childSnapshot.ref.remove());
            });
            await Promise.all(deletePromises);
        }

        // تحديث الواجهة بعد الحذف
        allUsers = allUsers.filter(user => user.id !== uid);
        totalUsersElem.textContent = allUsers.length;
        displayUsers(allUsers);
        
        // إعادة تحميل المنشورات والمعاملات لتنعكس التغييرات
        loadAllData(); // لإعادة تحديث جميع الجداول
        
        hideLoading();
        showMessage('تم حذف المستخدم ومنشوراته بنجاح!', 'success');
    } catch (error) {
        hideLoading();
        console.error('Error deleting user:', error);
        showMessage('حدث خطأ أثناء حذف المستخدم: ' + error.message, 'error');
    }
}

// حذف منشور
async function deletePost(postId, imageUrl) {
    if (!confirm('هل أنت متأكد من حذف هذا المنشور؟ هذا الإجراء لا يمكن التراجع عنه!')) {
        return;
    }

    showLoading('جاري حذف المنشور...');
    try {
        // حذف الصورة من التخزين إذا وجدت
        if (imageUrl) {
            const imageRef = storage.refFromURL(imageUrl);
            await imageRef.delete();
        }

        // حذف المنشور من قاعدة البيانات
        await database.ref('posts/' + postId).remove();
        
        // تحديث الواجهة بعد الحذف
        allPosts = allPosts.filter(post => post.id !== postId);
        totalPostsElem.textContent = allPosts.length;
        displayPosts(allPosts);

        // تحديث المعاملات المتعلقة بهذا المنشور (يمكن إلغاء المعاملات أو وضع علامة عليها)
        // هنا، سنبسط الأمر ونعيد تحميل المعاملات بالكامل
        loadAllData(); 
        
        hideLoading();
        showMessage('تم حذف المنشور بنجاح!', 'success');
    } catch (error) {
        hideLoading();
        console.error('Error deleting post:', error);
        showMessage('حدث خطأ أثناء حذف المنشور: ' + error.message, 'error');
    }
}

// تحديث حالة المعاملة
async function updateTransactionStatus(transactionId, newStatus) {
    if (!confirm(`هل أنت متأكد من تغيير حالة هذه المعاملة إلى: ${getStatusDisplayName(newStatus)}؟`)) {
        return;
    }

    showLoading('جاري تحديث حالة المعاملة...');
    try {
        await database.ref('transactions/' + transactionId).update({ status: newStatus });
        
        // تحديث الواجهة بعد التحديث
        allTransactions = allTransactions.map(t => t.id === transactionId ? { ...t, status: newStatus } : t);
        
        // تحديث عدد المعاملات المعلقة
        const pendingCount = allTransactions.filter(t => t.status === 'pending').length;
        pendingTransactionsElem.textContent = pendingCount;

        displayTransactions(allTransactions); // إعادة عرض الجدول بالكامل
        
        hideLoading();
        showMessage('تم تحديث حالة المعاملة بنجاح!', 'success');
    } catch (error) {
        hideLoading();
        console.error('Error updating transaction status:', error);
        showMessage('حدث خطأ أثناء تحديث حالة المعاملة: ' + error.message, 'error');
    }
}


// معالجات الأحداث لأيقونات شريط الرأس والتذييل
closeAdminBtn.addEventListener('click', () => {
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
