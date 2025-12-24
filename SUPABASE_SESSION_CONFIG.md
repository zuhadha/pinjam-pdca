# Konfigurasi Supabase - Long-Lived Session (Permanent Login)

Dokumentasi ini menjelaskan cara mengatur Supabase Auth agar user tetap logged in tanpa session timeout.

## 🎯 Tujuan

- User cukup login **sekali saja**
- Tidak ada session timeout otomatis
- User tetap logged in meskipun tutup browser
- Logout hanya jika user manual klik logout atau clear browser data

## 📋 Langkah-Langkah Konfigurasi

### 1. Login ke Supabase Dashboard

1. Buka [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Login dengan akun Supabase Anda
3. Pilih project yang digunakan untuk sistem peminjaman barang

### 2. Navigasi ke Sessions Settings

1. Di sidebar kiri, klik **"Authentication"**
2. Di bawah section **"CONFIGURATION"**, klik **"Sessions"**
3. Anda akan melihat halaman Session Configuration

### 3. Configure JWT Settings

Di halaman Sessions, Anda akan menemukan beberapa field yang perlu diatur:

#### **JWT Expiry (Access Token)**
```
Default: 3600 seconds (1 hour)
Recommended: 86400 seconds (24 hours)
```

**Cara setting:**
- Cari field `JWT Expiry` atau `Access Token Lifetime`
- Ubah dari `3600` menjadi `86400`
- Ini akan membuat access token bertahan 24 jam sebelum perlu refresh

#### **Refresh Token Lifetime**
```
Default: 604800 seconds (7 days)
Recommended: 0 (unlimited) atau 31536000 (1 year)
```

**Cara setting:**
- Cari field `Refresh Token Lifetime` atau `Refresh Token Rotation`
- Set ke `0` untuk unlimited, atau
- Set ke `31536000` (365 hari) untuk 1 tahun
- Simpan perubahan

### 4. Disable Refresh Token Rotation (Optional)

Untuk permanent session yang lebih stabil:

1. Cari setting **"Refresh Token Rotation"**
2. **Disable** atau set **Reuse Interval** ke nilai sangat besar
3. Ini mencegah forced logout karena token rotation

### 5. Configure Inactivity Timeout

1. Cari field `Inactivity Timeout` atau `Session Timeout`
2. Set ke `0` untuk disable timeout
3. Atau set ke nilai sangat besar jika `0` tidak diperbolehkan

### 6. Save Changes

1. Scroll ke bawah
2. Klik tombol **"Save"** atau **"Update"**
3. Tunggu konfirmasi perubahan berhasil disimpan

## ✅ Verifikasi Konfigurasi

Setelah konfigurasi, test dengan:

1. **Test Login:**
   - Login ke aplikasi
   - Tutup browser completely
   - Buka browser lagi
   - Akses website → Seharusnya masih logged in ✅

2. **Test Long Session:**
   - Login ke aplikasi
   - Biarkan browser terbuka tanpa aktifitas selama beberapa jam
   - Refresh page → Seharusnya masih logged in ✅

## 📊 Expected Behavior

**Setelah konfigurasi:**
- ✅ User login sekali = tetap logged in selamanya
- ✅ Tutup browser & buka lagi = masih logged in
- ✅ Tidak aktif berhari-hari = tetap logged in
- ✅ Token auto-refresh di background

**User akan logout HANYA jika:**
- ❌ Manual klik tombol "Logout"
- ❌ Clear browser cookies/data
- ❌ Admin revoke session secara manual

## 🔐 Security Notes

**Untuk internal company app, konfigurasi ini AMAN karena:**

1. ✅ **Controlled environment** - Hanya karyawan internal (200 users)
2. ✅ **Low risk data** - Bukan financial atau highly sensitive data
3. ✅ **Better UX** - Staff tidak perlu login berulang kali
4. ✅ **Still secure** - Middleware tetap validate session setiap request

**Best practices:**
- Edukasi user untuk logout jika menggunakan shared computer
- Monitor suspicious activity di admin dashboard
- Pastikan HTTPS enabled (otomatis di Vercel)

## 🛠️ Alternative: Via Supabase API (Optional)

Jika tidak bisa akses dashboard, bisa set via API:

```bash
# Using Supabase CLI
supabase auth set --jwt-expiry 86400
supabase auth set --refresh-token-lifetime 0
```

Atau via SQL:

```sql
-- Update auth config (run in Supabase SQL Editor)
ALTER ROLE authenticator SET statement_timeout = '86400s';
```

## 📝 Configuration Summary

| Setting | Default | Recommended |
|---------|---------|-------------|
| JWT Expiry | 3600s (1h) | 86400s (24h) |
| Refresh Token Lifetime | 604800s (7d) | 0 (unlimited) |
| Session Timeout | Varies | 0 (disabled) |
| Token Rotation | Enabled | Disabled |

## ❓ Troubleshooting

**Problem: User masih logout setelah beberapa waktu**
- Cek apakah Refresh Token Lifetime sudah di-set dengan benar
- Pastikan browser tidak clear cookies otomatis
- Cek di Supabase Dashboard → Logs untuk error

**Problem: "Invalid Refresh Token" error**
- Bisa jadi token rotation masih aktif
- Disable token rotation di settings
- Minta user login ulang setelah konfigurasi berubah

**Problem: Setting tidak tersimpan**
- Pastikan Anda punya role Owner/Admin di Supabase project
- Try hard refresh dashboard (Ctrl+Shift+R)
- Contact Supabase support jika masalah persist

## 🎯 Hasil Akhir

Setelah konfigurasi selesai, user experience menjadi:

```
User pertama kali:
1. Buka website → Redirect ke /login
2. Login dengan username/password
3. Masuk ke dashboard ✅

Hari-hari berikutnya:
1. Buka website → Langsung masuk ke dashboard ✅
2. Tidak perlu login lagi
3. Smooth UX untuk karyawan!
```

---

**Updated:** 24 Desember 2024  
**For:** Sistem Peminjaman Barang Internal - Garuda Food
