# 🧹 Panduan Clear Cache Browser

## ⚠️ **PENTING: Aplikasi Masih Menampilkan Modal Netlify?**

Jika aplikasi masih menampilkan modal login Netlify seperti di screenshot, itu karena **browser cache**. Ikuti langkah berikut:

## 🔧 **Cara Clear Cache**

### **Method 1: Hard Refresh (Paling Mudah)**
1. **Tekan Ctrl + Shift + R** (Windows) atau **Cmd + Shift + R** (Mac)
2. **Atau Ctrl + F5** (Windows)
3. **Tunggu halaman reload completely**

### **Method 2: Clear Cache Manual**
1. **Buka Developer Tools:** F12 atau Ctrl + Shift + I
2. **Klik kanan pada tombol refresh** di browser
3. **Pilih "Empty Cache and Hard Reload"**

### **Method 3: Clear All Cache**
1. **Chrome:** Settings → Privacy and Security → Clear browsing data
2. **Firefox:** Settings → Privacy & Security → Clear Data
3. **Edge:** Settings → Privacy, search, and services → Clear browsing data
4. **Pilih "Cached images and files"**
5. **Klik "Clear data"**

### **Method 4: Incognito/Private Mode**
1. **Buka browser dalam mode incognito/private**
2. **Test aplikasi di mode ini**
3. **Tidak ada cache yang ter-load**

## 🎯 **Setelah Clear Cache, Yang Harus Terlihat:**

### **Halaman Login Baru:**
```
🔒 Login Aplikasi PPKBD

[Username input field]
[Password input field]
[🔒 Login button]

🔒 Akun Petugas Desa:
👑 Admin:
- admin / admin123
- ppkbd / ppkbd2024

🏘️ Petugas Desa:
- cholilah / laporan123 (Sukorejo)
- harwati / laporan123 (Botekan)
- friska / laporan123 (Rowosari)
- dst...
```

### **TIDAK ADA:**
- ❌ Modal Netlify Identity
- ❌ Tombol "Sign up" / "Log in" tabs
- ❌ Email input field
- ❌ "Coded by Netlify" footer

## 🧪 **Test Login:**

### **Test 1: Admin Login**
```
Username: admin
Password: admin123
```

### **Test 2: Petugas Desa**
```
Username: cholilah
Password: laporan123
```

### **Test 3: Staff PPKBD**
```
Username: ppkbd
Password: ppkbd2024
```

## 🚨 **Jika Masih Bermasalah:**

### **Check 1: URL Aplikasi**
Pastikan URL benar dan tidak ada parameter aneh:
```
✅ BENAR: https://your-app.netlify.app/login.html
❌ SALAH: https://your-app.netlify.app/login.html?netlify-identity=...
```

### **Check 2: Console Errors**
1. **Buka Developer Tools (F12)**
2. **Tab Console**
3. **Cari error merah**
4. **Screenshot dan kirim ke admin**

### **Check 3: Network Tab**
1. **Developer Tools → Network tab**
2. **Refresh halaman**
3. **Cari request ke "netlify-identity-widget.js"**
4. **Jika ada → masih ada script Netlify yang ter-load**

## 🔄 **Force Update Service Worker**

Jika masih bermasalah, force update service worker:

1. **Developer Tools → Application tab**
2. **Service Workers section**
3. **Klik "Update" atau "Unregister"**
4. **Refresh halaman**

## 📱 **Test di Device Lain**

Coba buka aplikasi di:
- **HP/tablet lain**
- **Komputer lain**
- **Browser lain**

Jika di device lain normal, berarti masalah cache di device utama.

## ✅ **Konfirmasi Berhasil**

Aplikasi berhasil di-clean jika:
- ✅ **Halaman login sederhana** tanpa modal
- ✅ **Bisa login dengan username/password**
- ✅ **Tidak ada error di console**
- ✅ **Redirect ke dashboard setelah login**

---

**Jika masih ada masalah setelah clear cache, screenshot error dan hubungi developer!** 🛠️