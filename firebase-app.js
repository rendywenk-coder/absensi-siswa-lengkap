// ============================================
// KONFIGURASI FIREBASE YANG BENAR
// DIPERBAIKI: Versi konsisten dengan index.html
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyD_0hKhrz0vC7X_9KRrXiTOnRGI9Pi6tBI",
    authDomain: "absensi-dan-penilaian-siswa.firebaseapp.com",
    databaseURL: "https://absensi-dan-penilaian-siswa-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "absensi-dan-penilaian-siswa",
    storageBucket: "absensi-dan-penilaian-siswa.appspot.com",
    messagingSenderId: "774655798848",
    appId: "1:774655798848:web:d6ddb5a04d4acd91d1b9a5"
};

// ============================================
// INISIALISASI FIREBASE
// DIPERBAIKI: Error handling yang lebih baik
// ============================================
let firebaseAppInstance = null;
let firebaseAuth = null;
let firebaseDatabase = null;
let isFirebaseInitialized = false;

function initializeFirebase() {
    console.log("🚀 Memulai inisialisasi Firebase...");
    
    try {
        // DIPERBAIKI: Tidak langsung throw error, coba load SDK dulu
        if (typeof firebase === 'undefined') {
            console.warn("⚠️ Firebase SDK tidak ditemukan, mencoba memuat...");
            const success = loadFirebaseSDK();
            if (!success) {
                console.error("❌ Gagal memuat Firebase SDK");
                return false;
            }
            // Tunggu sebentar untuk SDK dimuat
            return new Promise((resolve) => {
                setTimeout(() => {
                    const retryResult = retryInitializeFirebase();
                    resolve(retryResult);
                }, 1000);
            });
        }
        
        // Cek apakah Firebase sudah diinisialisasi
        if (!firebase.apps.length) {
            console.log("📝 Menginisialisasi aplikasi Firebase baru...");
            firebaseAppInstance = firebase.initializeApp(firebaseConfig);
            console.log("✅ Firebase App berhasil diinisialisasi");
        } else {
            console.log("🔧 Menggunakan Firebase App yang sudah ada");
            firebaseAppInstance = firebase.app();
        }
        
        // Inisialisasi layanan Firebase
        firebaseAuth = firebase.auth();
        firebaseDatabase = firebase.database();
        
        console.log("✅ Firebase Auth & Database berhasil diinisialisasi");
        isFirebaseInitialized = true;
        
        // Test koneksi
        testFirebaseConnection();
        
        return true;
        
    } catch (error) {
        console.error("❌ Gagal menginisialisasi Firebase:", error);
        showGlobalError("Gagal menginisialisasi Firebase: " + error.message);
        
        // DIPERBAIKI: Coba recovery dengan reload SDK
        setTimeout(() => {
            console.log("🔄 Mencoba recovery...");
            loadFirebaseSDK();
        }, 3000);
        
        return false;
    }
}

// Fungsi tambahan untuk retry inisialisasi
function retryInitializeFirebase() {
    if (typeof firebase === 'undefined') {
        console.error("❌ Firebase SDK masih belum tersedia");
        return false;
    }
    return initializeFirebase();
}

// ============================================
// TEST KONEKSI FIREBASE
// ============================================
function testFirebaseConnection() {
    if (!firebaseDatabase) return;
    
    firebaseDatabase.ref('.info/connected').on('value', (snapshot) => {
        const isConnected = snapshot.val() === true;
        console.log(`📡 Status Koneksi Firebase: ${isConnected ? 'TERHUBUNG' : 'TERPUTUS'}`);
        
        if (!isConnected) {
            showNotification("Koneksi internet terputus", "warning");
        }
    });
}

