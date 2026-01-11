// ============================================
// KONFIGURASI FIREBASE YANG BENAR DAN SERAGAM
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
// INISIALISASI FIREBASE - DIPERBAIKI
// ============================================
let firebaseAppInstance = null;
let firebaseAuth = null;
let firebaseDatabase = null;
let isFirebaseInitialized = false;
let isInitializing = false;
let databaseListeners = {};
let realtimeData = {
    students: {},
    attendance: {},
    scores: {}
};

// Flag untuk mencegah multiple redirects
let isRedirecting = false;
let authChecked = false;

function initializeFirebase() {
    console.log("🚀 Memulai inisialisasi Firebase...");
    
    // Cek jika sudah dalam proses inisialisasi
    if (isInitializing) {
        console.log("⏳ Firebase sedang dalam proses inisialisasi, tunggu...");
        return false;
    }
    
    // Cek jika sudah diinisialisasi
    if (isFirebaseInitialized && firebaseAppInstance) {
        console.log("✅ Firebase sudah diinisialisasi sebelumnya");
        return true;
    }
    
    isInitializing = true;
    
    try {
        // Cek Firebase SDK
        if (typeof firebase === 'undefined') {
            console.error("❌ Firebase SDK tidak ditemukan");
            showGlobalError("Firebase SDK tidak ditemukan. Periksa koneksi internet.");
            isInitializing = false;
            return false;
        }
        
        // Inisialisasi Firebase App
        if (!firebase.apps.length) {
            console.log("📝 Menginisialisasi aplikasi Firebase baru...");
            firebaseAppInstance = firebase.initializeApp(firebaseConfig);
        } else {
            console.log("🔧 Menggunakan Firebase App yang sudah ada");
            firebaseAppInstance = firebase.app();
        }
        
        // Inisialisasi layanan Firebase
        firebaseAuth = firebase.auth();
        firebaseDatabase = firebase.database();
        
        console.log("✅ Firebase Auth & Database berhasil diinisialisasi");
        isFirebaseInitialized = true;
        isInitializing = false;
        
        // Setup auth state change listener (hanya sekali)
        setupAuthStateListener();
        
        // Test koneksi
        testFirebaseConnection();
        
        return true;
        
    } catch (error) {
        console.error("❌ Gagal menginisialisasi Firebase:", error);
        isInitializing = false;
        showGlobalError("Gagal menginisialisasi Firebase: " + error.message);
        return false;
    }
}

// ============================================
// AUTH STATE LISTENER - DIPERBAIKI (NON-REDIRECTING)
// ============================================
function setupAuthStateListener() {
    if (!firebaseAuth) return;
    
    console.log("👤 Setting up auth state listener...");
    
    // Hanya setup listener sekali
    if (window.firebaseAuthListenerSet) {
        console.log("⚠️ Auth listener sudah disetup sebelumnya");
        return;
    }
    
    window.firebaseAuthListenerSet = true;
    
    firebaseAuth.onAuthStateChanged((user) => {
        console.log("👤 Auth state changed:", user ? user.email : "No user");
        
        if (user) {
            const userInfo = teacherClassMapping[user.email];
            if (userInfo) {
                console.log(`✅ User authenticated: ${user.email} (${userInfo.role})`);
                
                // Simpan ke localStorage dengan timestamp
                localStorage.setItem('userEmail', user.email);
                localStorage.setItem('userRole', userInfo.role);
                localStorage.setItem('userName', userInfo.name || user.email.split('@')[0]);
                localStorage.setItem('loginTime', Date.now().toString());
                
                if (userInfo.role === 'guru_kelas' || userInfo.role === 'guru_pjok') {
                    localStorage.setItem('teacherClasses', JSON.stringify(userInfo.classes));
                }
                
                // Setup realtime listeners jika di halaman yang membutuhkan
                if (!window.location.pathname.includes('index.html')) {
                    setTimeout(() => {
                        setupRealtimeListeners();
                    }, 1000);
                }
            } else {
                console.error("❌ User tidak terdaftar dalam mapping:", user.email);
                showNotification("Akun Anda tidak terdaftar dalam sistem", "error");
                
                // Sign out dan clear data
                setTimeout(() => {
                    if (firebaseAuth) {
                        firebaseAuth.signOut().then(() => {
                            clearUserData();
                        });
                    }
                }, 2000);
            }
        } else {
            console.log("ℹ️ User logged out or not authenticated");
            
            // Hapus realtime listeners saat logout
            removeAllListeners();
            
            // HANYA clear localStorage jika benar-benar logout
            // JANGAN auto-redirect di sini, biarkan validator yang handle
        }
    }, (error) => {
        console.error("❌ Auth state listener error:", error);
        // Jangan redirect di sini
    });
}

