// Generate the SAVO Ops usage guide (Bahasa Indonesia) as a branded PDF,
// using the same engine as the app's invoices (@react-pdf/renderer).
//
//   node scripts/build-guide-pdf.mjs
//   → docs/Panduan-Penggunaan-SAVO-Ops.pdf
//
// Content-only script (no secrets, no DB). Safe to re-run.

import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const require = createRequire(import.meta.url);
const React = require("react");
const ReactPDF = require("@react-pdf/renderer");
const { Document, Page, Text, View, StyleSheet } = ReactPDF;
const renderToFile = ReactPDF.renderToFile ?? ReactPDF.default?.renderToFile;

const h = React.createElement;

// ---- Brand palette (matches invoice-pdf / app tokens) ----
const CREAM = "#FBF7F0";
const INK = "#1F1A17";
const MUTED = "#6B6258";
const ACCENT = "#C0492B";
const AMBER = "#C9892F";
const GREEN = "#2F7D5B";
const BORDER = "#E7DDCC";
const SOFT = "#F4ECDE";

const s = StyleSheet.create({
  page: {
    paddingTop: 54,
    paddingBottom: 48,
    paddingHorizontal: 44,
    fontSize: 10.5,
    lineHeight: 1.5,
    color: INK,
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
  },
  cover: {
    padding: 0,
    backgroundColor: CREAM,
    color: INK,
    fontFamily: "Helvetica",
  },
  // fixed page furniture
  topbar: {
    position: "absolute",
    top: 24,
    left: 44,
    right: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: 6,
  },
  topbarBrand: { fontSize: 11, fontFamily: "Helvetica-Bold", color: ACCENT, letterSpacing: 1 },
  topbarText: { fontSize: 8, color: MUTED },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 44,
    right: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 6,
  },
  footerText: { fontSize: 8, color: MUTED },

  h1: { fontSize: 18, fontFamily: "Helvetica-Bold", color: INK, marginBottom: 2 },
  h1kicker: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: ACCENT, letterSpacing: 1.5, textTransform: "uppercase" },
  h1rule: { height: 2, width: 42, backgroundColor: ACCENT, marginTop: 6, marginBottom: 12 },
  h2: { fontSize: 12.5, fontFamily: "Helvetica-Bold", color: INK, marginTop: 14, marginBottom: 5 },
  p: { marginBottom: 6 },
  strong: { fontFamily: "Helvetica-Bold" },
  accent: { color: ACCENT, fontFamily: "Helvetica-Bold" },
  muted: { color: MUTED },

  // bullets & steps
  liRow: { flexDirection: "row", marginBottom: 3.5, paddingRight: 6 },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: ACCENT, marginTop: 5, marginRight: 7 },
  stepNum: {
    width: 15, height: 15, borderRadius: 7.5, backgroundColor: SOFT, color: ACCENT,
    fontSize: 8.5, fontFamily: "Helvetica-Bold", textAlign: "center", paddingTop: 2.5, marginRight: 7,
  },
  liText: { flex: 1 },

  // callouts
  callout: { borderRadius: 8, padding: 10, marginTop: 8, marginBottom: 4, borderLeftWidth: 3 },
  calloutTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5 },

  // module card
  card: { borderWidth: 1, borderColor: BORDER, borderRadius: 8, padding: 11, marginBottom: 9 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  cardTitle: { fontSize: 11.5, fontFamily: "Helvetica-Bold" },
  cardMenu: {
    fontSize: 7.5, fontFamily: "Helvetica-Bold", color: ACCENT, backgroundColor: SOFT,
    paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4, marginLeft: 8,
  },

  // flow diagram
  flowRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", marginBottom: 6 },
  flowBox: {
    borderWidth: 1, borderColor: ACCENT, borderRadius: 6, backgroundColor: CREAM,
    paddingVertical: 5, paddingHorizontal: 8, marginRight: 4, marginBottom: 4,
  },
  flowBoxText: { fontSize: 9, fontFamily: "Helvetica-Bold", color: ACCENT },
  flowArrow: { fontSize: 11, color: MUTED, marginRight: 4, fontFamily: "Helvetica-Bold" },

  // simple two-col example table
  exRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: BORDER, paddingVertical: 4 },
  exHead: { flexDirection: "row", backgroundColor: SOFT, paddingVertical: 5, paddingHorizontal: 6, borderRadius: 4, marginBottom: 2 },
  exCellL: { flex: 1, paddingHorizontal: 6 },
  exCellR: { width: 150, paddingHorizontal: 6 },
  cellHead: { fontSize: 8.5, fontFamily: "Helvetica-Bold", textTransform: "uppercase", color: MUTED },

  // TOC
  tocRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: BORDER },
});

