// Inisialisasi DOM untuk autentikasi
document.addEventListener('DOMContentLoaded', function() {
    // Login Form
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const registerLink = document.getElementById('registerLink');
    const backToLogin = document.getElementById('backToLogin');
    const showPassword = document.getElementById('showPassword');
    const forgotPassword = document.getElementById('forgotPassword');
    const googleLogin = document.getElementById('googleLogin');
    const btnRegister = document.getElementById('btnRegister');
    
    // Toggle antara Login dan Register
    registerLink?.addEventListener('click', function(e) {
        e.preventDefault();
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'block';
    });
    
    backToLogin?.addEventListener('click', function() {
        if (registerForm) registerForm.style.display = 'none';
        if (loginForm) loginForm.style.display = 'block';
    });
    
    // Toggle show password
    showPassword?.addEventListener('click', function() {
        const passwordInput = document.getElementById('password');
        const icon = this.querySelector('i');
        
        if (passwordInput && icon) {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                passwordInput.type = 'password';
                icon.className = 'fas fa-eye';
            }
        }
    });
    
    // Login dengan Email/Password
    loginForm?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email')?.value;
        const password = document.getElementById('password')?.value;
        
        if (!email || !password) {
            showNotification('Email dan password harus diisi!', 'error');
            return;
        }
        
        try {
            showNotification('Memproses login...', 'info');
            
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Cek apakah email ada di mapping
            const teacherInfo = window.firebaseApp?.teacherMapping[email];
            if (!teacherInfo) {
                showNotification('Email tidak terdaftar sebagai guru/admin', 'error');
                await firebase.auth().signOut();
                return;
            }
            
            // Simpan data ke localStorage
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userRole', teacherInfo.role);
            localStorage.setItem('userName', teacherInfo.name || email.split('@')[0]);
            
            if (teacherInfo.role === 'guru_kelas' || teacherInfo.role === 'guru_pjok') {
                localStorage.setItem('teacherClasses', JSON.stringify(teacherInfo.classes));
            }
            
            showNotification('Login berhasil!', 'success');
            
            // Redirect berdasarkan role
            setTimeout(() => {
                if (teacherInfo.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            }, 1000);
            
        } catch (error) {
            console.error('Login error:', error);
            showNotification(getErrorMessage(error.code), 'error');
        }
    });
    
    // Registrasi (hanya untuk admin - jika diperlukan)
    btnRegister?.addEventListener('click', async function() {
        const name = document.getElementById('regName')?.value;
        const email = document.getElementById('regEmail')?.value;
        const password = document.getElementById('regPassword')?.value;
        const role = document.getElementById('regRole')?.value;
        
        if (!name || !email || !password || !role) {
            showNotification('Harap isi semua field!', 'error');
            return;
        }
        
        if (password.length < 6) {
            showNotification('Password minimal 6 karakter!', 'error');
            return;
        }
        
        // Validasi email harus @rbt.com untuk sistem ini
        if (!email.endsWith('@rbt.com')) {
            showNotification('Email harus menggunakan domain @rbt.com', 'error');
            return;
        }
        
        try {
            showNotification('Mendaftarkan pengguna...', 'info');
            
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Tambahkan ke teacherMapping di firebase-app.js
            // Catatan: Ini harus diupdate secara manual di firebase-app.js
            showNotification('Akun berhasil dibuat. Silakan hubungi admin untuk konfigurasi kelas.', 'success');
            
            // Kembali ke login
            setTimeout(() => {
                if (registerForm) registerForm.style.display = 'none';
                if (loginForm) loginForm.style.display = 'block';
                if (loginForm) loginForm.reset();
                if (registerForm) registerForm.reset();
            }, 2000);
            
        } catch (error) {
            console.error('Registration error:', error);
            showNotification(getErrorMessage(error.code), 'error');
        }
    });
    
    // Lupa Password
    forgotPassword?.addEventListener('click', async function(e) {
        e.preventDefault();
        
        const email = prompt('Masukkan email untuk reset password:');
        if (!email) return;
        
        try {
            await firebase.auth().sendPasswordResetEmail(email);
            showNotification('Email reset password telah dikirim!', 'success');
        } catch (error) {
            console.error('Password reset error:', error);
            showNotification(getErrorMessage(error.code), 'error');
        }
    });
    
    // Validasi Admin untuk halaman admin.html
    if (window.location.pathname.includes('admin.html')) {
        validateAdminAccess();
    }
    
    // Cek status login untuk semua halaman kecuali login
    if (!window.location.pathname.includes('index.html')) {
        checkUserAuth();
    }
});

