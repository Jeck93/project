# 📋 PWA App - Dokumentasi Lengkap
## Laporan PPKBD Kec. Ulujami (Progressive Web App)

Aplikasi PWA untuk input dan manajemen data laporan bulanan KB Kec. Ulujami. Sekarang bisa **diinstall seperti aplikasi Android**!

---

## 📱 INSTALASI & SETUP PWA

### ✨ Fitur PWA (Progressive Web App)
✅ **Install seperti aplikasi Android** - Tidak lagi hanya "Add to Home screen"  
✅ **Fullscreen tanpa browser bar** - Tampil seperti aplikasi native  
✅ **Offline mode** - Bisa digunakan tanpa internet  
✅ **Auto update** - Update otomatis saat ada versi baru  
✅ **Fast loading** - Cache untuk performa lebih cepat  
✅ **Install prompt** - Tombol install otomatis muncul  

### 📲 Cara Install di HP
1. Buka aplikasi di browser Chrome
2. Tunggu tombol "📱 Install App" muncul di pojok kanan bawah
3. Tap tombol install
4. Konfirmasi instalasi
5. Icon muncul di home screen - buka seperti aplikasi biasa!

**Atau:** Tap menu browser (3 titik) > "Add to Home screen" atau "Install app"

### 🚀 Quick Start
```bash
# Testing Lokal
python -m http.server 8000

# Buka di browser
http://localhost:8000/login.html

# Akses dari HP (pastikan satu WiFi)
http://192.168.x.x:8000/pwa-app/
```

**Login Demo:** Username: `admin`, Password: `admin`

---

## 🔐 Autentikasi (Login)

Login pada aplikasi demo ini menggunakan kredensial sederhana yang dapat dikonfigurasi secara lokal.

- **Lokasi konfigurasi:** `js/config.js`
- **Objek:** `CONFIG.AUTH`
- **Properti:** `USERNAME` dan `PASSWORD`

Contoh (`js/config.js`):

```javascript
AUTH: {
   USERNAME: 'admin',
   PASSWORD: 'admin123'
}
```

Perubahan pada `CONFIG.AUTH` akan dipakai secara langsung pada halaman login setelah pengguna melakukan logout atau bila token sesi (localStorage `pwa_auth_token`) dianggap kadaluarsa.

Jika Anda mengubah `AUTH.PASSWORD` (mis. dari `admin` ke `admin123`), pengguna yang sudah login sebelumnya tetap memiliki sesi aktif sampai salah satu tindakan berikut dilakukan:

- Klik tombol **Logout** di aplikasi, atau
- Hapus token di console browser:

```javascript
localStorage.removeItem('pwa_auth_token');
localStorage.removeItem('pwa_username');
location.reload();
```

Catatan keamanan: Kredensial tersimpan dalam file JavaScript plain-text hanya untuk demo. Untuk penggunaan produksi, gunakan autentikasi server-side, penyimpanan password ter-hash, atau layanan pihak ketiga seperti Firebase Auth.

---

## 🔧 TROUBLESHOOTING KONEKSI

### ❌ Masalah: Data Tidak Tampil di Index.html

#### 🔍 Langkah Diagnostik Cepat:
1. **Gunakan Tool Debug**
   - Buka `test-connection.html` untuk test koneksi
   - Buka `debug-console.html` untuk monitoring real-time
   - Klik tombol "Test Koneksi" di index.html

2. **Periksa Browser Console (F12)**
   - Buka tab Console
   - Refresh halaman index.html
   - Cari error berwarna merah

3. **Periksa Network Tab**
   - Lihat request ke Google Apps Script
   - Status 200 = OK, 404 = Not Found, 500 = Server Error

#### 🚨 Kemungkinan Masalah & Solusi:

**1. Google Apps Script Tidak Dapat Diakses**
- 🔍 Gejala: Error "Failed to fetch", Timeout, Status "❌ Koneksi gagal"
- ✅ Solusi:
  1. Buka Google Apps Script Editor
  2. Pastikan script sudah di-**Deploy** sebagai Web App
  3. Setting deployment: Execute as: **Me**, Who has access: **Anyone**
  4. Copy URL baru dan update di `js/config.js`

**2. CORS Error**
- 🔍 Gejala: Error "CORS policy" di console, Request blocked
- ✅ Solusi: Sudah dihandle dengan JSONP, test dengan `test-connection.html`

**3. Data Format Error**
- 🔍 Gejala: Koneksi berhasil tapi data tidak tampil
- ✅ Solusi: Periksa struktur data di Google Sheets, gunakan `debug-console.html`

#### 📋 Checklist Troubleshooting:
- [ ] Google Apps Script sudah di-deploy dengan benar
- [ ] URL di `js/config.js` sudah benar dan terbaru
- [ ] Spreadsheet dapat diakses oleh script
- [ ] Browser memiliki koneksi internet
- [ ] Test connection berhasil

---

## 🌙 DARK MODE

### 🔘 Tombol Toggle Theme
- **Lokasi**: Di header setiap halaman
- **Tampilan**: 🌙 Gelap (mode terang) / ☀️ Terang (mode gelap)