// ---- helpers ----
const P = (children, style) => h(Text, { style: [s.p, style] }, children);
const Bullet = (text) =>
  h(View, { style: s.liRow }, h(View, { style: s.dot }), h(Text, { style: s.liText }, text));
const Step = (n, text) =>
  h(View, { style: s.liRow }, h(Text, { style: s.stepNum }, String(n)), h(Text, { style: s.liText }, text));

function Callout(kind, title, children) {
  const map = {
    tip: { c: GREEN, bg: "#EAF3EE" },
    warn: { c: AMBER, bg: "#FBF1DF" },
    info: { c: ACCENT, bg: SOFT },
  };
  const m = map[kind] ?? map.info;
  return h(
    View,
    { style: [s.callout, { borderLeftColor: m.c, backgroundColor: m.bg }], wrap: false },
    h(Text, { style: [s.calloutTitle, { color: m.c }] }, title),
    h(Text, {}, children),
  );
}

function SectionHeader(kicker, title) {
  return h(
    View,
    {},
    h(Text, { style: s.h1kicker }, kicker),
    h(Text, { style: s.h1 }, title),
    h(View, { style: s.h1rule }),
  );
}

function Module({ title, menu, purpose, steps, bullets, tip }) {
  return h(
    View,
    { style: s.card, wrap: false },
    h(
      View,
      { style: s.cardTitleRow },
      h(Text, { style: s.cardTitle }, title),
      menu ? h(Text, { style: s.cardMenu }, "grup " + menu) : null,
    ),
    purpose ? h(Text, { style: { marginBottom: 5 } }, purpose) : null,
    ...(steps ?? []).map((t, i) => Step(i + 1, t)),
    ...(bullets ?? []).map((t) => Bullet(t)),
    tip ? h(Text, { style: [s.muted, { marginTop: 4, fontSize: 9.5 }] }, tip) : null,
  );
}

const Furniture = () =>
  h(
    React.Fragment,
    {},
    h(
      View,
      { style: s.topbar, fixed: true },
      h(Text, { style: s.topbarBrand }, "SAVO OPS"),
      h(Text, { style: s.topbarText }, "Panduan Penggunaan"),
    ),
    h(
      View,
      { style: s.footer, fixed: true },
      h(Text, { style: s.footerText }, "SAVO - Frozen Food Bandung"),
      h(Text, {
        style: s.footerText,
        render: ({ pageNumber, totalPages }) => `Halaman ${pageNumber} dari ${totalPages}`,
      }),
    ),
  );

const contentPage = (...children) =>
  h(Page, { size: "A4", style: s.page }, Furniture(), ...children);

// =========================================================
// PAGES
// =========================================================

