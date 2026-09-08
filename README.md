# 🐔 HiFeed SCOM — Sistem Manajemen Pakan Ternak

> **HiFeed SCOM (Supply Chain & Operations Management)** adalah sistem digital untuk mengelola keluar-masuk stok pakan ternak dari pabrik, gudang, hingga peternakan mitra secara akurat dan real-time.

---

## 💡 Penjelasan Arsitektur Sistem (Secara Sederhana)

Bayangkan sistem ini bekerja seperti **"Buku Tabungan Digital"** untuk pakan ternak. Aplikasi ini dibagi menjadi **3 komponen utama** yang saling terhubung:

```
┌─────────────────────────────────────────────────────────────┐
│                    1. BACKEND API (OTAK PUSAT)              │
│       • Menyimpan semua data stok pakan                     │
│       • Menjaga hitungan stok selalu akurat (Anti-Stok Minus)│
└──────────────────────────────┬──────────────────────────────┘
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
┌──────────────────────────────┐   ┌──────────────────────────────┐
│  2. WEB DASHBOARD (SUPERVISOR)│   │  3. MOBILE SCANNER (STAF)    │
│  • Dibuka di Laptop/Komputer │   │  • Dibuka di HP (React Native)│
│  • Memantau sisa stok        │   │  • Scan QR Code karung pakan │
│  • Peringatan stok habis     │   │  • Catat barang masuk/keluar │
└──────────────────────────────┘   └──────────────────────────────┘
```

### 🎯 3 Bagian Utama Sistem:

1. **🧠 Backend API (Pusat Data / Otak Sistem)**
   * **Fungsi:** Menyimpan data pakan, batch, dan catatan transaksi.
   * **Fitur Keamanan (*Atomic Transaction*):** Mencegah kesalahan hitung jika ada 2 petugas yang melakukan scan bersamaan. Stok tidak akan pernah bernilai minus.

2. **💻 Web Dashboard (Tampilan Komputer untuk Supervisor Gudang)**
   * **Fungsi:** Tempat supervisor memantau stok pakan dari meja kerja.
   * **Fitur:** 
     * Menampilkan grafik ringkasan stok.
     * **Alert Merah:** Peringatan otomatis jika stok pakan menipis atau mau kedaluwarsa.
     * **Tabel Riwayat:** Mencatat siapa yang mengambil/menambah pakan beserta waktunya.
     * **Generator QR Code:** Menampilkan QR Code di layar untuk di-scan oleh staf HP.

3. **📱 Mobile Scanner (Aplikasi HP untuk Staf Lapangan)**
   * **Fungsi:** Dipegang oleh petugas gudang/lapangan saat memindahkan karung pakan.
   * **Fitur:**
     * **Kamera QR Scanner:** Cukup arahkan kamera HP ke QR Code karung pakan.
     * **Tombol Input Manual:** Sebagai opsi jika kamera HP sedang bermasalah.
     * **Konfirmasi Masuk/Keluar:** Masukkan jumlah pakan yang diterima (*Inbound*) atau dipakai (*Dispatch*).

---

## 🛠️ Panduan Instalasi (Langkah Mudah Menjalankan Aplikasi)

Ikuti langkah demi langkah di bawah ini untuk menjalankan aplikasi di komputer Anda.

### 📋 Persiapan Awal
Sebelum memulai, pastikan komputer Anda sudah terinstall **Node.js** (Versi 18 ke atas).  
*(Jika belum ada, download dan install di: [https://nodejs.org](https://nodejs.org))*

---

### 🟢 Langkah 1: Jalankan Backend (Pusat Data)

Buka **Terminal / Command Prompt**, lalu jalankan perintah berikut:

```bash
# 1. Masuk ke folder backend
cd backend

# 2. Install kebutuhan program
npm install

# 3. Buat dan isi database awal (Otomatis)
npx prisma generate
npx prisma migrate dev --name init

# 4. Jalankan backend
npm run dev
```
✅ **Berhasil:** Backend sekarang berjalan di `http://localhost:3001`

---

### 🔵 Langkah 2: Jalankan Web Dashboard (Layar Komputer)

Buka **Terminal Baru** (tetap biarkan terminal backend running), lalu jalankan:

```bash
# 1. Masuk ke folder frontend
cd frontend

# 2. Install kebutuhan program
npm install

# 3. Jalankan Web Dashboard
npm run dev
```
✅ **Berhasil:** Buka browser laptop Anda dan akses **`http://localhost:3000`**

---

### 🟣 Langkah 3: Jalankan Mobile Scanner (Aplikasi HP)

Buka **Terminal Baru** lagi, lalu jalankan:

```bash
# 1. Masuk ke folder mobile
cd mobile

# 2. Install kebutuhan program
npm install

# 3. Jalankan server Expo
npx expo start
```

#### Cara Pengujian Aplikasi HP:
1. **Menggunakan HP Fisik (Rekomendasi):**
   * Download aplikasi **Expo Go** dari Google Play Store / App Store di HP Anda.
   * Scan QR Code yang muncul di layar terminal menggunakan aplikasi Expo Go.
   * Buka menu **"Batch & QR Code"** di Web Dashboard (`http://localhost:3000/batches`), lalu scan QR Code di layar laptop Anda!
2. **Menggunakan Input Manual:**
   * Di aplikasi HP, Anda juga bisa menekan tombol **"Input Manual"** dan mengetikkan nomor batch (contoh: `BATCH-BR01-2024-001`).

---

## 📡 Ringkasan API Endpoints (Untuk Pengembang/Technical Review)

Base URL API: `http://localhost:3001/api/v1/inventory`

| Method | Endpoint | Fungsi Sederhana |
|---|---|---|
| `GET` | `/items` | Mengambil daftar master pakan & status *Low Stock* |
| `GET` | `/batches` | Mengambil daftar batch pakan & tanggal kedaluwarsa |
| `POST` | `/inbound` | Menambah stok pakan baru ke dalam gudang |
| `POST` | `/scan-dispatch` | Mengurangi stok pakan berdasarkan hasil scan QR |
| `GET` | `/mutations` | Melihat catatan riwayat keluar-masuk barang (Audit Log) |

---

## 🔒 Integritas Data & Keamanan Transaksi
* **Atomic Transaction:** Semua proses tambah/kurang stok dibungkus dalam `prisma.$transaction`. Jika ada gangguan jaringan atau kuantitas yang diminta melebihi sisa stok, transaksi akan dibatalkan otomatis dan mengembalikan error HTTP 400.
* **Mock Auth Headers:** Header `x-user-id: staff-01` dan `x-user-role: field_operator` digunakan untuk mencatat nama operator yang melakukan mutasi stok.