// ============================================
// FUNGSI CHECK AUTH - DIPERBAIKI (NON-REDIRECTING)
// ============================================
function checkAuth(requiredRole = null) {
    return new Promise((resolve, reject) => {
        if (authChecked) {
            console.log("✅ Auth sudah diperiksa sebelumnya");
            // Return cached result
            const user = firebaseAuth ? firebaseAuth.currentUser : null;
            if (user) {
                const userInfo = teacherClassMapping[user.email];
                if (userInfo && (!requiredRole || userInfo.role === requiredRole)) {
                    resolve(userInfo);
                } else {
                    reject(new Error("Izin tidak cukup"));
                }
            } else {
                reject(new Error("Pengguna belum terautentikasi"));
            }
            return;
        }
        
        if (!firebaseAuth) {
            console.warn("⚠️ Firebase Auth belum diinisialisasi");
            // Initialize Firebase
            const initialized = initializeFirebase();
            if (!initialized) {
                reject(new Error("Firebase Auth belum diinisialisasi"));
                return;
            }
        }
        
        const unsubscribe = firebaseAuth.onAuthStateChanged(
            (user) => {
                unsubscribe();
                authChecked = true;
                
                if (!user) {
                    console.log("⚠️ Pengguna belum login di Firebase");
                    // JANGAN redirect di sini, hanya reject
                    reject(new Error("Pengguna belum terautentikasi di Firebase"));
                    return;
                }
                
                console.log("✅ Pengguna terautentikasi di Firebase:", user.email);
                
                const userInfo = teacherClassMapping[user.email];
                if (!userInfo) {
                    console.error("❌ Email tidak ditemukan dalam mapping:", user.email);
                    // JANGAN redirect di sini
                    reject(new Error("Akun tidak terdaftar"));
                    return;
                }
                
                // Cek peran yang dibutuhkan
                if (requiredRole && userInfo.role !== requiredRole) {
                    console.log(`⚠️ Peran tidak sesuai. Peran pengguna: ${userInfo.role}, Diperlukan: ${requiredRole}`);
                    reject(new Error("Izin tidak cukup"));
                    return;
                }
                
                resolve(userInfo);
            },
            (error) => {
                console.error("❌ Error status autentikasi:", error);
                reject(error);
            }
        );
    });
}

// ============================================
// REALTIME LISTENERS
// ============================================
function setupRealtimeListeners() {
    if (!firebaseDatabase) {
        console.warn("⚠️ Database belum tersedia untuk setup listeners");
        return;
    }
    
    // Cek jika sudah ada listener aktif
    if (Object.keys(databaseListeners).length > 0) {
        console.log("⚠️ Listeners sudah aktif");
        return;
    }
    
    console.log("📡 Menyiapkan realtime listeners...");
    
    // Listen untuk data siswa
    databaseListeners.students = firebaseDatabase.ref('students').on('value', 
        (snapshot) => {
            console.log("📊 Data siswa diperbarui realtime");
            realtimeData.students = snapshot.val() || {};
            
            window.dispatchEvent(new CustomEvent('studentsUpdated', {
                detail: { data: realtimeData.students }
            }));
        },
        (error) => {
            console.error("❌ Error listener siswa:", error);
        }
    );
    
    // Listen untuk data absensi
    databaseListeners.attendance = firebaseDatabase.ref('attendance').on('value',
        (snapshot) => {
            console.log("📊 Data absensi diperbarui realtime");
            realtimeData.attendance = snapshot.val() || {};
            
            window.dispatchEvent(new CustomEvent('attendanceUpdated', {
                detail: { data: realtimeData.attendance }
            }));
        },
        (error) => {
            console.error("❌ Error listener absensi:", error);
        }
    );
    
    // Listen untuk data nilai
    databaseListeners.scores = firebaseDatabase.ref('penilaian').on('value',
        (snapshot) => {
            console.log("📊 Data nilai diperbarui realtime");
            realtimeData.scores = snapshot.val() || {};
            
            window.dispatchEvent(new CustomEvent('scoresUpdated', {
                detail: { data: realtimeData.scores }
            }));
        },
        (error) => {
            console.error("❌ Error listener nilai:", error);
        }
    );
    
    console.log("✅ Realtime listeners berhasil disetup");
}

function removeAllListeners() {
    if (!firebaseDatabase) return;
    
    Object.keys(databaseListeners).forEach(key => {
        if (databaseListeners[key]) {
            try {
                firebaseDatabase.ref(key).off('value', databaseListeners[key]);
            } catch (error) {
                console.warn(`⚠️ Error removing listener for ${key}:`, error);
            }
        }
    });
    databaseListeners = {};
    console.log("🧹 Semua listeners dibersihkan");
}

