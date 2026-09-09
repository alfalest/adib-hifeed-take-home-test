# HiFeed Supply Chain & Operations Management

## Arsitektur & Komponen Sistem

Sistem ini dirancang dengan model **Monorepo (npm workspaces)** yang memisahkan tanggung jawab menjadi 3 aplikasi spesifik:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       1. BACKEND API (Express.js)                       │
│  • Engine transaksi atomik (Prisma ORM + SQLite / PostgreSQL)           │
│  • Validasi skema (Zod), otentikasi role, & audit log mutasi stok       │
│  • Berjalan di: http://localhost:3001                                   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
┌─────────────────────────────────────┐ ┌─────────────────────────────────────┐
│    2. WEB DASHBOARD (Next.js)       │ │    3. MOBILE SCANNER (React Native) │
│ • Khusus Peran: SUPERVISOR GUDANG   │ │ • Khusus Peran: STAFF LAPANGAN      │
│ • Ringkasan KPI & Analitik Stok     │ │ • Scan QR Code karung pakan         │
│ • Generator QR Code interaktif      │ │ • Konfirmasi Inbound & Dispatch     │
│ • Audit Ledger keluar-masuk barang  │ │ • Mode fallback input kode manual   │
│ • Berjalan di: http://localhost:3000│ │ • Berjalan via: Expo Go (Port 8081) │
└─────────────────────────────────────┘ └─────────────────────────────────────┘
```

### Penjelasan 3 Komponen:

1. **Backend API (`/backend`)**:
   - **Teknologi:** Node.js, TypeScript, Express.js, Prisma ORM, Zod.
   - **Database:** SQLite (default: `dev.db`, siap pakai tanpa instalasi database luar).
   - **Peran:** Mengelola master data pakan, nomor batch, validasi masa kedaluwarsa, dan pencatatan audit log mutasi stok.

2. **Web Dashboard (`/frontend`)**:
   - **Teknologi:** Next.js 14 (App Router), React 18, Custom CSS Design System.
   - **Peran:** Pusat kendali operasional gudang untuk **Supervisor**. Memantau stok menipis (_low stock_), batch mendekati kedaluwarsa (_near expiry_), melihat riwayat mutasi (_audit trail_), serta menampilkan QR Code pakan di layar laptop untuk langsung dipindai oleh petugas lapangan.

3. **Mobile Scanner App (`/mobile`)**:
   - **Teknologi:** React Native, Expo SDK 57, Expo Router, Expo Camera.
   - **Peran:** Alat kerja digital untuk **Staff Lapangan**. Dilengkapi pemindai kamera QR Code, senter (_torch_), validasi sisa stok sebelum dispatch, serta konfigurasi alamat IP server dinamis untuk koneksi jaringan lokal.

---

## Daftar Akun Pengguna (Demo / Testing)

Sistem telah dilengkapi dengan data akun awal (mock users) yang siap digunakan:

| User ID             | Password   | Peran (Role)       | Nama Pengguna     | Hak Akses Utama                                                              |
| :------------------ | :--------- | :----------------- | :---------------- | :--------------------------------------------------------------------------- |
| **`supervisor-01`** | `super123` | **Supervisor**     | Supervisor Gudang | Akses penuh Web Dashboard (`/`, `/batches`, `/mutations`) & Mobile Dashboard |
| **`staff-01`**      | `staff123` | **Staff Lapangan** | Ahmad Fauzi       | Khusus Mobile Scanner (Ditolak jika login ke Web)                            |
| **`staff-02`**      | `staff123` | **Staff Lapangan** | Budi Santoso      | Khusus Mobile Scanner (Ditolak jika login ke Web)                            |
| **`staff-03`**      | `staff123` | **Staff Lapangan** | Citra Dewi        | Khusus Mobile Scanner (Ditolak jika login ke Web)                            |

---

## Prasyarat Sistem

Sebelum menjalankan aplikasi, pastikan perangkat Anda telah terpasang:

- **Node.js**: Versi `18.x` atau `20.x` (LTS direkomendasikan). Cek dengan `node -v`.
- **npm**: Versi `9.x` atau lebih baru.
- **Expo Go App** (Opsional, untuk test di HP fisik).

---

## Panduan Menjalankan Aplikasi

#### 1. Jalankan Backend API

```bash
cd backend

# Salin konfigurasi environment (jika belum ada)
copy .env.example .env    # Windows CMD / PowerShell
# cp .env.example .env     # Linux / macOS

