# 🚀 Setup PWA-APP-KB di Netlify dengan Identity

## 📋 Langkah-langkah Deploy

### 1. **Upload ke GitHub**
```bash
git init
git add .
git commit -m "Initial commit with Netlify Identity"
git branch -M main
git remote add origin https://github.com/username/pwa-app-kb.git
git push -u origin main
```

### 2. **Deploy ke Netlify**
1. Login ke [netlify.com](https://netlify.com)
2. Klik "New site from Git"
3. Pilih GitHub dan repository Anda
4. Build settings:
   - **Build command:** (kosongkan)
   - **Publish directory:** `.` (titik)
5. Klik "Deploy site"

### 3. **Aktifkan Netlify Identity**
1. Di dashboard Netlify, buka site Anda
2. Pergi ke **Site settings** → **Identity**
3. Klik **Enable Identity**
4. Konfigurasi settings:
   - **Registration:** Open atau Invite only
   - **External providers:** Email (default)
   - **Git Gateway:** Enable (opsional)

### 4. **Konfigurasi Identity Settings**
Di **Site settings** → **Identity** → **Settings and usage**:

#### Registration preferences:
- **Open registration:** Siapa saja bisa daftar
- **Invite only:** Hanya yang diundang

#### Emails:
- Customize email templates (opsional)
- Set confirmation dan recovery URLs

#### External providers (opsional):
- Google, GitHub, GitLab, Bitbucket

### 5. **Test Aplikasi**
1. Buka URL site Netlify Anda
2. Klik tombol "🔐 Login / Daftar"
3. Modal Netlify Identity akan terbuka
4. Daftar akun baru atau login

## 🔧 Konfigurasi Lanjutan

### Custom Domain (Opsional)
1. **Site settings** → **Domain management**
2. Add custom domain
3. Configure DNS

### Environment Variables
Jika perlu, tambahkan di **Site settings** → **Environment variables**

### Form Handling
Netlify otomatis handle forms dengan attribute `netlify`

## 🛡️ Keamanan

### HTTPS
- Otomatis enabled di Netlify
- Force HTTPS redirect tersedia

### Identity Security
- JWT tokens untuk autentikasi
- Secure by default
- Role-based access (dengan upgrade)

## 📱 PWA Features

### Service Worker
- Otomatis berfungsi di Netlify
- Caching untuk offline access

### Install Prompt
- Muncul otomatis di browser yang support
- Custom install button tersedia

## 🔍 Troubleshooting

### Identity tidak muncul:
1. Pastikan Identity sudah enabled
2. Check browser console untuk errors
3. Verify script Netlify Identity ter-load

### Login tidak berfungsi:
1. Check network tab di DevTools
2. Pastikan site URL benar di Identity settings
3. Clear browser cache

### PWA tidak install:
1. Pastikan HTTPS aktif
2. Check manifest.json valid
3. Service worker registered

## 📞 Support

- [Netlify Docs](https://docs.netlify.com/visitor-access/identity/)
- [Netlify Identity Widget](https://github.com/netlify/netlify-identity-widget)
- [PWA Checklist](https://web.dev/pwa-checklist/)

## 🎯 Fitur Gratis Netlify Identity

- **1,000 active users** per bulan
- Email/password authentication
- Social login providers
- JWT tokens
- User management dashboard
- Email templates

Untuk lebih dari 1,000 users, upgrade ke Netlify Pro ($19/bulan).