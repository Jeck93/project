# 👥 Setup User Desa di Netlify Identity

## 📋 Daftar User yang Perlu Dibuat di Netlify

### 🏛️ **Admin Users**
1. **admin** - Administrator Pusat
2. **ppkbd** - Staff PPKBD Kecamatan

### 🏘️ **Petugas PPKBD per Desa Kecamatan Ulujami**

| No | Username | Nama | Desa | Email |
|----|----------|------|------|-------|
| 1 | cholilah | Cholilah | Sukorejo | cholilah@sukorejo.ulujami.go.id |
| 2 | harwati | Harwati | Botekan | harwati@botekan.ulujami.go.id |
| 3 | friska | Friska | Rowosari | friska@rowosari.ulujami.go.id |
| 4 | sugiarti | Sugiarti | Ambowetan | sugiarti@ambowetan.ulujami.go.id |
| 5 | kiswati | Kiswati | Pagergunung | kiswati@pagergunung.ulujami.go.id |
| 6 | nuraini | Nuraini | Wiyorowetan | nuraini@wiyorowetan.ulujami.go.id |
| 7 | umirohwati | Umirohwati | Samong | umirohwati@samong.ulujami.go.id |
| 8 | masrurotun | Masrurotun | Tasikrejo | masrurotun@tasikrejo.ulujami.go.id |
| 9 | suwati | Suwati | Bumirejo | suwati@bumirejo.ulujami.go.id |
| 10 | turikhah | Turikhah | Kaliprau | turikhah@kaliprau.ulujami.go.id |
| 11 | fathanah | Fathanah | Kertosari | fathanah@kertosari.ulujami.go.id |
| 12 | turahati | Turahati | Pamutih | turahati@pamutih.ulujami.go.id |
| 13 | tunirah | Tunirah | Padek | tunirah@padek.ulujami.go.id |
| 14 | isrowiyah | Isrowiyah | Blendung | isrowiyah@blendung.ulujami.go.id |
| 15 | nurul | Nurul | Ketapang | nurul@ketapang.ulujami.go.id |
| 16 | kusni | Kusni | Limbangan | kusni@limbangan.ulujami.go.id |
| 17 | pujipurwati | Pujipurwati | Mojo | pujipurwati@mojo.ulujami.go.id |
| 18 | nurkhasanah | Nurkhasanah | Pesantren | nurkhasanah@pesantren.ulujami.go.id |

**Total: 20 Users (2 Admin + 18 Petugas Desa)**

## 🚀 Cara Setup di Netlify Identity

### **Method 1: Invite Individual (Recommended)**

1. **Login ke Netlify Dashboard**
2. **Pilih site Anda → Identity tab**
3. **Klik "Invite users"**
4. **Masukkan email satu per satu:**

```
admin@ppkbd.local
ppkbd@kemendukbangga.go.id
cholilah@sukorejo.ulujami.go.id
harwati@botekan.ulujami.go.id
friska@rowosari.ulujami.go.id
sugiarti@ambowetan.ulujami.go.id
kiswati@pagergunung.ulujami.go.id
nuraini@wiyorowetan.ulujami.go.id
umirohwati@samong.ulujami.go.id
masrurotun@tasikrejo.ulujami.go.id
suwati@bumirejo.ulujami.go.id
turikhah@kaliprau.ulujami.go.id
fathanah@kertosari.ulujami.go.id
turahati@pamutih.ulujami.go.id
tunirah@padek.ulujami.go.id
isrowiyah@blendung.ulujami.go.id
nurul@ketapang.ulujami.go.id
kusni@limbangan.ulujami.go.id
pujipurwati@mojo.ulujami.go.id
nurkhasanah@pesantren.ulujami.go.id
```

5. **User akan dapat email invitation**
6. **User klik link di email → set password sendiri**

### **Method 2: Bulk Import CSV**

1. **Buat file `users.csv`:**