// Cover
const cover = h(
  Page,
  { size: "A4", style: s.cover },
  h(
    View,
    { style: { flex: 1, paddingHorizontal: 54, paddingTop: 150 } },
    h(Text, { style: { fontSize: 10, fontFamily: "Helvetica-Bold", color: AMBER, letterSpacing: 3 } }, "PANDUAN PENGGUNAAN"),
    h(Text, { style: { fontSize: 62, fontFamily: "Helvetica-Bold", color: ACCENT, marginTop: 8 } }, "SAVO OPS"),
    h(View, { style: { height: 3, width: 90, backgroundColor: ACCENT, marginTop: 14, marginBottom: 18 } }),
    h(Text, { style: { fontSize: 15, color: INK, maxWidth: 360 } }, "Dasbor operasional untuk penjualan, resep & HPP, produksi, stok, dan invoice."),
    h(Text, { style: { fontSize: 11, color: MUTED, marginTop: 26 } }, "Untuk pemilik & staf SAVO"),
    h(Text, { style: { fontSize: 11, color: MUTED, marginTop: 2 } }, "savo-ops.vercel.app"),
  ),
  h(
    View,
    { style: { paddingHorizontal: 54, paddingBottom: 46 } },
    h(View, { style: { height: 1, backgroundColor: BORDER, marginBottom: 10 } }),
    h(Text, { style: { fontSize: 9, color: MUTED } }, "SAVO - Premium homemade frozen food, Bandung. Sosis & bitterballen, 100% daging sapi Australia."),
    h(Text, { style: { fontSize: 9, color: MUTED, marginTop: 2 } }, "Edisi Juli 2026 - v1.0"),
  ),
);

// Page 2: Daftar isi + Sekilas + Masuk
const toc = [
  ["1. Sekilas & cara masuk", "2"],
  ["2. Alur kerja utama", "3"],
  ["3. Konsep penting: satuan & HPP", "4"],
  ["4. Panduan tiap menu", "5"],
  ["5. Mode Demo (latihan staf)", "8"],
  ["6. Tips harian & pertanyaan umum", "9"],
];

const page2 = contentPage(
  SectionHeader("Bagian 1", "Sekilas & Cara Masuk"),
  h(Text, { style: s.h2 }, "Daftar isi"),
  ...toc.map(([t, p]) =>
    h(View, { style: s.tocRow }, h(Text, {}, t), h(Text, { style: s.muted }, "Hal. " + p)),
  ),
  h(Text, { style: s.h2 }, "Apa itu SAVO Ops?"),
  P("Aplikasi internal untuk mengelola operasional SAVO: pesanan & pembayaran, invoice, resep dengan perhitungan HPP (modal) otomatis, serta stok bahan baku dan produk jadi. Semua dalam satu tempat, bisa dibuka dari HP maupun komputer. Hanya staf yang sudah login yang bisa membuka."),
  h(Text, { style: s.h2 }, "Cara masuk (login)"),
  Step(1, "Buka savo-ops.vercel.app di browser (Chrome disarankan). Bisa disimpan ke layar utama HP agar seperti aplikasi."),
  Step(2, "Masukkan email dan kata sandi, lalu tekan Masuk."),
  Step(3, "Untuk mengganti kata sandi, buka halaman /atur-sandi setelah login."),
  Callout("info", "Navigasi", "Di komputer, menu ada di sisi kiri (dikelompokkan: Utama, Katalog, Dapur, Lainnya). Di HP, menu utama ada di bawah layar, dan menu lengkap dibuka lewat tombol Menu."),
);

// Page 3: Alur kerja
const flowBox = (t) => h(View, { style: s.flowBox }, h(Text, { style: s.flowBoxText }, t));
const arrow = h(Text, { style: s.flowArrow }, ">");