// ============================================
// MAPPING GURU DAN KELAS
// ============================================
const teacherClassMapping = {
    // ADMIN
    'admin@rbt.com': {
        role: 'admin',
        classes: ['1A', '1B', '1C', '1D', '2A', '2B', '2C', '2D', '2E', 
                 '3A', '3B', '3C', '3D', '3E', '4A', '4B', '4C', '4D', '4E', '4F',
                 '5A', '5B', '5C', '5D', '5E', '6A', '6B', '6C', '6D', '6E'],
        name: 'Administrator'
    },
    
    // GURU KELAS 1
    'kelas1a@rbt.com': { role: 'guru_kelas', classes: ['1A'], name: 'Guru Kelas 1A' },
    'kelas1b@rbt.com': { role: 'guru_kelas', classes: ['1B'], name: 'Guru Kelas 1B' },
    'kelas1c@rbt.com': { role: 'guru_kelas', classes: ['1C'], name: 'Guru Kelas 1C' },
    'kelas1d@rbt.com': { role: 'guru_kelas', classes: ['1D'], name: 'Guru Kelas 1D' },
    
    // GURU KELAS 2
    'kelas2a@rbt.com': { role: 'guru_kelas', classes: ['2A'], name: 'Guru Kelas 2A' },
    'kelas2b@rbt.com': { role: 'guru_kelas', classes: ['2B'], name: 'Guru Kelas 2B' },
    'kelas2c@rbt.com': { role: 'guru_kelas', classes: ['2C'], name: 'Guru Kelas 2C' },
    'kelas2d@rbt.com': { role: 'guru_kelas', classes: ['2D'], name: 'Guru Kelas 2D' },
    'kelas2e@rbt.com': { role: 'guru_kelas', classes: ['2E'], name: 'Guru Kelas 2E' },
    
    // GURU KELAS 3
    'kelas3a@rbt.com': { role: 'guru_kelas', classes: ['3A'], name: 'Guru Kelas 3A' },
    'kelas3b@rbt.com': { role: 'guru_kelas', classes: ['3B'], name: 'Guru Kelas 3B' },
    'kelas3c@rbt.com': { role: 'guru_kelas', classes: ['3C'], name: 'Guru Kelas 3C' },
    'kelas3d@rbt.com': { role: 'guru_kelas', classes: ['3D'], name: 'Guru Kelas 3D' },
    'kelas3e@rbt.com': { role: 'guru_kelas', classes: ['3E'], name: 'Guru Kelas 3E' },
    
    // GURU KELAS 4
    'kelas4a@rbt.com': { role: 'guru_kelas', classes: ['4A'], name: 'Guru Kelas 4A' },
    'kelas4b@rbt.com': { role: 'guru_kelas', classes: ['4B'], name: 'Guru Kelas 4B' },
    'kelas4c@rbt.com': { role: 'guru_kelas', classes: ['4C'], name: 'Guru Kelas 4C' },
    'kelas4d@rbt.com': { role: 'guru_kelas', classes: ['4D'], name: 'Guru Kelas 4D' },
    'kelas4e@rbt.com': { role: 'guru_kelas', classes: ['4E'], name: 'Guru Kelas 4E' },
    'kelas4f@rbt.com': { role: 'guru_kelas', classes: ['4F'], name: 'Guru Kelas 4F' },
    
    // GURU KELAS 5
    'kelas5a@rbt.com': { role: 'guru_kelas', classes: ['5A'], name: 'Guru Kelas 5A' },
    'kelas5b@rbt.com': { role: 'guru_kelas', classes: ['5B'], name: 'Guru Kelas 5B' },
    'kelas5c@rbt.com': { role: 'guru_kelas', classes: ['5C'], name: 'Guru Kelas 5C' },
    'kelas5d@rbt.com': { role: 'guru_kelas', classes: ['5D'], name: 'Guru Kelas 5D' },
    'kelas5e@rbt.com': { role: 'guru_kelas', classes: ['5E'], name: 'Guru Kelas 5E' },
    
    // GURU KELAS 6
    'kelas6a@rbt.com': { role: 'guru_kelas', classes: ['6A'], name: 'Guru Kelas 6A' },
    'kelas6b@rbt.com': { role: 'guru_kelas', classes: ['6B'], name: 'Guru Kelas 6B' },
    'kelas6c@rbt.com': { role: 'guru_kelas', classes: ['6C'], name: 'Guru Kelas 6C' },
    'kelas6d@rbt.com': { role: 'guru_kelas', classes: ['6D'], name: 'Guru Kelas 6D' },
    'kelas6e@rbt.com': { role: 'guru_kelas', classes: ['6E'], name: 'Guru Kelas 6E' },
    
    // GURU PJOK
    'pjok1@rbt.com': { 
        role: 'guru_pjok', 
        classes: ['1A', '1B', '1C', '1D', '2A', '2B', '2C', '2D', '2E'],
        name: 'Guru PJOK 1'
    },
    'pjok2@rbt.com': { 
        role: 'guru_pjok', 
        classes: ['3A', '3B', '3C', '3D', '3E', '4A', '4B', '4C', '4D', '4E', '4F'],
        name: 'Guru PJOK 2'
    },
    'pjok3@rbt.com': { 
        role: 'guru_pjok', 
        classes: ['5A', '5B', '5C', '5D', '5E', '6A', '6B', '6C', '6D', '6E'],
        name: 'Guru PJOK 3'
    }
};

