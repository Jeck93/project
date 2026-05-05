# Panduan Admin - Pengelolaan Akun Pengguna

## 🔒 Keamanan Login Aplikasi PPKBD

### Masalah Keamanan yang Telah Diperbaiki

**SEBELUM:** Halaman login menampilkan semua username dan password secara terbuka, yang sangat tidak aman.

**SESUDAH:** Informasi login tidak lagi ditampilkan di halaman publik. Hanya admin yang memiliki akses ke informasi akun.

### Daftar Akun Pengguna

#### Admin Accounts
- **admin** / admin123 (Administrator Utama)
- **ppkbd** / ppkbd2024 (Staff PPKBD)

#### Petugas Desa Kecamatan Ulujami
- **cholilah** / laporan123 (Sukorejo)
- **harwati** / laporan123 (Botekan)
- **friska** / laporan123 (Rowosari)
- **sugiarti** / laporan123 (Ambowetan)
- **kiswati** / laporan123 (Pagergunung)
- **nuraini** / laporan123 (Wiyorowetan)
- **umirohwati** / laporan123 (Samong)
- **masrurotun** / laporan123 (Tasikrejo)
- **suwati** / laporan123 (Bumirejo)
- **turikhah** / laporan123 (Kaliprau)
- **fathanah** / laporan123 (Kertosari)
- **turahati** / laporan123 (Pamutih)
- **tunirah** / laporan123 (Padek)
- **isrowiyah** / laporan123 (Blendung)
- **nurul** / laporan123 (Ketapang)
- **kusni** / laporan123 (Limbangan)
- **pujipurwati** / laporan123 (Mojo)
- **nurkhasanah** / laporan123 (Pesantren)

### Cara Mengelola Akun

#### 1. Menambah Pengguna Baru
Edit file `js/config.js` di bagian `CONFIG.AUTH.USERS`:

```javascript
{
    username: 'username_baru',
    password: 'password_aman',
    name: 'Nama Lengkap',
    email: 'email@desa.go.id',
    role: 'petugas_desa',
    desa: 'Nama Desa'
}
```

#### 2. Mengubah Password
1. Buka file `js/config.js`
2. Cari username yang ingin diubah
3. Ganti nilai `password` dengan password baru
4. Simpan file dan restart aplikasi

#### 3. Menghapus Pengguna
1. Buka file `js/config.js`
2. Hapus objek user yang tidak diperlukan dari array `USERS`
3. Simpan file

### Rekomendasi Keamanan

#### ✅ Yang Sudah Diterapkan
- Password di-hash menggunakan algoritma hash
- Session timeout 24 jam
- Brute force protection
- Informasi login tidak ditampilkan di halaman publik

#### 🔧 Perbaikan Tambahan yang Disarankan
1. **Ganti Password Default**: Ubah semua password default menjadi password yang lebih kuat
2. **Implementasi HTTPS**: Pastikan aplikasi berjalan di HTTPS
3. **Regular Password Update**: Ubah password secara berkala
4. **Two-Factor Authentication**: Pertimbangkan implementasi 2FA
5. **Audit Log**: Tambahkan logging untuk aktivitas login

### Cara Memberikan Akun ke Petugas Desa

1. **Jangan** berikan informasi login melalui email atau chat yang tidak aman
2. **Berikan** informasi login secara langsung atau melalui saluran komunikasi yang aman
3. **Instruksikan** petugas untuk mengubah password setelah login pertama
4. **Pastikan** petugas memahami pentingnya menjaga kerahasiaan login

### Troubleshooting

#### Petugas Tidak Bisa Login
1. Periksa username dan password di `js/config.js`
2. Pastikan tidak ada typo dalam konfigurasi
3. Clear cache browser petugas
4. Periksa console browser untuk error

#### Lupa Password
1. Admin dapat melihat password di file `js/config.js`
2. Atau reset password dengan mengubah nilai di konfigurasi

### Kontak Support
Untuk bantuan teknis, hubungi administrator sistem.

---
**Catatan Penting**: File ini hanya untuk admin. Jangan bagikan informasi login kepada pihak yang tidak berwenang.