const page3 = contentPage(
  SectionHeader("Bagian 2", "Alur Kerja Utama"),
  P("Data di SAVO Ops saling terhubung. Memahami alur ini membuat semua angka (stok, HPP, margin) selalu benar dengan sendirinya."),

  h(Text, { style: s.h2 }, "A. Menyiapkan resep & modal"),
  h(View, { style: s.flowRow }, flowBox("Bahan Baku"), arrow, flowBox("Resep & HPP"), arrow, flowBox("HPP + Margin")),
  Bullet("Isi Bahan Baku (harga beli & satuan) -> pakai di Resep -> HPP dan margin dihitung otomatis."),
  Bullet("Beli bahan lewat menu Pembelian: stok bertambah & modal rata-rata diperbarui otomatis."),

  h(Text, { style: s.h2 }, "B. Produksi (memasak)"),
  h(View, { style: s.flowRow }, flowBox("Masak"), arrow, flowBox("Catat Produksi"), arrow, flowBox("Stok Produk +"), arrow, flowBox("HPP nyata")),
  Bullet("Masak menghitung kebutuhan bahan untuk sejumlah batch."),
  Bullet("Catat Produksi mengurangi stok bahan, menambah stok produk jadi, dan menyimpan HPP nyata batch itu."),

  h(Text, { style: s.h2 }, "C. Penjualan"),
  h(View, { style: s.flowRow }, flowBox("Pelanggan"), arrow, flowBox("Pesanan"), arrow, flowBox("Pembayaran"), arrow, flowBox("Invoice")),
  Bullet("Buat Pesanan (harga otomatis sesuai tier pelanggan) -> stok produk berkurang saat status 'delivered/completed'."),
  Bullet("Catat Pembayaran -> status lunas otomatis -> buat & bagikan Invoice PDF."),

  Callout("info", "Menyeluruh", "Keuangan mencatat pengeluaran operasional, dan Laporan mengekspor semua ke Excel / Google Sheets. Asisten AI membantu merapikan penulisan data."),
);

// Page 4-5: Konsep satuan & HPP
const page4 = contentPage(
  SectionHeader("Bagian 3", "Konsep Penting: Satuan & HPP"),

  h(Text, { style: s.h2 }, "1. Satuan otomatis"),
  P("Saat menambah bahan, pilih satuan sesuai cara Anda membeli: kg atau g (berat), l atau ml (cairan), atau pcs. Aturannya sederhana: kalau beli per kilo, pilih kg; kalau harga tertulis per liter, pilih l."),
  P("Aplikasi menampilkan angka dalam satuan yang paling mudah dibaca secara otomatis. Anda tidak perlu menghitung sendiri:"),
  h(View, { style: s.exHead }, h(Text, { style: [s.exCellL, s.cellHead] }, "Yang tersimpan"), h(Text, { style: [s.exCellR, s.cellHead] }, "Yang tampil")),
  ...[
    ["Pemakaian resep 0,2 kg", "200 g"],
    ["Stok 1.500 g", "1,5 kg"],
    ["Pemakaian 0,1 l", "100 ml"],
  ].map(([a, b]) =>
    h(View, { style: s.exRow }, h(Text, { style: s.exCellL }, a), h(Text, { style: [s.exCellR, s.strong] }, b)),
  ),
  Callout("tip", "Praktis", "Di resep Bitterballen, tulis butter 0,3 (kg) - aplikasi otomatis menampilkannya sebagai 300 g. Tidak ada lagi angka '0 kg' yang membingungkan."),

  h(Text, { style: s.h2 }, "2. Modal bahan = rata-rata tertimbang"),
  P("Kalau harga beli berubah, modal bahan tidak langsung loncat ke harga terbaru, tapi dicampur dengan stok yang masih ada - supaya adil dan tetap terhubung dengan stok lama."),
  Callout("info", "Contoh", "Sisa stok 2 kg dengan modal Rp 100.000/kg, lalu beli 3 kg @ Rp 120.000/kg. Modal baru = (2x100.000 + 3x120.000) / 5 = Rp 112.000/kg. HPP otomatis memakai Rp 112.000."),
  P([ "Di daftar Bahan Baku muncul ", h(Text, { style: s.strong }, "modal Rp X"), " (dipakai untuk HPP) dan ", h(Text, { style: s.strong }, "beli terakhir"), " (info harga terakhir). Mengubah harga secara manual di form bahan dianggap koreksi sadar dan me-reset modal rata-rata." ]),
);