// ============================================
// FUNGSI ADMIN BARU - DITAMBAHKAN
// ============================================

// Fungsi untuk menghapus semua nilai
async function deleteAllScores(options = {}) {
    if (!firebaseDatabase) {
        throw new Error("Database tidak tersedia");
    }
    
    const { kelas, studentId, confirmation = true } = options;
    
    if (confirmation) {
        const confirmMessage = studentId 
            ? `Apakah Anda yakin ingin menghapus semua nilai untuk siswa ${studentId}?`
            : kelas 
                ? `Apakah Anda yakin ingin menghapus semua nilai untuk kelas ${kelas}?`
                : "Apakah Anda yakin ingin menghapus SEMUA NILAI di seluruh sekolah?";
        
        if (!confirm(confirmMessage)) {
            return { success: false, message: "Dibatalkan oleh pengguna" };
        }
    }
    
    try {
        showNotification("Menghapus nilai...", "info");
        
        let path = 'scores';
        if (kelas) {
            path = `scores/${kelas}`;
            if (studentId) {
                path = `scores/${kelas}/${studentId}`;
            }
        }
        
        await firebaseDatabase.ref(path).remove();
        
        const successMessage = studentId 
            ? `Semua nilai untuk siswa ${studentId} berhasil dihapus`
            : kelas 
                ? `Semua nilai untuk kelas ${kelas} berhasil dihapus`
                : "Semua nilai berhasil dihapus";
        
        showNotification(successMessage, "success");
        return { success: true, message: successMessage };
        
    } catch (error) {
        console.error("Error menghapus nilai:", error);
        showNotification("Gagal menghapus nilai: " + error.message, "error");
        return { success: false, message: error.message };
    }
}

// Fungsi untuk menghapus semua absensi
async function deleteAllAttendance(options = {}) {
    if (!firebaseDatabase) {
        throw new Error("Database tidak tersedia");
    }
    
    const { kelas, studentId, date, confirmation = true } = options;
    
    if (confirmation) {
        const confirmMessage = studentId 
            ? `Apakah Anda yakin ingin menghapus semua absensi untuk siswa ${studentId}?`
            : kelas 
                ? `Apakah Anda yakin ingin menghapus semua absensi untuk kelas ${kelas}?`
                : "Apakah Anda yakin ingin menghapus SEMUA ABSENSI di seluruh sekolah?";
        
        if (!confirm(confirmMessage)) {
            return { success: false, message: "Dibatalkan oleh pengguna" };
        }
    }
    
    try {
        showNotification("Menghapus absensi...", "info");
        
        let path = 'attendance';
        if (kelas) {
            path = `attendance/${kelas}`;
            if (studentId) {
                path = `attendance/${kelas}/${studentId}`;
                if (date) {
                    path = `attendance/${kelas}/${studentId}/${date}`;
                }
            }
        }
        
        await firebaseDatabase.ref(path).remove();
        
        const successMessage = studentId 
            ? `Semua absensi untuk siswa ${studentId} berhasil dihapus`
            : kelas 
                ? `Semua absensi untuk kelas ${kelas} berhasil dihapus`
                : "Semua absensi berhasil dihapus";
        
        showNotification(successMessage, "success");
        return { success: true, message: successMessage };
        
    } catch (error) {
        console.error("Error menghapus absensi:", error);
        showNotification("Gagal menghapus absensi: " + error.message, "error");
        return { success: false, message: error.message };
    }
}