# Install dependensi
npm install

# Generate Prisma Client & masukkan data awal (seeding)
npx prisma generate
npm run db:seed

# Jalankan server API (Port 3001)
npm run dev
```

> **Backend Aktif di:** `http://localhost:3001`  
> Cek status melalui browser di `http://localhost:3001/api/health`

---

#### 2. Jalankan Web Dashboard (Supervisor)

Buka terminal baru:

```bash
cd frontend

# Install dependensi
npm install

# Jalankan Web Dashboard (Port 3000)
npm run dev
```

> **Web Dashboard Aktif di:** `http://localhost:3000`  
> Buka browser dan login menggunakan akun `supervisor-01` / `super123`.

---

#### 3. Jalankan Mobile Scanner (Staff Lapangan)

Buka terminal baru:

```bash
cd mobile

# Install dependensi
npm install

# Jalankan server Expo (Port 8081)
npx expo start
```

> **Expo Metro Bundler Aktif.**
>
> Scan QR Code di terminal menggunakan aplikasi **Expo Go** pada smartphone fisik.

---

## Panduan Pengujian Mobile di Smartphone Fisik

Aplikasi mobile dirancang agar dapat berkomunikasi langsung dengan backend di laptop/PC Anda saat terhubung dalam **satu jaringan Wi-Fi / Hotspot yang sama**.

1. **Pastikan Satu Jaringan Wi-Fi:** Sambungkan laptop dan HP Anda ke jaringan Wi-Fi yang sama (atau aktifkan Hotspot dari HP ke laptop).
2. **Buka Aplikasi Expo Go:** Scan QR code yang tampil di terminal terminal `mobile`.
3. **Deteksi IP Otomatis:** Aplikasi mobile secara cerdas membaca IP lokal laptop Anda (misal `http://192.168.x.x:3001`).
4. **Pengaturan Manual IP (Jika Diperlukan):**
   - Di layar Login atau Scanner mobile, terdapat tombol **"Server IP"** / ikon pengaturan di pojok atas.
   - Anda dapat mengetikkan URL backend secara manual, contoh: `http://192.168.1.10:3001`.
5. **Mode Simulasi Scan (Tanpa Kamera Fisik):**
   - Jika Anda menjalankan mobile di browser atau emulator tanpa kamera, gunakan tombol **"Input Manual"** atau tombol **"Simulasi Scan"** yang tersedia di aplikasi.

---

## Referensi API Endpoints

Semua endpoint backend berada di bawah base URL: `http://localhost:3001/api/v1`

### 1. Autentikasi (`/auth`)

| Method | Endpoint      | Keterangan                                      | Body / Header                            |
| :----- | :------------ | :---------------------------------------------- | :--------------------------------------- |
| `POST` | `/auth/login` | Login pengguna & mendapatkan token base64       | `{ "userId": "...", "password": "..." }` |
| `GET`  | `/auth/me`    | Validasi token & mengambil info sesi user aktif | Header `Authorization: Bearer <token>`   |

### 2. Inventori & Mutasi (`/inventory`)

| Method | Endpoint                   | Keterangan                                                            | Parameter / Body                                               |
| :----- | :------------------------- | :-------------------------------------------------------------------- | :------------------------------------------------------------- |
| `GET`  | `/inventory/items`         | Mengambil daftar master pakan, status _low stock_, & total stok       | Query: `search`, `category`, `low_stock_only`, `page`, `limit` |
| `GET`  | `/inventory/batches`       | Mengambil daftar batch, status kadaluwarsa, & payload QR              | Query: `search`, `status`, `feed_item_id`, `page`, `limit`     |
| `POST` | `/inventory/inbound`       | Menambah stok batch baru atau restock batch lama _(Atomic)_           | Body: `{ batch_number, sku, quantity, expired_date, notes? }`  |
| `POST` | `/inventory/scan-dispatch` | Mengurangi kuantitas batch dari hasil scan QR _(Atomic & Anti-Minus)_ | Body: `{ qr_payload?, batch_id?, quantity, notes? }`           |
| `GET`  | `/inventory/mutations`     | Mengambil catatan ledger riwayat mutasi pakan _(Audit Trail)_         | Query: `type` (INBOUND/DISPATCH), `search`, `page`, `limit`    |

---

### Pengembang

Dibuat untuk memenuhi requirements **HiFeed Take Home Test oleh Muhammad Adib Alfaini Afifi**.