const page5 = contentPage(
  h(Text, { style: s.h2 }, "3. HPP standar vs HPP efektif (nyata)"),
  P("Ini kunci yang sering jadi pertanyaan. Ada dua angka, dan keduanya sengaja dipisah:"),
  Module({
    title: "HPP standar",
    purpose: "Pijakan harga jual. Dihitung dari resep: total biaya bahan + overhead, dibagi 'Hasil per batch' standar. Tidak berubah sendiri - Anda yang menentukan.",
  }),
  Module({
    title: "HPP efektif (nyata)",
    purpose: "Angka utama yang tampil di menu Resep. Otomatis mengikuti kenyataan dapur: rata-rata HPP nyata dari produksi-produksi terakhir. Kalau resep belum pernah diproduksi, otomatis memakai HPP standar.",
  }),
  P("Margin dan saran harga jual dihitung dari HPP efektif, jadi sinyal untung/rugi Anda selalu berbasis kenyataan (hasil batch yang berubah-ubah, harga bahan terkini)."),
  Callout("warn", "Kenapa penting", "Contoh nyata SAVO: dengan HPP standar, RTH Saikoro tampak RUGI (margin -5%). Padahal kenyataannya 1 batch jadi 3 pack, sehingga HPP nyata jauh lebih rendah dan margin sebenarnya +35%. HPP efektif menangkap ini otomatis."),
  Callout("tip", "Kapan mengubah standar", "Jika 'Hasil nyata / batch' di kartu Realisasi Produksi konsisten berbeda jauh dari standar (mis. Bitterballen nyatanya rata-rata 14,5 bukan 15), ubah 'Hasil per batch' di Detail Resep - sekali saja - agar standar ikut menyesuaikan."),
  h(Text, { style: s.h2 }, "Alur harian yang disarankan" ),
  Step(1, "Setiap selesai masak, catat produksi + isi 'Hasil jadi' yang sebenarnya."),
  Step(2, "HPP, margin, dan saran harga di menu Resep otomatis mengikuti."),
  Step(3, "Sesekali cek kartu Realisasi Produksi; koreksi standar bila perlu."),
);

// Page 6-7-8: Panduan tiap menu
const page6 = contentPage(
  SectionHeader("Bagian 4", "Panduan Tiap Menu"),
  Module({
    title: "Dasbor", menu: "Utama",
    purpose: "Ringkasan operasional. Menampilkan penjualan hari ini & bulan ini, pesanan berjalan, invoice belum lunas, jumlah produk & bahan, produk terlaris, dan alert stok menipis.",
    bullets: ["Tekan kartu mana pun untuk langsung ke menu terkait."],
  }),
  Module({
    title: "Produk", menu: "Katalog",
    purpose: "Daftar produk jadi (SKU) yang dijual.",
    steps: ["Tekan Tambah untuk membuat produk: nama, kategori, satuan jual (pack/pcs/box), harga B2C & B2B, stok, stok minimum, foto.", "Stok produk bertambah otomatis saat Produksi dicatat, dan berkurang saat pesanan berstatus delivered/completed."],
  }),
  Module({
    title: "Bahan Baku", menu: "Katalog",
    purpose: "Bahan mentah untuk resep.",
    steps: ["Tambah bahan: nama, satuan (kg/g/l/ml/pcs - sesuai cara beli), stok, stok minimum, harga beli, supplier.", "Baris bahan menampilkan modal (dasar HPP) dan harga beli terakhir."],
    tip: "Stok di bawah minimum akan muncul sebagai alert di Dasbor.",
  }),
  Module({
    title: "Pembelian", menu: "Dapur",
    purpose: "Catat pembelian bahan baku dari supplier.",
    steps: ["Tambah item (bisa bahan lama atau bahan baru langsung), isi jumlah & harga beli.", "Simpan: stok bertambah, harga beli terakhir diperbarui, dan modal rata-rata dihitung ulang otomatis."],
  }),
);