// Fungsi untuk mendapatkan daftar siswa
async function getStudents(kelas = null) {
    if (!firebaseDatabase) {
        throw new Error("Database tidak tersedia");
    }
    
    try {
        let path = 'students';
        if (kelas) {
            path = `students/${kelas}`;
        }
        
        const snapshot = await firebaseDatabase.ref(path).once('value');
        
        if (!snapshot.exists()) {
            return [];
        }
        
        const students = [];
        if (kelas) {
            // Format untuk satu kelas
            snapshot.forEach((childSnapshot) => {
                const student = childSnapshot.val();
                student.id = childSnapshot.key;
                students.push(student);
            });
        } else {
            // Format untuk semua kelas
            snapshot.forEach((classSnapshot) => {
                classSnapshot.forEach((childSnapshot) => {
                    const student = childSnapshot.val();
                    student.id = childSnapshot.key;
                    students.push(student);
                });
            });
        }
        
        return students;
        
    } catch (error) {
        console.error("Error mendapatkan siswa:", error);
        throw error;
    }
}

// Fungsi untuk mengedit data siswa
async function updateStudent(studentId, kelas, updates) {
    if (!firebaseDatabase) {
        throw new Error("Database tidak tersedia");
    }
    
    if (!studentId || !kelas) {
        throw new Error("ID siswa dan kelas diperlukan");
    }
    
    try {
        // Validasi jenis kelamin
        if (updates.jenis_kelamin && !['L', 'P'].includes(updates.jenis_kelamin)) {
            throw new Error("Jenis kelamin harus 'L' atau 'P'");
        }
        
        const studentRef = firebaseDatabase.ref(`students/${kelas}/${studentId}`);
        
        // Cek apakah siswa ada
        const snapshot = await studentRef.once('value');
        if (!snapshot.exists()) {
            throw new Error(`Siswa dengan ID ${studentId} tidak ditemukan di kelas ${kelas}`);
        }
        
        // Update data
        await studentRef.update(updates);
        
        showNotification(`Data siswa berhasil diperbarui`, "success");
        return { success: true, message: "Data siswa berhasil diperbarui" };
        
    } catch (error) {
        console.error("Error mengupdate siswa:", error);
        showNotification("Gagal mengupdate siswa: " + error.message, "error");
        return { success: false, message: error.message };
    }
}

// Fungsi untuk menghapus siswa
async function deleteStudent(studentId, kelas) {
    if (!firebaseDatabase) {
        throw new Error("Database tidak tersedia");
    }
    
    if (!confirm(`Apakah Anda yakin ingin menghapus siswa ${studentId} dari kelas ${kelas}?`)) {
        return { success: false, message: "Dibatalkan oleh pengguna" };
    }
    
    try {
        const studentRef = firebaseDatabase.ref(`students/${kelas}/${studentId}`);
        
        // Hapus juga data nilai dan absensi terkait
        const scoreRef = firebaseDatabase.ref(`scores/${kelas}/${studentId}`);
        const attendanceRef = firebaseDatabase.ref(`attendance/${kelas}/${studentId}`);
        
        await Promise.all([
            studentRef.remove(),
            scoreRef.remove(),
            attendanceRef.remove()
        ]);
        
        showNotification(`Siswa ${studentId} berhasil dihapus`, "success");
        return { success: true, message: "Siswa berhasil dihapus" };
        
    } catch (error) {
        console.error("Error menghapus siswa:", error);
        showNotification("Gagal menghapus siswa: " + error.message, "error");
        return { success: false, message: error.message };
    }
}