### 🎨 Perbedaan Visual
**Light Mode:** Background gradient biru-ungu, cards putih, text hitam  
**Dark Mode:** Background gradient hitam-abu, cards gelap, text putih  

### 🔧 Cara Kerja
1. **Manual Setting** (jika user klik toggle)
2. **System Preference** (preferensi sistem)
3. **Default Light Mode** (fallback)

### 📱 Responsivitas
- **Desktop**: Ikon + teks dengan hover effects
- **Tablet**: Ikon + teks, touch-friendly
- **Mobile**: Hanya ikon, optimal untuk sentuhan

---

## 📋 FITUR APLIKASI

### ✅ Fitur Utama
- **Login/Logout** - Sistem autentikasi
- **Form input data** - Lengkap sesuai Google Form
- **Database lokal** - IndexedDB, data tersimpan di device
- **List & tabel data** - Dengan search, filter, dan pagination
- **Edit dan hapus data** - Tombol aksi hijau & merah
- **Export data** - Ke CSV format
- **Upload foto KTP** - Support gambar
- **Statistik summary** - Total, MKJP, Non-MKJP
- **Offline support** - Bisa digunakan tanpa internet
- **Install ke home screen** - PWA native-like
- **Responsive design** - Mobile & desktop
- **Dark mode** - Toggle tema gelap/terang

### 📊 Pagination & Data Display
- **Opsi tampilan**: All, 5, 10, 15, 20 data per halaman
- **Navigasi halaman**: Tombol prev/next dengan nomor halaman
- **Search terintegrasi**: Pencarian real-time dengan pagination
- **Responsive table**: Kolom menyesuaikan ukuran layar

---

## 🗂️ STRUKTUR FILE

### 📁 File Utama
```
pwa-app/
├── login.html              # Start URL - Halaman login
├── index.html              # Halaman utama dengan pagination
├── form.html               # Form input data
├── edit.html               # Edit data
├── manifest.json           # PWA manifest
├── service-worker.js       # Service worker
├── DOCUMENTATION.md        # Dokumentasi lengkap (file ini)
├── css/                    # Styling files
├── js/                     # JavaScript files
└── google-apps-script.js   # Backend script
```

### 🧪 File Testing & Debug
- `test-connection.html` - Test koneksi dasar
- `debug-console.html` - Debug dengan logging real-time
- `quick-connection-test.html` - Test koneksi cepat
- `verify-google-script.html` - Verifikasi Google Apps Script

### 🎨 File Styling & Assets
- `css/performance-optimized.css` - CSS utama yang dioptimasi
- `css/login-style.css` - Styling untuk halaman login
- `privacy-policy.html` - Halaman kebijakan privasi

---

## 🚀 DEPLOYMENT

### Opsi 1: GitHub Pages (Gratis)
```bash
git init
git add .
git commit -m "PWA App - PPKBD"
git push origin main
# Aktifkan GitHub Pages di Settings
```

### Opsi 2: Netlify/Vercel (Gratis)
- Drag & drop folder atau connect GitHub
- Deploy otomatis dengan HTTPS

---

## 🔧 TECHNICAL SPECS

### 💾 Data Storage
- **Local**: IndexedDB browser (tidak hilang saat uninstall)
- **Remote**: Google Sheets via Google Apps Script
- **Sync**: Otomatis saat online
- **Export**: CSV format

### 🌐 Browser Support
- ✅ Chrome (Android) - Full support
- ✅ Edge (Android) - Full support
- ⚠️ Firefox - Partial (no install prompt)
- ⚠️ Safari iOS - Partial (manual add to home screen)

### 🔧 Tech Stack
- HTML5, CSS3, Vanilla JavaScript
- PWA (Service Worker + Manifest)
- IndexedDB (local database)
- Google Apps Script (backend)

---

## ⚠️ TROUBLESHOOTING UMUM

### PWA Install Issues
1. Buka `test-connection.html` untuk cek status
2. Pastikan HTTPS atau localhost
3. Clear cache jika perlu
4. Uninstall dan install ulang

### Data Tidak Muncul
1. Klik tombol "🔄 Refresh" untuk force reload dari Google Sheets
2. Periksa console browser (F12) untuk error
3. Test koneksi dengan `test-connection.html`
4. Pastikan Google Apps Script sudah di-deploy dengan benar

### Dark Mode Issues
- **Theme tidak tersimpan**: Clear cache dan reload
- **Transisi tidak smooth**: Update browser, disable extensions
- **Tombol tidak muncul**: Check console errors, refresh halaman

---

## 🆘 BANTUAN DARURAT

### Jika Semua Gagal:
1. **Backup data lokal** (export dari aplikasi)
2. **Re-deploy Google Apps Script** dengan URL baru
3. **Update URL** di `js/config.js`
4. **Test ulang** dengan `test-connection.html`
5. **Import data kembali** jika diperlukan

### Kontak Support:
- Periksa console browser untuk error messages
- Screenshot error untuk troubleshooting
- Test dengan `debug-console.html` untuk informasi detail

---

**🎉 Selamat! PWA App sekarang sudah menjadi Progressive Web App yang lengkap dengan fitur modern seperti pagination, dark mode, dan offline support!**