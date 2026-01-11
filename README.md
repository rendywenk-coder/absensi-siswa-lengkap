# Sistem Absensi dan Penilaian Siswa SDN RAWABUNTU 03

## Fitur Utama:
1. **Absensi Harian**:
   - Absensi manual dengan klik otomatis
   - Absensi dengan barcode scanner
   - Status: Hadir, Ijin, Sakit, Alfa

2. **Penilaian Ulangan**:
   - Sumatif 1-4 untuk semester 1
   - Sumatif 1-4 dan SAS untuk semester 2
   - Semester 1 dan 2 terpisah

3. **Manajemen Kelas**:
   - 30 kelas (1A-D, 2A-E, 3A-E, 4A-F, 5A-E, 6A-E)
   - Pembagian guru sesuai mapping

4. **Sistem Admin**:
   - Akses ke semua kelas
   - Export rekapan absen (per bulan/tanggal)
   - Export penilaian setiap guru

5. **Sistem Guru**:
   - Hanya akses kelas yang ditugaskan
   - Absensi dan penilaian realtime
   - Export absensi (tidak bisa export nilai)

## Instalasi dan Konfigurasi:

1. **Setup Firebase**:
   - Buka Firebase Console (console.firebase.google.com)
   - Buat project baru atau gunakan project yang ada
   - Tambahkan web app dan dapatkan konfigurasi
   - Update `firebase-config.js` dengan konfigurasi Anda

2. **Setup Authentication**:
   - Di Firebase Console, buka Authentication
   - Tambahkan metode login Email/Password
   - Tambahkan user:
     - admin@rbt.com
     - pjoki@rbt.com (guru PJOK)
     - guru2@rbt.com
     - guru3@rbt.com

3. **Setup Realtime Database**:
   - Buat database di mode testing
   - Update rules untuk keamanan:
   ```json
   {
     "rules": {
       "students": {
         ".read": "auth != null",
         ".write": "auth != null"
       },
       "attendance": {
         ".read": "auth != null",
         ".write": "auth != null"
       },
       "scores": {
         ".read": "auth != null",
         ".write": "auth != null"
       }
     }
   }