```csv
email,name,role,desa
admin@ppkbd.local,Administrator,admin,Pusat
ppkbd@kemendukbangga.go.id,PPKBD Staff,staff,Pusat
cholilah@sukorejo.ulujami.go.id,Cholilah,petugas_desa,Sukorejo
harwati@botekan.ulujami.go.id,Harwati,petugas_desa,Botekan
friska@rowosari.ulujami.go.id,Friska,petugas_desa,Rowosari
sugiarti@ambowetan.ulujami.go.id,Sugiarti,petugas_desa,Ambowetan
kiswati@pagergunung.ulujami.go.id,Kiswati,petugas_desa,Pagergunung
nuraini@wiyorowetan.ulujami.go.id,Nuraini,petugas_desa,Wiyorowetan
umirohwati@samong.ulujami.go.id,Umirohwati,petugas_desa,Samong
masrurotun@tasikrejo.ulujami.go.id,Masrurotun,petugas_desa,Tasikrejo
suwati@bumirejo.ulujami.go.id,Suwati,petugas_desa,Bumirejo
turikhah@kaliprau.ulujami.go.id,Turikhah,petugas_desa,Kaliprau
fathanah@kertosari.ulujami.go.id,Fathanah,petugas_desa,Kertosari
turahati@pamutih.ulujami.go.id,Turahati,petugas_desa,Pamutih
tunirah@padek.ulujami.go.id,Tunirah,petugas_desa,Padek
isrowiyah@blendung.ulujami.go.id,Isrowiyah,petugas_desa,Blendung
nurul@ketapang.ulujami.go.id,Nurul,petugas_desa,Ketapang
kusni@limbangan.ulujami.go.id,Kusni,petugas_desa,Limbangan
pujipurwati@mojo.ulujami.go.id,Pujipurwati,petugas_desa,Mojo
nurkhasanah@pesantren.ulujami.go.id,Nurkhasanah,petugas_desa,Pesantren
```

2. **Di Netlify Identity → Import users**
3. **Upload file CSV**

## 🔧 Konfigurasi User Metadata

Untuk setiap user, tambahkan metadata:

```json
{
  "full_name": "Nama Lengkap",
  "role": "petugas_desa",
  "desa": "Nama Desa",
  "kecamatan": "Ulujami"
}
```

## 📧 Template Email Invitation

Customize email template di Netlify:

```html
<h2>Undangan Akses Aplikasi PPKBD</h2>
<p>Halo {{ .User.UserMetaData.full_name }},</p>
<p>Anda diundang untuk mengakses Aplikasi Laporan Bulanan PPKBD Kecamatan Ulujami.</p>
<p>Sebagai petugas desa {{ .User.UserMetaData.desa }}, Anda dapat:</p>
<ul>
  <li>Input data laporan bulanan</li>
  <li>Melihat data yang sudah diinput</li>
  <li>Export laporan</li>
</ul>
<p><a href="{{ .ConfirmationURL }}">Klik di sini untuk set password dan mulai menggunakan aplikasi</a></p>
```

## 🛡️ Security Settings

### **Registration Settings:**
- **Mode:** Invite only (tidak open registration)
- **Email confirmation:** Required
- **Password requirements:** Minimum 8 karakter

### **External Providers (Optional):**
- Google (jika petugas punya Gmail)
- GitHub (untuk admin/developer)

## 📊 User Management

### **Roles & Permissions:**
- **admin:** Full access, manage users
- **staff:** PPKBD staff, view all data
- **petugas_desa:** Input data untuk desa masing-masing

### **Monitoring:**
- Dashboard Netlify menampilkan:
  - Total active users
  - Login activity
  - Failed login attempts
  - User metadata

## 🔄 Migration dari Local ke Netlify

### **Step 1: Deploy dengan Netlify Identity**
```bash
git add .
git commit -m "Add Netlify Identity with village users"
git push origin main
```

### **Step 2: Enable Identity & Invite Users**
1. Enable Netlify Identity
2. Invite semua 20 users
3. Test login dengan beberapa user

### **Step 3: Disable Local Auth (Optional)**
Edit `login.html` untuk hide local modes:
```html
<!-- Hide local authentication modes -->
<div id="secureLocalMode" style="display: none;">
<div id="localMode" style="display: none;">
```

## 📞 Support untuk Petugas Desa

### **Panduan untuk Petugas:**
1. **Cek email invitation**
2. **Klik link konfirmasi**
3. **Set password (min 8 karakter)**
4. **Login dengan email & password**
5. **Mulai input data laporan**

### **Troubleshooting:**
- **Email tidak masuk:** Cek spam folder
- **Link expired:** Request invitation ulang
- **Lupa password:** Use password recovery
- **Tidak bisa login:** Contact admin

## 💡 Tips Deployment

### **Testing Phase:**
1. Invite 2-3 petugas dulu untuk testing
2. Test semua fitur aplikasi
3. Pastikan data tersimpan dengan benar
4. Baru invite semua petugas

### **Production Phase:**
1. Backup data existing (jika ada)
2. Invite semua petugas sekaligus
3. Kirim panduan penggunaan
4. Monitor usage & feedback

**Total users dalam free tier Netlify: 20/1000 ✅**