const page7 = contentPage(
  Module({
    title: "Resep & HPP", menu: "Katalog",
    purpose: "Resep standar per produk beserta perhitungan HPP & margin.",
    steps: ["Buat resep: pilih produk, isi bahan + jumlah (dalam satuan bahan), overhead per batch, dan 'Hasil per batch' (standar).", "Halaman resep menampilkan HPP per unit (efektif), margin, dan saran harga dari target margin.", "Kartu Realisasi Produksi membandingkan hasil & HPP nyata dengan standar."],
    tip: "Label (nyata)/(standar) di daftar resep menunjukkan sumber angka HPP.",
  }),
  Module({
    title: "Masak", menu: "Dapur",
    purpose: "Kalkulator kebutuhan bahan untuk produksi.",
    steps: ["Pilih resep, masukkan jumlah batch (atau target hasil).", "Lihat total kebutuhan tiap bahan + status cukup/kurang + estimasi biaya.", "Tekan Catat Produksi dan isi 'Hasil jadi' yang sebenarnya -> stok bahan berkurang, stok produk bertambah, HPP nyata tersimpan."],
  }),
  Module({
    title: "Produksi", menu: "Dapur",
    purpose: "Riwayat semua produksi yang tercatat.",
    steps: ["Buka satu catatan untuk mengubah jumlah batch, hasil jadi, tanggal, atau catatan.", "Menghapus/mengubah catatan tidak otomatis mengembalikan stok (barang sudah benar-benar dibuat)."],
  }),
  Module({
    title: "Pelanggan", menu: "Lainnya",
    purpose: "Data pelanggan B2C & B2B.",
    bullets: ["Tier harga menentukan harga default saat membuat pesanan.", "Termin pembayaran menentukan jatuh tempo invoice."],
  }),
  Module({
    title: "Pesanan", menu: "Utama",
    purpose: "Buat & kelola pesanan penjualan.",
    steps: ["Pilih pelanggan (harga otomatis sesuai tier), tambah item, isi diskon/ongkir/pajak bila ada.", "Ubah status: draft > confirmed > in_production > ready > delivered > completed.", "Stok produk berkurang otomatis saat status delivered/completed."],
  }),
);

const page8 = contentPage(
  Module({
    title: "Pembayaran", menu: "Utama",
    purpose: "Catat pembayaran manual atas pesanan.",
    steps: ["Isi jumlah, metode (tunai/transfer/QRIS), tanggal, dan referensi.", "Status lunas / sebagian / belum lunas dihitung otomatis dari total pembayaran."],
  }),
  Module({
    title: "Invoice", menu: "Utama",
    purpose: "Buat invoice PDF dari pesanan.",
    steps: ["Buat invoice dari sebuah pesanan.", "Unduh PDF, atau gunakan tombol bagikan WhatsApp (menyiapkan pesan; file PDF dilampirkan manual)."],
    tip: "Header invoice memakai Profil Bisnis di menu Pengaturan.",
  }),
  Module({
    title: "Keuangan", menu: "Lainnya",
    purpose: "Catat pengeluaran operasional & lihat ringkasan sederhana pemasukan vs pengeluaran bulan ini.",
  }),
  Module({
    title: "Laporan", menu: "Lainnya",
    purpose: "Ekspor & impor data.",
    bullets: ["Ekspor Excel: produk, bahan, pelanggan, pesanan, pembayaran, laporan.", "Impor Excel (produk/bahan/pelanggan) lewat template + pratinjau sebelum disimpan.", "Sinkron dua arah Google Sheets bila sudah dihubungkan."],
  }),
  Module({
    title: "Asisten AI", menu: "Lainnya",
    purpose: "Merapikan penulisan data secara massal (Produk/Bahan/Pelanggan).",
    bullets: ["AI mengusulkan perbaikan (kapitalisasi, salah ketik, penulisan tidak konsisten); Anda pilih & terapkan.", "Perlu API key Google Gemini gratis (opsional) - petunjuk setup ada di halaman itu."],
  }),
  Module({
    title: "Pengaturan", menu: "Lainnya",
    purpose: "Profil bisnis untuk invoice, serta tombol Mulai/Akhiri Mode Demo.",
  }),
);

