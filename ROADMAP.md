# Roadmap Pengembangan Aplikasi Kuis AI

Dokumen ini berisi cetak biru (blueprint) dan ide-ide pengembangan tingkat lanjut yang akan diimplementasikan di masa depan untuk membuat aplikasi ini menjadi lebih canggih, tahan banting, dan kaya fitur.

## 1. Dukungan Simbol Matematika Kompleks (LaTeX)
**Tujuan:** Memungkinkan aplikasi membaca, memproses oleh AI, dan merender ulang rumus matematika kompleks (seperti pecahan, akar, integral, dll) dengan tampilan visual yang rapi, bukan sekadar teks acak.

**Rencana Implementasi:**
- **Input (Pengguna):** Pengguna menginput materi yang mengandung rumus matematika menggunakan format standar industri yaitu **LaTeX** (contoh: `\frac{1}{2}`, `\sqrt{x}`).
- **Pemrosesan (AI Gemini):** Prompt AI akan dimodifikasi dengan instruksi tambahan: *"Jika terdapat perhitungan atau rumus matematika, pertahankan atau format opsi jawaban menggunakan notasi LaTeX murni."*
- **Render (UI/Aplikasi):** 
  - Menginstal library React Native khusus pembaca matematika, seperti `react-native-math-view` atau `react-native-render-html` (dengan plugin math).
  - Mengubah komponen UI di layar `quiz.tsx` agar setiap teks yang memiliki format LaTeX akan dirender menjadi gambar rumus matematika yang elegan.

## 2. Arsitektur Local-First (Mode Offline & Ekspor Data)
**Tujuan:** Mengurangi ketergantungan pada koneksi internet, menghilangkan *loading* saat mengambil soal, dan memberikan kontrol penuh kepada pengguna atas data kuis mereka (bisa diekspor/dibagikan).

**Rencana Implementasi:**
- **Migrasi Database:** Memindahkan peran penyimpanan utama dari Firebase Cloud Firestore ke database lokal murni di dalam HP (seperti **SQLite** via `expo-sqlite` atau **AsyncStorage/WatermelonDB**).
- **Alur Kerja Baru:**
  1. Pengguna men-*generate* soal via AI (butuh internet).
  2. Hasil JSON dari AI langsung disimpan ke database SQLite lokal.
  3. Saat membuka mode "Mulai Kuis", aplikasi membaca dari SQLite dengan kecepatan instan (0 detik *loading*) dan 100% bisa dimainkan **tanpa internet (Offline)**.
- **Fitur Manajemen Data:**
  - **Ekspor/Impor:** Menambahkan tombol untuk membungkus semua soal di SQLite menjadi file `soal.json` atau `soal.csv`. File ini bisa di-share via WhatsApp ke HP lain, lalu di-impor kembali ke aplikasi.
  - **Cloud Backup (Opsional):** Firebase tetap dipertahankan, namun statusnya turun menjadi sekadar "Backup". Hanya akan aktif menyinkronkan data dari lokal ke cloud jika pengguna menekan tombol "Backup ke Cloud".

---
*Ide-ide ini disimpan pada tanggal 15 September 2026. Siap dieksekusi kapan pun dibutuhkan!*
