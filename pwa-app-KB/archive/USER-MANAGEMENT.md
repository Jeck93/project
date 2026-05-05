# 👥 Panduan Mengelola User PWA-APP-KB

Aplikasi ini mendukung **2 mode autentikasi** yang bisa Anda pilih sesuai kebutuhan:

## 🔐 Mode 1: Local Authentication (Hardcoded Users)

### Cara Menambah/Edit User Lokal

Edit file `js/config.js` pada bagian `AUTH.USERS`:

```javascript
AUTH: {
    USERS: [
        { 
            username: 'admin', 
            password: 'admin123', 
            name: 'Administrator',
            email: 'admin@ppkbd.local',
            role: 'admin'
        },
        { 
            username: 'ppkbd', 
            password: 'ppkbd2024', 
            name: 'PPKBD Staff',
            email: 'ppkbd@kemendukbangga.go.id',
            role: 'staff'
        },
        // Tambahkan user baru di sini
        { 
            username: 'user_baru', 
            password: 'password123', 
            name: 'Nama Lengkap',
            email: 'email@domain.com',
            role: 'user'
        }
    ]
}
```

### Default Users yang Tersedia:
- **admin** / admin123 (Administrator)
- **ppkbd** / ppkbd2024 (PPKBD Staff)  
- **user1** / user123 (User Demo)
- **kecamatan** / kec2024 (Petugas Kecamatan)

## 🌐 Mode 2: Netlify Identity (Recommended)

### Keunggulan Netlify Identity:
- ✅ **Gratis 1,000 users/bulan**
- ✅ **Email verification** otomatis
- ✅ **Password recovery** via email
- ✅ **Secure JWT tokens**
- ✅ **Social login** (Google, GitHub, dll)
- ✅ **User management dashboard**

### Cara Mengelola User di Netlify:

#### 1. **Invite Users (Admin)**
```
1. Login ke Netlify Dashboard
2. Pilih site Anda → Identity tab
3. Klik "Invite users"
4. Masukkan email user
5. User dapat email invitation
6. User set password sendiri
```

#### 2. **Bulk Import Users**
```
1. Buat file CSV dengan format:
   email,name,role
   user1@domain.com,User Satu,staff
   user2@domain.com,User Dua,admin

2. Di Netlify Identity → Import users
3. Upload file CSV
```

#### 3. **Self Registration**
```
- Set "Registration" ke "Open" 
- User bisa daftar sendiri
- Email verification otomatis
```

#### 4. **Manual User Creation**
```
1. Identity → Users
2. Klik "Add user"
3. Isi email dan metadata
4. User dapat email untuk set password
```

## 🔧 Konfigurasi Mode Login

### Mengatur Mode Default

Edit `login.html` untuk mengatur mode default:

```javascript
// Untuk default Netlify Identity
netlifyModeBtn.click(); // Default aktif

// Untuk default Local Login  
localModeBtn.click(); // Default aktif
```

### Menyembunyikan Salah Satu Mode

Jika hanya ingin 1 mode, edit `login.html`:

```html
<!-- Hanya Netlify Identity -->
<div class="login-mode-selector" style="display: none;">
<!-- Sembunyikan selector -->

<!-- Hanya Local Login -->
<div id="netlifyMode" style="display: none;">
<!-- Sembunyikan mode Netlify -->
```

## 🛡️ Keamanan

### Local Authentication:
- ⚠️ **Password hardcoded** di JavaScript
- ⚠️ **Tidak aman** untuk production
- ✅ **Cocok untuk demo/development**
- ✅ **Tidak perlu internet**

### Netlify Identity:
- ✅ **JWT tokens** yang aman
- ✅ **Password hashed** di server
- ✅ **HTTPS** required
- ✅ **Production ready**
- ✅ **Audit logs** tersedia

## 📊 Monitoring Users

### Netlify Identity Dashboard:
- Lihat semua registered users
- Monitor login activity  
- Manage user roles/metadata
- Export user data
- View authentication logs

### Local Users:
- Tidak ada monitoring built-in
- Bisa tambahkan logging manual di code

## 🚀 Rekomendasi Deployment

### Development/Testing:
```
✅ Gunakan Local Authentication
- Cepat setup
- Tidak perlu konfigurasi external
- Mudah testing
```

### Production:
```
✅ Gunakan Netlify Identity  
- Keamanan tinggi
- User management proper
- Scalable
- Professional
```

## 🔄 Migrasi dari Local ke Netlify

1. **Deploy dengan Netlify Identity enabled**
2. **Invite existing users** via email
3. **Update documentation** untuk user
4. **Disable local mode** di login.html
5. **Remove hardcoded credentials** dari config.js

## 💡 Tips & Best Practices

### Untuk Local Users:
- Gunakan password yang kuat
- Jangan commit credentials ke public repo
- Gunakan environment variables jika perlu

### Untuk Netlify Identity:
- Enable email verification
- Set up custom email templates
- Configure proper redirect URLs
- Monitor usage limits
- Backup user data regularly

## 🆘 Troubleshooting

### Local Login Issues:
```javascript
// Debug di browser console:
console.log('Available users:', CONFIG.AUTH.USERS);
```

### Netlify Identity Issues:
```javascript
// Debug Netlify Identity:
console.log('Current user:', netlifyIdentity.currentUser());
console.log('Identity ready:', netlifyIdentity);
```

### Common Problems:
1. **"User not found"** → Check username/password spelling
2. **"Netlify Identity not loading"** → Check internet connection
3. **"Redirect loop"** → Clear browser cache/localStorage
4. **"Email not verified"** → Check spam folder

## 📞 Support

- [Netlify Identity Docs](https://docs.netlify.com/visitor-access/identity/)
- [Local Auth Config](js/config.js)
- [Authentication Handler](js/netlify-auth.js)