// Page 9: Mode Demo
const page9 = contentPage(
  SectionHeader("Bagian 5", "Mode Demo (Latihan Staf)"),
  P("Mode Demo adalah ruang latihan untuk melatih staf baru tanpa risiko apa pun ke data asli. Seluruh aplikasi berjalan normal, tetapi semua yang dibuat hanya untuk latihan dan akan dihapus."),
  h(Text, { style: s.h2 }, "Cara memakai"),
  Step(1, "Buka Pengaturan > kartu 'Mode Demo (Latihan)' > tekan Mulai Mode Demo."),
  Step(2, "Muncul banner oranye 'MODE DEMO' di atas layar. Latihan bebas: buat pesanan, catat masak/produksi, pembelian, bahkan cetak invoice."),
  Step(3, "Selesai: tekan Akhiri Demo di banner (atau di Pengaturan). Semua data latihan dihapus, aplikasi kembali ke data asli."),
  h(Text, { style: s.h2 }, "Kenapa aman 100%"),
  Bullet("Mode demo berjalan di 'dunia data' terpisah - data asli tidak bisa tersentuh, bahkan bila salah pencet."),
  Bullet("Saat mulai, dunia latihan diisi salinan produk, bahan, resep & pelanggan saat ini, jadi latihannya realistis."),
  Bullet("Nomor pesanan/invoice latihan punya urutan sendiri - tidak memajukan nomor asli."),
  Bullet("Sinkron Google Sheets otomatis nonaktif selama demo."),
  Bullet("Jaring pengaman: mode demo kedaluwarsa sendiri setelah 12 jam bila lupa diakhiri."),
  Callout("warn", "Catatan", "Data latihan memang sengaja dihapus setiap demo berakhir - itu tujuan modenya. Jangan memasukkan data asli yang penting saat Mode Demo aktif. Ruang latihan bersifat bersama: bila dua staf demo bersamaan, mereka berbagi ruang yang sama."),
);

// Page 10: Tips & FAQ
const faq = [
  ["Kenapa sebuah produk tampak rugi (margin minus)?", "Cek apakah sudah ada produksi tercatat. HPP efektif mengikuti hasil nyata; sebelum ada produksi, angka memakai standar resep yang mungkin belum akurat."],
  ["Angka stok menjadi minus?", "Berarti pemakaian melebihi stok tercatat. Catat pembelian bahan tersebut agar stok kembali sesuai kenyataan."],
  ["Bagaimana mengganti kata sandi?", "Setelah login, buka halaman /atur-sandi."],
  ["Bahan baru harganya berbeda dari sebelumnya?", "Cukup catat lewat Pembelian - modal rata-rata & HPP menyesuaikan otomatis."],
  ["Data latihan hilang setelah demo?", "Ya, itu memang perilaku Mode Demo. Data asli tidak terpengaruh."],
];

const page10 = contentPage(
  SectionHeader("Bagian 6", "Tips Harian & Pertanyaan Umum"),
  h(Text, { style: s.h2 }, "Kebiasaan baik harian"),
  Bullet("Catat pembelian bahan begitu barang datang - stok & modal selalu akurat."),
  Bullet("Catat produksi tepat setelah masak, dengan hasil jadi yang sebenarnya."),
  Bullet("Perbarui status pesanan sampai delivered/completed agar stok terpotong benar."),
  Bullet("Cek Dasbor tiap pagi untuk alert stok menipis & invoice belum lunas."),
  h(Text, { style: s.h2 }, "Pertanyaan umum"),
  ...faq.map(([q, a]) =>
    h(View, { style: { marginBottom: 8 }, wrap: false },
      h(Text, { style: s.strong }, "T: " + q),
      h(Text, { style: s.muted }, "J: " + a),
    ),
  ),
  h(View, { style: { marginTop: 14, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 10 } },
    h(Text, { style: [s.muted, { fontSize: 9 }] }, "Panduan ini mengikuti versi aplikasi saat dibuat (Juli 2026). Bila ada menu yang tampak berbeda, aplikasi mungkin sudah diperbarui - alur dan konsep di atas tetap berlaku."),
  ),
);

const doc = h(
  Document,
  { title: "Panduan Penggunaan SAVO Ops", author: "SAVO Ops", language: "id" },
  cover, page2, page3, page4, page5, page6, page7, page8, page9, page10,
);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(__dirname, "..", "docs", "Panduan-Penggunaan-SAVO-Ops.pdf");

await renderToFile(doc, out);
console.log("PDF dibuat:", out);
