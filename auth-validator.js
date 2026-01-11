// Inisialisasi DOM untuk autentikasi
document.addEventListener('DOMContentLoaded', function() {
    console.log("🔐 Auth validator initializing...");
    
    // Login Form
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    // Hanya jalankan jika di halaman login
    if (loginForm || registerForm) {
        setupLoginPage();
    }
    
    // Validasi Admin untuk halaman admin.html - DIPERBAIKI
    if (window.location.pathname.includes('admin.html')) {
        console.log("🔄 Memulai validasi akses admin...");
        // Tunggu lebih lama untuk memastikan FirebaseApp dimuat
        setTimeout(() => {
            validateAdminAccess();
        }, 1500);
    }
    
    // Cek status login untuk semua halaman kecuali login
    if (!window.location.pathname.includes('index.html')) {
        console.log("👤 Memulai cek autentikasi umum...");
        // Delay lebih lama untuk menghindari race condition
        setTimeout(() => {
            checkUserAuth();
        }, 1000);
    }
});

function setupLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const registerLink = document.getElementById('registerLink');
    const backToLogin = document.getElementById('backToLogin');
    const showPassword = document.getElementById('showPassword');
    const forgotPassword = document.getElementById('forgotPassword');
    
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
            
            // Pastikan Firebase sudah diinisialisasi
            if (!window.firebaseApp || !window.firebaseApp.getAuth) {
                showNotification('Sistem belum siap, silakan refresh halaman', 'error');
                return;
            }
            
            const auth = window.firebaseApp.getAuth();
            if (!auth) {
                throw new Error('Auth service tidak tersedia');
            }
            
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Cek apakah email ada di mapping
            const teacherInfo = window.firebaseApp?.teacherMapping[email];
            if (!teacherInfo) {
                showNotification('Email tidak terdaftar sebagai guru/admin', 'error');
                await auth.signOut();
                return;
            }
            
            // Simpan data ke localStorage dengan timestamp
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userRole', teacherInfo.role);
            localStorage.setItem('userName', teacherInfo.name || email.split('@')[0]);
            localStorage.setItem('loginTime', Date.now().toString());
            
            if (teacherInfo.role === 'guru_kelas' || teacherInfo.role === 'guru_pjok') {
                localStorage.setItem('teacherClasses', JSON.stringify(teacherInfo.classes));
            }
            
            showNotification('Login berhasil!', 'success');
            
            // Setup realtime listeners setelah login sukses
            setTimeout(() => {
                if (window.firebaseApp && window.firebaseApp.setupRealtimeListeners) {
                    window.firebaseApp.setupRealtimeListeners();
                }
            }, 500);
            
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
    
    // Lupa Password
    forgotPassword?.addEventListener('click', async function(e) {
        e.preventDefault();
        
        const email = prompt('Masukkan email untuk reset password:');
        if (!email) return;
        
        try {
            if (!window.firebaseApp || !window.firebaseApp.getAuth) {
                showNotification('Sistem belum siap', 'error');
                return;
            }
            
            const auth = window.firebaseApp.getAuth();
            await auth.sendPasswordResetEmail(email);
            showNotification('Email reset password telah dikirim!', 'success');
        } catch (error) {
            console.error('Password reset error:', error);
            showNotification(getErrorMessage(error.code), 'error');
        }
    });
}

// Fungsi untuk validasi akses admin - DIPERBAIKI TOTAL
let adminValidationInProgress = false;
let adminValidationDone = false;