// ============================================
// FUNGSI AUTHENTIKASI - DIPERBAIKI
// ============================================
function checkAuth(requiredRole = null) {
    return new Promise((resolve, reject) => {
        // DIPERBAIKI: Cek apakah Firebase Auth sudah diinisialisasi
        if (!firebaseAuth) {
            console.warn("⚠️ Firebase Auth belum diinisialisasi, mencoba inisialisasi...");
            const initialized = initializeFirebase();
            if (!initialized) {
                reject(new Error("Firebase Auth belum diinisialisasi"));
                return;
            }
        }
        
        const unsubscribe = firebaseAuth.onAuthStateChanged(
            (user) => {
                unsubscribe();
                
                if (!user) {
                    console.log("⚠️ Pengguna belum login, mengarahkan ke halaman login...");
                    window.location.href = 'index.html?v=' + Date.now();
                    reject(new Error("Pengguna belum terautentikasi"));
                    return;
                }
                
                console.log("✅ Pengguna terautentikasi:", user.email);
                
                const userInfo = teacherClassMapping[user.email];
                if (!userInfo) {
                    console.error("❌ Email tidak ditemukan dalam mapping:", user.email);
                    showNotification("Akun Anda tidak terdaftar dalam sistem", "error");
                    
                    setTimeout(() => {
                        logout();
                    }, 2000);
                    
                    reject(new Error("Akun tidak terdaftar"));
                    return;
                }
                
                // Simpan informasi pengguna ke localStorage
                localStorage.setItem('userEmail', user.email);
                localStorage.setItem('userRole', userInfo.role);
                localStorage.setItem('userName', userInfo.name);
                localStorage.setItem('userClasses', JSON.stringify(userInfo.classes));
                
                // Cek peran yang dibutuhkan
                if (requiredRole && userInfo.role !== requiredRole) {
                    console.log(`⚠️ Peran tidak sesuai. Peran pengguna: ${userInfo.role}, Diperlukan: ${requiredRole}`);
                    
                    // Redirect berdasarkan peran
                    if (userInfo.role === 'admin') {
                        window.location.href = 'admin.html?v=' + Date.now();
                    } else {
                        window.location.href = 'dashboard.html?v=' + Date.now();
                    }
                    
                    reject(new Error("Izin tidak cukup"));
                    return;
                }
                
                resolve(userInfo);
            },
            (error) => {
                console.error("❌ Error status autentikasi:", error);
                showNotification("Error autentikasi: " + error.message, "error");
                reject(error);
            }
        );
    });
}

function logout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        if (firebaseAuth) {
            firebaseAuth.signOut()
                .then(() => {
                    clearUserData();
                    window.location.href = 'index.html?v=' + Date.now();
                })
                .catch(error => {
                    console.error("❌ Error logout:", error);
                    showNotification("Gagal logout", "error");
                });
        } else {
            clearUserData();
            window.location.href = 'index.html?v=' + Date.now();
        }
    }
}

function clearUserData() {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userClasses');
    sessionStorage.clear();
    console.log("🧹 Data pengguna telah dibersihkan");
}

