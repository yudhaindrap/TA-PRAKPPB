# Yudha Indra Praja
# 21120123140143

# 🌿 **PlantPal — Sahabat Tanaman Digital Anda**

PlantPal adalah aplikasi web progresif (PWA) yang dirancang untuk membantu Anda memantau dan merawat koleksi tanaman dengan mudah. Dengan fitur manajemen real-time dan sistem pengingat penyiraman otomatis, PlantPal memastikan tanaman Anda selalu terhidrasi dan sehat.

---

## ✨ **Fitur Utama (Features)**

PlantPal bukan hanya daftar tanaman, tetapi *asisten perawatan tanaman pribadi* dengan fitur penjadwalan canggih:

- **PWA Ready** — Dapat diinstal di smartphone atau desktop tanpa App Store.
- **Manajemen Koleksi** — Tambah, edit, dan hapus detail tanaman.
- **Sistem Alarm Penyiraman Harian** — Atur jam penyiraman untuk tiap tanaman.
- **Notifikasi Pintar (Browser/Push)** — Memunculkan notifikasi saat jadwal tiba.
- **Status Air Otomatis** — Tanaman berubah menjadi *BUTUH AIR* otomatis sesuai jadwal.
- **Optimistic UI Updates** — Aksi CRUD tampil instan tanpa menunggu server.
- **Autentikasi Aman** — Menggunakan Supabase Auth.
- **Manajemen Profil** — Update nama, avatar, dan bio.

---

## 🛠️ **Teknologi yang Digunakan (Tech Stack)**

Berikut adalah teknologi modern yang digunakan untuk membangun PlantPal:

| **Kategori**   | **Teknologi**                | **Deskripsi**                                                   |
| -------------- | ---------------------------- | --------------------------------------------------------------- |
| **Frontend**   | React (Hooks & Context)      | Kerangka utama. Context untuk state global (Auth & Plant Data). |
| **Styling**    | Tailwind CSS & Framer Motion | UI modern, animasi halus & responsif.                           |
| **Backend**    | Supabase                     | PostgreSQL, Auth, Storage. BaaS lengkap.                        |
| **Arsitektur** | PWA (Progressive Web App)    | Instalasi aplikasi + notifikasi ala native.                     |

---

## ⚙️ **Struktur Data & State Management**

PlantPal menggunakan dua Context terpisah namun saling terhubung:

---

### **1. AuthContext**

Mengelola identitas pengguna dan status sesi:

- `session`
- `profile`
- `userVisual`
- `totalPlants`
- `handleLogout()`
- `refreshProfile()`

---

### **2. PlantDataContext**

Mengelola seluruh koleksi tanaman:

- `plants`
- CRUD optimistik → `addPlant`, `updatePlant`, `deletePlant`
- Navigasi halaman detail tanaman
- **Logika alarm penyiraman otomatis**
  - Menggunakan `setInterval` untuk membaca `watering_schedule`
  - Memicu **Notifikasi Browser**
  - Memperbarui status `needsWater` secara otomatis

---

## 🗄️ **Skema Database (Supabase)**

Anda memerlukan 2 tabel utama:

### **profiles**

| Kolom        | Tipe Data               | Fungsi             |
| ------------ | ----------------------- | ------------------ |
| `id`         | UUID (FK ke auth.users) | Identitas user     |
| `full_name`  | text                    | Nama tampilan      |
| `avatar_url` | text                    | Foto profil        |
| `bio`        | text                    | Deskripsi pengguna |

---

### **plants**

| Kolom               | Tipe Data  | Fungsi                 |
| ------------------- | ---------- | ---------------------- |
| `user_id`           | UUID       | Owner tanaman          |
| `name`              | text       | Nama tanaman           |
| `species`           | text       | Spesies tanaman        |
| `location`          | text       | Lokasi tanaman         |
| `needsWater`        | boolean    | Status penyiraman      |
| `last_watered_at`   | timestamp  | Waktu terakhir disiram |
| `watering_schedule` | JSON/Array | List jam penyiraman    |

---

## 🚀 **Persiapan & Instalasi (Getting Started)**

### **1. Setup Supabase**

- Buat project baru.
- Buat tabel **profiles** dan **plants** sesuai skema.
- Tambahkan env:

```env
REACT_APP_SUPABASE_URL="URL_SUPABASE_ANDA"
REACT_APP_SUPABASE_ANON_KEY="ANON_SUPABASE_KEY"
```

### **2. Instalasi Proyek Lokal**
```
npm install
npm run dev
```
Aplikasi berjalan di:
```
http://localhost:5173
```

##  Vercell 
https://ta-prakppb.vercel.app/