// Fungsi untuk validasi akses admin
async function validateAdminAccess() {
    try {
        console.log("🔒 Memvalidasi akses admin...");
        
        // Tunggu FirebaseApp dimuat
        if (!window.firebaseApp) {
            console.warn("FirebaseApp belum dimuat, menunggu...");
            setTimeout(validateAdminAccess, 500);
            return;
        }
        
        // Cek autentikasi dengan role admin
        const userInfo = await window.firebaseApp.checkAuth('admin');
        
        if (!userInfo) {
            console.error("❌ Validasi admin gagal: User info tidak ditemukan");
            window.location.href = 'index.html';
            return;
        }
        
        if (userInfo.role !== 'admin') {
            console.error(`❌ Akses ditolak: Role ${userInfo.role} tidak diizinkan`);
            showNotification('Hanya admin yang bisa mengakses halaman ini', 'error');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
            return;
        }
        
        console.log("✅ Akses admin divalidasi untuk:", userInfo.email);
        
        // Tampilkan nama admin di navbar
        const adminNameElement = document.getElementById('adminName');
        if (adminNameElement) {
            adminNameElement.textContent = userInfo.name || userInfo.email.split('@')[0];
        }
        
        // Setup fungsi admin
        setupAdminFunctions();
        
    } catch (error) {
        console.error("❌ Error validasi admin:", error);
        if (error.message !== "Pengguna belum terautentikasi") {
            showNotification('Gagal memvalidasi akses admin', 'error');
        }
        window.location.href = 'index.html';
    }
}

// Fungsi untuk setup fungsi admin
function setupAdminFunctions() {
    console.log("⚙️ Menyiapkan fungsi admin...");
    
    // Setup fungsi hapus nilai
    const deleteScoresButtons = document.querySelectorAll('[data-action="delete-scores"]');
    deleteScoresButtons.forEach(button => {
        button.addEventListener('click', handleDeleteScores);
    });
    
    // Setup fungsi hapus absensi
    const deleteAttendanceButtons = document.querySelectorAll('[data-action="delete-attendance"]');
    deleteAttendanceButtons.forEach(button => {
        button.addEventListener('click', handleDeleteAttendance);
    });
    
    // Setup fungsi edit siswa
    const editStudentButtons = document.querySelectorAll('[data-action="edit-student"]');
    editStudentButtons.forEach(button => {
        button.addEventListener('click', handleEditStudent);
    });
    
    console.log("✅ Fungsi admin berhasil disiapkan");
}

// Handler untuk menghapus nilai
async function handleDeleteScores(event) {
    const button = event.currentTarget;
    const scope = button.dataset.scope; // 'all', 'class', 'student'
    
    try {
        if (scope === 'all') {
            await window.firebaseApp.deleteAllScores();
        } else if (scope === 'class') {
            const kelas = prompt('Masukkan kelas (contoh: 1A, 2B, etc.):');
            if (kelas) {
                await window.firebaseApp.deleteAllScores({ kelas });
            }
        } else if (scope === 'student') {
            const studentId = prompt('Masukkan ID siswa:');
            const kelas = prompt('Masukkan kelas siswa:');
            if (studentId && kelas) {
                await window.firebaseApp.deleteAllScores({ kelas, studentId });
            }
        }
    } catch (error) {
        console.error("Error handling delete scores:", error);
    }
}

// Handler untuk menghapus absensi
async function handleDeleteAttendance(event) {
    const button = event.currentTarget;
    const scope = button.dataset.scope; // 'all', 'class', 'student'
    
    try {
        if (scope === 'all') {
            await window.firebaseApp.deleteAllAttendance();
        } else if (scope === 'class') {
            const kelas = prompt('Masukkan kelas (contoh: 1A, 2B, etc.):');
            if (kelas) {
                await window.firebaseApp.deleteAllAttendance({ kelas });
            }
        } else if (scope === 'student') {
            const studentId = prompt('Masukkan ID siswa:');
            const kelas = prompt('Masukkan kelas siswa:');
            if (studentId && kelas) {
                await window.firebaseApp.deleteAllAttendance({ kelas, studentId });
            }
        }
    } catch (error) {
        console.error("Error handling delete attendance:", error);
    }
}