// ============================================
// FUNGSI NOTIFIKASI
// ============================================
function showNotification(message, type = 'info') {
    // Hapus notifikasi sebelumnya
    const existing = document.querySelector('.firebase-notification');
    if (existing) existing.remove();
    
    // Buat notifikasi baru
    const notification = document.createElement('div');
    notification.className = `firebase-notification ${type}`;
    
    // Tentukan ikon berdasarkan tipe
    let icon = 'fa-info-circle';
    let bgColor = '#3498db';
    
    switch(type) {
        case 'success':
            icon = 'fa-check-circle';
            bgColor = '#27ae60';
            break;
        case 'error':
            icon = 'fa-exclamation-circle';
            bgColor = '#e74c3c';
            break;
        case 'warning':
            icon = 'fa-exclamation-triangle';
            bgColor = '#f39c12';
            break;
    }
    
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 10px;
        background: ${bgColor};
        color: white;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideIn 0.3s ease;
        max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    // Hapus otomatis setelah 3 detik
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

function showGlobalError(message) {
    console.error("🌍 ERROR GLOBAL:", message);
    
    // Buat atau update error container
    let errorContainer = document.getElementById('global-error');
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.id = 'global-error';
        errorContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #e74c3c;
            color: white;
            padding: 12px 20px;
            text-align: center;
            z-index: 10001;
            font-family: Arial, sans-serif;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(errorContainer);
    }
    
    errorContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
            </div>
            <button onclick="this.parentElement.parentElement.style.display='none'" 
                    style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 12px;">
                Tutup
            </button>
        </div>
    `;
}

// ============================================
// FUNGSI UTILITAS
// ============================================
function getCurrentUser() {
    return firebaseAuth ? firebaseAuth.currentUser : null;
}

function getCurrentUserInfo() {
    const user = getCurrentUser();
    if (!user) return null;
    
    return teacherClassMapping[user.email] || {
        email: user.email,
        role: 'unknown',
        classes: [],
        name: user.email.split('@')[0]
    };
}

function isAdminUser() {
    const userInfo = getCurrentUserInfo();
    return userInfo && userInfo.role === 'admin';
}

function getUserClasses() {
    const userInfo = getCurrentUserInfo();
    return userInfo ? userInfo.classes : [];
}

// ============================================
// INISIALISASI DATA CONTOH
// ============================================
function initializeSampleData() {
    if (!firebaseDatabase) {
        console.error("Database belum tersedia");
        return;
    }
    
    firebaseDatabase.ref('students').once('value')
        .then(snapshot => {
            if (!snapshot.exists()) {
                console.log("📝 Membuat data contoh siswa...");
                createSampleStudents();
            } else {
                console.log("✅ Data siswa sudah ada");
            }
        })
        .catch(error => {
            console.error("Error memeriksa data:", error);
        });
}

function createSampleStudents() {
    const classes = ['1A', '1B', '1C', '1D', '2A', '2B', '2C', '2D', '2E', 
                    '3A', '3B', '3C', '3D', '3E', '4A', '4B', '4C', '4D', '4E', '4F',
                    '5A', '5B', '5C', '5D', '5E', '6A', '6B', '6C', '6D', '6E'];
    
    const sampleNames = [
        'Ahmad Fauzi', 'Budi Santoso', 'Citra Dewi', 'Dian Pratiwi', 'Eko Prasetyo',
        'Fitriani Sari', 'Gunawan Wijaya', 'Hesti Utami', 'Indra Setiawan', 'Joko Susilo'
    ];
    
    const promises = [];
    
    classes.forEach(className => {
        const classRef = firebaseDatabase.ref(`students/${className}`);
        
        // Buat 5-8 siswa per kelas
        for (let i = 1; i <= Math.floor(Math.random() * 4) + 5; i++) {
            const studentRef = classRef.push();
            const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
            
            const studentData = {
                nama: `${randomName} ${i}`,
                kelas: className,
                jenis_kelamin: i % 2 === 0 ? 'L' : 'P',
                tanggal_lahir: new Date(2010 + parseInt(className[0]), 
                                       Math.floor(Math.random() * 12), 
                                       Math.floor(Math.random() * 28) + 1).toISOString(),
                nama_ortu: `Orang Tua ${randomName}`,
                tanggal_daftar: new Date().toISOString(),
                status: 'aktif'
            };
            
            promises.push(studentRef.set(studentData));
        }
    });
    
    Promise.all(promises)
        .then(() => {
            console.log("✅ Data contoh siswa berhasil dibuat");
            showNotification("Data contoh berhasil dibuat", "success");
        })
        .catch(error => {
            console.error("❌ Gagal membuat data contoh:", error);
        });
}

// ============================================
// LOAD FIREBASE SDK - DIPERBAIKI
// ============================================
function loadFirebaseSDK() {
    console.log("📥 Memuat Firebase SDK...");
    
    // Cek apakah sudah dimuat
    if (typeof firebase !== 'undefined') {
        console.log("✅ Firebase SDK sudah dimuat");
        return true;
    }
    
    const scripts = [
        'https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js',
        'https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js',
        'https://www.gstatic.com/firebasejs/8.10.0/firebase-database.js'
    ];
    
    let loaded = 0;
    let hasError = false;
    
    // Fungsi untuk cek apakah semua script sudah dimuat
    function checkAllLoaded() {
        if (hasError) return false;
        if (loaded === scripts.length) {
            console.log("✅ Semua Firebase SDK berhasil dimuat");
            return true;
        }
        return false;
    }
    
    scripts.forEach(src => {
        // Cek apakah script sudah ada
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
            console.log(`⚠️ Script sudah ada: ${src}`);
            loaded++;
            if (checkAllLoaded()) {
                initializeFirebase();
            }
            return;
        }
        
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        
        script.onload = () => {
            loaded++;
            console.log(`✅ Berhasil memuat: ${src}`);
            
            if (checkAllLoaded()) {
                // Beri waktu untuk SDK diinisialisasi
                setTimeout(() => {
                    initializeFirebase();
                }, 500);
            }
        };
        
        script.onerror = () => {
            console.error(`❌ Gagal memuat: ${src}`);
            hasError = true;
            showGlobalError(`Gagal memuat Firebase SDK: ${src}`);
        };
        
        document.head.appendChild(script);
    });
    
    return !hasError;
}

// ============================================
// EKSPOR KE GLOBAL SCOPE - DIPERBAIKI
// ============================================
window.firebaseApp = {
    // Konfigurasi
    config: firebaseConfig,
    teacherMapping: teacherClassMapping,
    
    // Layanan Firebase
    getAuth: () => firebaseAuth,
    getDatabase: () => firebaseDatabase,
    
    // Status
    isInitialized: () => isFirebaseInitialized,
    
    // Fungsi Autentikasi
    checkAuth: checkAuth,
    logout: logout,
    getCurrentUser: getCurrentUser,
    getCurrentUserInfo: getCurrentUserInfo,
    isAdmin: isAdminUser,
    getUserClasses: getUserClasses,
    
    // FUNGSI ADMIN BARU - DITAMBAHKAN
    deleteAllScores: deleteAllScores,
    deleteAllAttendance: deleteAllAttendance,
    getStudents: getStudents,
    updateStudent: updateStudent,
    deleteStudent: deleteStudent,
    
    // Fungsi Notifikasi
    showNotification: showNotification,
    showError: showGlobalError,
    
    // Fungsi Data
    initSampleData: initializeSampleData,
    
    // Inisialisasi
    initialize: initializeFirebase,
    
    // Load SDK
    loadSDK: loadFirebaseSDK
};

// ============================================
// INISIALISASI OTOMATIS - DIPERBAIKI
// ============================================
(function() {
    console.log("🔥 Firebase App sedang dimuat...");
    
    // Tambahkan style untuk animasi
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateX(100%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        @keyframes slideOut {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(100%);
            }
        }
    `;
    document.head.appendChild(style);
    
    // Fungsi init dengan retry mechanism
    function initFirebaseApp() {
        console.log("📄 Menginisialisasi Firebase App...");
        
        // Cek apakah Firebase SDK sudah dimuat
        if (typeof firebase === 'undefined') {
            console.log("⚠️ Firebase SDK belum dimuat, menunggu...");
            
            // Coba lagi setelah 1 detik
            setTimeout(() => {
                if (typeof firebase === 'undefined') {
                    console.log("🔄 Mencoba memuat Firebase SDK otomatis...");
                    loadFirebaseSDK();
                } else {
                    console.log("✅ Firebase SDK sudah dimuat, lanjut inisialisasi...");
                    initializeFirebase();
                }
            }, 1000);
            return;
        }
        
        // Jika SDK sudah dimuat, langsung inisialisasi
        console.log("✅ Firebase SDK terdeteksi, menginisialisasi...");
        const success = initializeFirebase();
        
        if (success) {
            console.log("✅ Firebase App berhasil diinisialisasi");
            
            // Inisialisasi data contoh setelah beberapa detik
            setTimeout(() => {
                if (getCurrentUser()) {
                    initializeSampleData();
                }
            }, 3000);
        } else {
            console.warn("⚠️ Gagal menginisialisasi Firebase, akan coba lagi...");
            
            // Coba lagi setelah 3 detik
            setTimeout(() => {
                console.log("🔄 Mencoba inisialisasi ulang...");
                initFirebaseApp();
            }, 3000);
        }
    }
    
    // Tunggu DOM siap
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log("📄 DOM siap, memulai inisialisasi Firebase...");
            // Beri waktu untuk script lain dimuat
            setTimeout(initFirebaseApp, 500);
        });
    } else {
        console.log("📄 DOM sudah siap, memulai inisialisasi Firebase...");
        // Beri waktu untuk script lain dimuat
        setTimeout(initFirebaseApp, 500);
    }
})();

console.log("✅ Firebase App module telah dimuat");