// ============================================
// TEST KONEKSI FIREBASE
// ============================================
function testFirebaseConnection() {
    if (!firebaseDatabase) {
        console.warn("⚠️ Database belum tersedia untuk test koneksi");
        return;
    }
    
    try {
        const connectedRef = firebaseDatabase.ref('.info/connected');
        
        databaseListeners.connection = connectedRef.on('value', (snapshot) => {
            const isConnected = snapshot.val() === true;
            console.log(`📡 Status Koneksi Firebase: ${isConnected ? 'TERHUBUNG ✅' : 'TERPUTUS ❌'}`);
            
            window.firebaseConnectionStatus = isConnected;
            
            window.dispatchEvent(new CustomEvent('firebaseConnectionChange', {
                detail: { connected: isConnected }
            }));
            
            if (!isConnected) {
                showNotification("Koneksi ke database terputus. Periksa internet Anda.", "warning");
            }
        });
        
    } catch (error) {
        console.error("❌ Error test koneksi:", error);
    }
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
    
    // GURU KELAS
    'gurukelas@rbt.com': {
        role: 'guru_kelas',
        classes: ['1A', '1B'],
        name: 'Guru Kelas'
    },
    
    // GURU PJOK
    'gurupjok@rbt.com': {
        role: 'guru_pjok',
        classes: ['1A', '1B', '1C'],
        name: 'Guru PJOK'
    }
};

// ============================================
// FUNGSI LOGOUT - DIPERBAIKI
// ============================================
function logout() {
    if (confirm('Apakah Anda yakin ingin logout?')) {
        // Set flag redirecting
        isRedirecting = true;
        
        // Remove all listeners
        removeAllListeners();
        
        // Clear localStorage
        clearUserData();
        
        // Sign out from Firebase
        if (firebaseAuth) {
            firebaseAuth.signOut()
                .then(() => {
                    console.log("✅ Logout berhasil dari Firebase");
                    window.location.href = 'index.html';
                })
                .catch(error => {
                    console.error("❌ Error logout dari Firebase:", error);
                    // Tetap redirect ke index
                    window.location.href = 'index.html';
                });
        } else {
            window.location.href = 'index.html';
        }
    }
}

// ============================================
// FUNGSI NOTIFIKASI
// ============================================
function showNotification(message, type = 'info', duration = 3000) {
    // Remove existing notifications
    document.querySelectorAll('.firebase-notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `firebase-notification ${type}`;
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
    } else if (type === 'warning') {
        notification.style.background = '#d69e2e';
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
    }, duration);
}

function showGlobalError(message) {
    console.error("🌍 Global Error:", message);
    showNotification(message, 'error', 5000);
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
    isConnected: () => window.firebaseConnectionStatus || false,
    
    // Fungsi Autentikasi (NON-REDIRECTING)
    checkAuth: checkAuth,
    logout: logout,
    getCurrentUser: () => firebaseAuth ? firebaseAuth.currentUser : null,
    getCurrentUserInfo: () => {
        const user = firebaseAuth ? firebaseAuth.currentUser : null;
        if (!user) return null;
        return teacherClassMapping[user.email] || {
            email: user.email,
            role: 'unknown',
            classes: [],
            name: user.email.split('@')[0]
        };
    },
    
    // FUNGSI REALTIME
    setupRealtimeListeners: setupRealtimeListeners,
    removeAllListeners: removeAllListeners,
    
    // Data cache
    getCachedStudents: () => realtimeData.students,
    getCachedAttendance: () => realtimeData.attendance,
    getCachedScores: () => realtimeData.scores,
    
    // Fungsi Admin
    getStudents: async function(kelas = null, realtime = false) {
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
                snapshot.forEach((childSnapshot) => {
                    const student = childSnapshot.val();
                    student.id = childSnapshot.key;
                    students.push(student);
                });
            } else {
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
    },
    
    // Fungsi Notifikasi
    showNotification: showNotification,
    
    // Inisialisasi
    initialize: initializeFirebase,
    
    // Flag untuk mencegah redirect loops
    isRedirecting: () => isRedirecting
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
        
        .firebase-notification {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
    `;
    document.head.appendChild(style);
    
    // Tunggu DOM siap
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log("📄 DOM siap, memulai inisialisasi Firebase...");
            // Delay untuk menghindari race condition dengan auth-validator
            setTimeout(() => {
                initializeFirebase();
            }, 500);
        });
    } else {
        console.log("📄 DOM sudah siap, memulai inisialisasi Firebase...");
        setTimeout(() => {
            initializeFirebase();
        }, 500);
    }
})();

console.log("✅ Firebase App module telah dimuat");

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

window.clearUserData = clearUserData;