// Handler untuk edit siswa
async function handleEditStudent(event) {
    const studentId = prompt('Masukkan ID siswa yang akan diedit:');
    const kelas = prompt('Masukkan kelas siswa:');
    
    if (!studentId || !kelas) {
        showNotification('ID siswa dan kelas harus diisi', 'error');
        return;
    }
    
    // Ambil data siswa saat ini
    try {
        const students = await window.firebaseApp.getStudents(kelas);
        const student = students.find(s => s.id === studentId);
        
        if (!student) {
            showNotification(`Siswa dengan ID ${studentId} tidak ditemukan di kelas ${kelas}`, 'error');
            return;
        }
        
        // Tampilkan form edit
        const formHtml = `
            <div class="edit-student-form">
                <h3>Edit Data Siswa</h3>
                <p><strong>ID:</strong> ${student.id}</p>
                <p><strong>Nama:</strong> ${student.nama}</p>
                <p><strong>Kelas:</strong> ${student.kelas}</p>
                
                <label>Jenis Kelamin:</label>
                <select id="editGender">
                    <option value="L" ${student.jenis_kelamin === 'L' ? 'selected' : ''}>Laki-laki</option>
                    <option value="P" ${student.jenis_kelamin === 'P' ? 'selected' : ''}>Perempuan</option>
                </select>
                
                <label>Status:</label>
                <select id="editStatus">
                    <option value="aktif" ${student.status === 'aktif' ? 'selected' : ''}>Aktif</option>
                    <option value="nonaktif" ${student.status === 'nonaktif' ? 'selected' : ''}>Nonaktif</option>
                </select>
                
                <button onclick="saveStudentEdit('${studentId}', '${kelas}')" style="margin-top: 10px;">Simpan Perubahan</button>
            </div>
        `;
        
        // Tampilkan modal atau form
        const modal = document.createElement('div');
        modal.id = 'editStudentModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 10px;
            max-width: 400px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        `;
        modalContent.innerHTML = formHtml;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Tambahkan tombol close
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Tutup';
        closeBtn.style.cssText = `
            margin-top: 10px;
            padding: 5px 10px;
            background: #e74c3c;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        `;
        closeBtn.onclick = () => modal.remove();
        modalContent.appendChild(closeBtn);
        
    } catch (error) {
        console.error("Error getting student data:", error);
        showNotification("Gagal mengambil data siswa", "error");
    }
}

// Fungsi untuk menyimpan edit siswa (global)
window.saveStudentEdit = async function(studentId, kelas) {
    const gender = document.getElementById('editGender')?.value;
    const status = document.getElementById('editStatus')?.value;
    
    if (!gender || !status) {
        showNotification('Semua field harus diisi', 'error');
        return;
    }
    
    try {
        const updates = {
            jenis_kelamin: gender,
            status: status
        };
        
        await window.firebaseApp.updateStudent(studentId, kelas, updates);
        
        // Tutup modal
        const modal = document.getElementById('editStudentModal');
        if (modal) modal.remove();
        
    } catch (error) {
        console.error("Error saving student edit:", error);
    }
};

// Fungsi untuk cek autentikasi umum
async function checkUserAuth() {
    try {
        if (!window.firebaseApp) {
            console.warn("FirebaseApp belum dimuat, menunggu...");
            setTimeout(checkUserAuth, 500);
            return;
        }
        
        const userInfo = await window.firebaseApp.checkAuth();
        
        if (!userInfo) {
            window.location.href = 'index.html';
            return;
        }
        
        // Tampilkan info user di navbar jika ada
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = userInfo.name || userInfo.email.split('@')[0];
        }
        
    } catch (error) {
        if (error.message !== "Pengguna belum terautentikasi") {
            console.error("Auth check error:", error);
        }
        window.location.href = 'index.html';
    }
}

// Fungsi untuk menampilkan notifikasi
function showNotification(message, type = 'info') {
    // Coba gunakan firebaseApp.showNotification jika ada
    if (window.firebaseApp && window.firebaseApp.showNotification) {
        window.firebaseApp.showNotification(message, type);
        return;
    }
    
    // Fallback notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    if (type === 'success') {
        notification.style.background = '#38a169';
    } else if (type === 'error') {
        notification.style.background = '#e53e3e';
    } else {
        notification.style.background = '#4299e1';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Fungsi untuk mendapatkan pesan error yang user-friendly
function getErrorMessage(errorCode) {
    const errorMessages = {
        'auth/invalid-email': 'Email tidak valid',
        'auth/user-disabled': 'Akun ini dinonaktifkan',
        'auth/user-not-found': 'Email tidak terdaftar',
        'auth/wrong-password': 'Password salah',
        'auth/email-already-in-use': 'Email sudah terdaftar',
        'auth/weak-password': 'Password terlalu lemah (minimal 6 karakter)',
        'auth/operation-not-allowed': 'Operasi tidak diizinkan',
        'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi nanti',
        'auth/network-request-failed': 'Koneksi jaringan bermasalah',
        'auth/requires-recent-login': 'Sesi login telah berakhir. Silakan login ulang'
    };
    
    return errorMessages[errorCode] || 'Terjadi kesalahan. Silakan coba lagi.';
}

// Tambahkan style untuk form edit
const style = document.createElement('style');
style.textContent = `
    .edit-student-form label {
        display: block;
        margin-top: 10px;
        font-weight: bold;
    }
    
    .edit-student-form select {
        width: 100%;
        padding: 8px;
        margin-top: 5px;
        border: 1px solid #ddd;
        border-radius: 5px;
    }
    
    .edit-student-form button {
        background: #27ae60;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        width: 100%;
        font-size: 16px;
    }
    
    .edit-student-form button:hover {
        background: #219955;
    }
`;
document.head.appendChild(style);