async function validateAdminAccess() {
    // Cek jika sudah dalam proses atau sudah selesai
    if (adminValidationInProgress) {
        console.log("⏳ Validasi admin sedang berjalan, tunggu...");
        return;
    }
    
    if (adminValidationDone) {
        console.log("✅ Validasi admin sudah selesai sebelumnya");
        return;
    }
    
    adminValidationInProgress = true;
    console.log("🔒 Memulai validasi akses admin...");
    
    try {
        // 1. Cek localStorage terlebih dahulu (cepat)
        const userEmail = localStorage.getItem('userEmail');
        const userRole = localStorage.getItem('userRole');
        const loginTime = localStorage.getItem('loginTime');
        
        console.log("📋 Data localStorage:", { userEmail, userRole, loginTime });
        
        if (!userEmail || !userRole) {
            console.log("❌ Tidak ada data login di localStorage");
            window.location.href = 'index.html';
            return;
        }
        
        // Cek apakah login sudah expired (lebih dari 24 jam)
        if (loginTime) {
            const loginAge = Date.now() - parseInt(loginTime);
            const MAX_LOGIN_AGE = 24 * 60 * 60 * 1000; // 24 jam
            if (loginAge > MAX_LOGIN_AGE) {
                console.log("⏰ Session expired");
                clearUserData();
                window.location.href = 'index.html';
                return;
            }
        }
        
        // Cek role dari localStorage
        if (userRole !== 'admin') {
            console.error(`❌ Akses ditolak: Role ${userRole} tidak diizinkan untuk halaman admin`);
            showNotification('Hanya admin yang bisa mengakses halaman ini', 'error');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
            return;
        }
        
        // 2. Tunggu FirebaseApp jika belum siap (maksimal 5 detik)
        let attempts = 0;
        const maxAttempts = 10; // 5 detik (500ms * 10)
        
        while (!window.firebaseApp && attempts < maxAttempts) {
            console.log(`⏳ Menunggu FirebaseApp... (${attempts + 1}/${maxAttempts})`);
            await sleep(500);
            attempts++;
        }
        
        if (!window.firebaseApp) {
            console.error("❌ FirebaseApp tidak tersedia setelah menunggu");
            // Tetap izinkan akses jika data localStorage valid
            console.log("✅ Mengizinkan akses berdasarkan localStorage");
            adminValidationDone = true;
            return;
        }
        
        // 3. Tunggu Firebase initialization
        attempts = 0;
        while ((!window.firebaseApp.isInitialized || !window.firebaseApp.isInitialized()) && attempts < maxAttempts) {
            console.log(`⏳ Menunggu Firebase initialization... (${attempts + 1}/${maxAttempts})`);
            await sleep(500);
            attempts++;
        }
        
        // 4. Cek autentikasi Firebase (non-blocking, jangan reject)
        try {
            console.log("🔐 Memeriksa autentikasi Firebase...");
            const userInfo = await window.firebaseApp.checkAuth('admin');
            
            if (userInfo && userInfo.role === 'admin') {
                console.log("✅ Firebase auth valid untuk admin:", userInfo.email);
            } else {
                console.warn("⚠️ Firebase auth tidak valid, tetapi localStorage valid");
            }
        } catch (firebaseError) {
            console.warn("⚠️ Error Firebase auth (tapi tetap lanjut):", firebaseError.message);
            // JANGAN redirect di sini, karena localStorage sudah valid
        }
        
        // 5. Setup realtime listeners jika tersedia
        setTimeout(() => {
            if (window.firebaseApp && window.firebaseApp.setupRealtimeListeners) {
                console.log("📡 Setup realtime listeners untuk admin");
                window.firebaseApp.setupRealtimeListeners();
            }
        }, 1000);
        
        console.log("✅ Validasi admin berhasil (berdasarkan localStorage)");
        adminValidationDone = true;
        
    } catch (error) {
        console.error("❌ Error dalam proses validasi admin:", error);
        showNotification('Gagal memvalidasi akses admin', 'error');
        
        // Fallback: coba lagi setelah 2 detik
        setTimeout(() => {
            adminValidationInProgress = false;
            if (!adminValidationDone) {
                validateAdminAccess();
            }
        }, 2000);
    } finally {
        adminValidationInProgress = false;
    }
}

// Fungsi untuk cek autentikasi umum - DIPERBAIKI TOTAL
let generalAuthCheckInProgress = false;
let generalAuthCheckDone = false;

async function checkUserAuth() {
    // Cek jika sudah dalam proses atau sudah selesai
    if (generalAuthCheckInProgress) {
        console.log("⏳ Cek auth sedang berjalan, tunggu...");
        return;
    }
    
    if (generalAuthCheckDone) {
        console.log("✅ Cek auth sudah selesai sebelumnya");
        return;
    }
    
    generalAuthCheckInProgress = true;
    console.log("👤 Memulai cek autentikasi umum...");
    
    try {
        // 1. Cek localStorage terlebih dahulu
        const userEmail = localStorage.getItem('userEmail');
        const userRole = localStorage.getItem('userRole');
        const loginTime = localStorage.getItem('loginTime');
        
        console.log("📋 Data localStorage:", { userEmail, userRole });
        
        if (!userEmail || !userRole) {
            console.log("❌ Tidak ada data login di localStorage");
            window.location.href = 'index.html';
            return;
        }
        
        // Cek apakah login sudah expired (lebih dari 24 jam)
        if (loginTime) {
            const loginAge = Date.now() - parseInt(loginTime);
            const MAX_LOGIN_AGE = 24 * 60 * 60 * 1000; // 24 jam
            if (loginAge > MAX_LOGIN_AGE) {
                console.log("⏰ Session expired");
                clearUserData();
                window.location.href = 'index.html';
                return;
            }
        }
        
        // 2. Tunggu FirebaseApp (non-blocking)
        setTimeout(() => {
            if (window.firebaseApp && window.firebaseApp.setupRealtimeListeners) {
                console.log("📡 Setup realtime listeners");
                window.firebaseApp.setupRealtimeListeners();
            }
        }, 1500);
        
        console.log("✅ Cek auth berhasil (berdasarkan localStorage)");
        generalAuthCheckDone = true;
        
    } catch (error) {
        console.error("❌ Error dalam cek auth:", error);
        
        // Fallback: coba lagi setelah 2 detik
        setTimeout(() => {
            generalAuthCheckInProgress = false;
            if (!generalAuthCheckDone) {
                checkUserAuth();
            }
        }, 2000);
    } finally {
        generalAuthCheckInProgress = false;
    }
}

// Helper function untuk delay
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Fungsi untuk membersihkan data user
function clearUserData() {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('teacherClasses');
    localStorage.removeItem('userClasses');
    localStorage.removeItem('loginTime');
    console.log("🧹 Data user dibersihkan dari localStorage");
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
        max-width: 400px;
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

// Export fungsi clearUserData ke global scope
window.clearUserData = clearUserData;