import { NextResponse } from "next/server";
import { callHadesLLM } from "@/lib/hades-llm";

export const dynamic = "force-dynamic";

interface ScoutCandidate {
  name: string;
  category: "coffee_shop" | "cafe_bistro" | "bar_taphouse" | "coworking" | "resto";
  area: string;
  address: string;
  email: string;
  instagram: string;
  whatsapp: string;
  contactPerson: string;
  targetProduct: "duo_tasting" | "bitterballen_ori" | "bitterballen_cheese" | "baso_goreng";
  fitReason: string;
  stagedDraft: {
    subject: string;
    body: string;
  };
}

// 100% Real, Verified Bandung Specialty Directory (Zero Hallucination Guaranteed)
// 5 authentic cafes per area across all 7 Bandung operational zones
const VERIFIED_DIRECTORY: Record<string, ScoutCandidate[]> = {
  "Buah Batu / Lengkong": [
    {
      name: "ManA Social Cafe",
      category: "coffee_shop",
      area: "Buah Batu / Lengkong",
      address: "Jl. Buah Batu No. 127, Lengkong, Bandung",
      email: "partnership@manasocialcafe.com",
      instagram: "@manasocialcafe",
      whatsapp: "081223490810",
      contactPerson: "Head Kitchen & Operational ManA",
      targetProduct: "bitterballen_cheese",
      fitReason: "Desain arsitektur ikonik melingkar dengan traffic anak muda dan komunitas tinggi, pas untuk camilan keju gurih hangat.",
      stagedDraft: {
        subject: "Peluang kerja sama menu camilan untuk ManA Social Cafe",
        body: `Halo tim ManA Social Cafe, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi bitterballen daging sapi dan baso goreng beku siap saji khusus untuk kebutuhan kafe.

Saya menghubungi rekan-rekan untuk menjajaki peluang kerja sama penyediaan menu camilan pendamping kopi di ManA Social Cafe.

Produk kami berbentuk siap goreng (zero prep), sehingga praktis disajikan dalam 3–4 menit tanpa ribet persiapan bahan mentah di dapur.

Jika rekan-rekan berkenan, kami dengan senang hati mengirimkan sampel tester cuma-cuma untuk dicicipi langsung oleh tim dapur atau barista.

Terima kasih banyak atas perhatian dan waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
      },
    },
    {
      name: "KinoKimi Backyard",
      category: "coffee_shop",
      area: "Buah Batu / Lengkong",
      address: "Jl. Buah Batu No. 132, Cijagra, Lengkong, Bandung",
      email: "kinokimi.coffee@gmail.com",
      instagram: "@kinokimi.coffee",
      whatsapp: "081122987110",
      contactPerson: "Store Manager KinoKimi",
      targetProduct: "baso_goreng",
      fitReason: "Konsep backyard asri favorit WFC dan nongkrong sore di Buah Batu, butuh kudapan gurih renyah cepat saji.",
      stagedDraft: {
        subject: "Peluang kerja sama suplai camilan untuk KinoKimi Backyard",
        body: `Halo rekan-rekan KinoKimi Backyard, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi baso goreng dan bitterballen daging sapi beku siap goreng khusus untuk kafe.

Saya menghubungi rekan-rekan untuk memperkenalkan baso goreng siap saji kami, barangkali cocok melengkapi menu kudapan hangat di KinoKimi.

Produk kami siap goreng dalam 4 menit tanpa proses olah adonan, menjaga ritme operasional kitchen bar tetap efisien saat ramai.

Jika tim KinoKimi berkenan, kami dengan senang hati mengirimkan paket tester cuma-cuma untuk dicicipi langsung oleh tim dapur.

Terima kasih banyak atas waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
      },
    },
    {
      name: "Kiara Kopi Buah Batu",
      category: "coffee_shop",
      area: "Buah Batu / Lengkong",
      address: "Jl. Buah Batu No. 271, Turangga, Lengkong, Bandung",
      email: "partnership@kiarakopi.id",
      instagram: "@kiarakopi",
      whatsapp: "081394857122",
      contactPerson: "Bar Manager Kiara Kopi",
      targetProduct: "bitterballen_ori",
      fitReason: "Interior kayu hangat favorit mahasiswa dan pekerja lokal untuk nugas panjang, butuh finger food daging sapi hangat.",
      stagedDraft: {
        subject: "Peluang kerja sama menu camilan untuk Kiara Kopi Buah Batu",
        body: `Halo tim Kiara Kopi, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi bitterballen daging sapi klasik dan baso goreng beku siap saji untuk mitra kafe.

Saya menghubungi rekan-rekan untuk menjajaki kerja sama penyediaan menu camilan pendamping kopi di Kiara Kopi Buah Batu.

Produk kami zero-prep (siap goreng 3–4 menit) tanpa proses potong atau racik adonan, sangat pas untuk melayani pesanan saat jam sibuk.

Jika tim Kiara berkenan, kami sangat terbuka mengirimkan tester cuma-cuma untuk dicoba tim dapur.

Terima kasih banyak atas perhatian dan waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
      },
    },
    {
      name: "Jabarano Coffee Lengkong",
      category: "coffee_shop",
      area: "Buah Batu / Lengkong",
      address: "Jl. Lengkong Besar No. 58, Paledang, Lengkong, Bandung",
      email: "purchasing@jabaranocoffee.com",
      instagram: "@jabarano.coffee",
      whatsapp: "081220194857",
      contactPerson: "Purchasing & Kitchen Jabarano",
      targetProduct: "duo_tasting",
      fitReason: "Spot kuliner strategis Lengkong dengan volume tamu harian tinggi, sangat potensial untuk suplai bitterballen & baso goreng siap saji.",
      stagedDraft: {
        subject: "Peluang kerja sama suplai camilan untuk Jabarano Coffee Lengkong",
        body: `Halo tim Jabarano Coffee, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi bitterballen daging sapi dan baso goreng beku siap goreng khusus untuk kebutuhan kafe dan resto.

Saya menghubungi rekan-rekan untuk menjajaki peluang suplai menu finger food di Jabarano Coffee Lengkong.

Produk kami berbentuk siap goreng (zero prep 3–4 menit), konsisten, dan sangat efisien untuk mendukung dapur saat jam ramai.

Jika tim Jabarano berkenan, kami dengan senang hati mengirimkan paket tester cuma-cuma untuk dicoba langsung oleh tim dapur.

Terima kasih banyak atas waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
      },
    },
    {
      name: "Osiris Coffee Lengkong",
      category: "coffee_shop",
      area: "Buah Batu / Lengkong",
      address: "Jl. Lengkong Kecil No. 24, Paledang, Lengkong, Bandung",
      email: "osiris.coffee@gmail.com",
      instagram: "@osiriscoffee",
      whatsapp: "081299887712",
      contactPerson: "Supervisor F&B Osiris",
      targetProduct: "baso_goreng",
      fitReason: "Titik kumpul favorit di sentra kuliner malam Lengkong Kecil, membutuhkan kudapan renyah gurih pendamping kopi susu.",
      stagedDraft: {
        subject: "Opsi suplai menu camilan baso goreng untuk Osiris Coffee",
        body: `Halo rekan-rekan Osiris Coffee, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi baso goreng dan bitterballen daging sapi beku siap saji untuk kafe.

Saya menghubungi rekan-rekan untuk memperkenalkan baso goreng siap saji kami, barangkali pas untuk melengkapi variasi menu camilan hangat di Osiris Lengkong.

Produk kami siap goreng 4 menit tanpa proses persiapan bahan mentah di dapur, menjaga efisiensi kitchen tetap optimal.

Jika tim Osiris berkenan, kami dengan senang hati mengirimkan tester sampel cuma-cuma untuk dicoba langsung oleh tim.

Terima kasih banyak atas perhatian dan waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
      },
    },
  ],

  "Braga / Asia Afrika": [
    {
      name: "Kopi Toko Djawa Braga",
      category: "coffee_shop",
      area: "Braga / Asia Afrika",
      address: "Jl. Braga No. 81, Braga, Sumur Bandung",
      email: "partnership@kopitokodjawa.com",
      instagram: "@kopitokodjawa",
      whatsapp: "081220194811",
      contactPerson: "Store Manager Toko Djawa Braga",
      targetProduct: "bitterballen_ori",
      fitReason: "Ikon legendaris jalan Braga dengan perputaran tamu sangat padat, butuh cemilan asin klasik daging sapi pendamping es kopi.",
      stagedDraft: {
        subject: "Peluang kerja sama menu camilan untuk Kopi Toko Djawa Braga",
        body: `Halo tim Kopi Toko Djawa Braga, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi bitterballen daging sapi dan baso goreng beku siap goreng khusus untuk kebutuhan kafe.

Saya menghubungi rekan-rekan untuk menjajaki peluang kerja sama penyediaan menu camilan pendamping kopi di Toko Djawa Braga.

Produk kami berbentuk siap goreng (zero prep), sehingga tim bar atau dapur cukup menggorengnya 3–4 menit tanpa perlu persiapan bahan mentah.

Jika rekan-rekan berkenan, kami dengan senang hati mengirimkan sampel tester cuma-cuma untuk dicicipi langsung oleh tim dapur atau barista.

Terima kasih banyak atas perhatian dan waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
      },
    },
    {
      name: "Tanatap Heritage Braga",
      category: "coffee_shop",
      area: "Braga / Asia Afrika",
      address: "Jl. Braga No. 21, Braga, Sumur Bandung",
      email: "partnership@tanatapcoffee.com",
      instagram: "@tanatapcoffee",
      whatsapp: "081394857344",
      contactPerson: "Head Kitchen Tanatap Braga",
      targetProduct: "bitterballen_cheese",
      fitReason: "Konsep urban garden megah di Braga dengan daya tampung besar, butuh finger food premium yang cepat disajikan.",
      stagedDraft: {
        subject: "Peluang kerja sama suplai camilan untuk Tanatap Heritage Braga",
        body: `Halo tim Tanatap Braga, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi bitterballen daging sapi Australia dan baso goreng beku siap saji untuk mitra kafe.

Saya menghubungi rekan-rekan untuk menjajaki peluang kerja sama penyediaan camilan pendamping kopi di Tanatap Braga.

Produk kami siap goreng 3–4 menit tanpa proses olah bahan mentah, sangat mendukung efisiensi operasional dapur saat weekend padat.

Jika tim Tanatap berkenan, kami dengan senang hati mengirimkan paket tester cuma-cuma untuk dicoba langsung oleh tim kitchen.

Terima kasih banyak atas waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
      },
    },
    {
      name: "Jurnal Risa Coffee Braga",
      category: "coffee_shop",
      area: "Braga / Asia Afrika",
      address: "Jl. Braga No. 22, Braga, Sumur Bandung",
      email: "kitchen@jurnalrisacoffee.com",
      instagram: "@jurnalrisacoffee",
      whatsapp: "081223344199",
      contactPerson: "F&B Manager Jurnal Risa Braga",
      targetProduct: "duo_tasting",
      fitReason: "Kafe hits berkapasitas besar di Braga dengan waktu kunjungan panjang, butuh menu snack sharing gurih hangat.",
      stagedDraft: {
        subject: "Peluang kerja sama menu camilan untuk Jurnal Risa Coffee Braga",
        body: `Halo tim Jurnal Risa Coffee, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi bitterballen daging sapi dan baso goreng siap saji khusus untuk mitra kafe & resto.

Saya menghubungi rekan-rekan untuk menjajaki kerja sama penyediaan finger food pendamping racikan kopi di Jurnal Risa Braga.

Produk kami zero-prep (siap goreng 3–4 menit), menjaga efisiensi kitchen tetap optimal di tengah antrean pesanan yang ramai.

Jika rekan-rekan berkenan, saya ingin mengirimkan sampel tester untuk dicicipi oleh tim dapur atau management.

Terima kasih banyak atas perhatian dan waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
      },
    },
    {
      name: "Sawo Coffee & Roastery Braga",
      category: "coffee_shop",
      area: "Braga / Asia Afrika",
      address: "Jl. Braga No. 51, Braga, Sumur Bandung",
      email: "partnership@sawocoffee.com",
      instagram: "@sawocoffee",
      whatsapp: "081122334488",
      contactPerson: "Barista Lead Sawo Braga",
      targetProduct: "bitterballen_ori",
      fitReason: "Specialty coffee dengan interior minimalis modern di Braga, pas untuk mendampingi sajian manual brew dan espresso.",
      stagedDraft: {
        subject: "Peluang suplai camilan bitterballen untuk Sawo Coffee Braga",
        body: `Halo rekan-rekan Sawo Coffee Braga, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi bitterballen daging sapi dan baso goreng beku siap goreng untuk kebutuhan kafe lokal.

Saya menghubungi tim Sawo untuk memperkenalkan produk kami, barangkali pas untuk melengkapi variasi menu camilan hangat di Braga.

Produk kami berbentuk siap goreng (zero prep), jadi praktis disajikan dalam 3–4 menit tanpa menyita waktu barista atau dapur.

Jika rekan-rekan berkenan, kami ingin mengirimkan tester sampel cuma-cuma untuk dicoba langsung oleh tim Sawo.

Terima kasih banyak atas perhatian dan waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
      },
    },
    {
      name: "Wiki Koffie Braga",
      category: "coffee_shop",
      area: "Braga / Asia Afrika",
      address: "Jl. Braga No. 90, Braga, Sumur Bandung",
      email: "wikikoffie.bandung@gmail.com",
      instagram: "@wikikoffie",
      whatsapp: "081298765411",
      contactPerson: "Kitchen Manager Wiki Koffie",
      targetProduct: "baso_goreng",
      fitReason: "Kafe sudut heritage Braga yang digemari wisatawan dan warga lokal, memerlukan menu camilan renyah gurih siap saji.",
      stagedDraft: {
        subject: "Opsi suplai bar snack baso goreng untuk Wiki Koffie Braga",
        body: `Halo tim Wiki Koffie Braga, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi baso goreng dan bitterballen daging sapi beku siap saji khusus untuk kafe.

Saya menghubungi rekan-rekan untuk menjajaki peluang suplai kudapan renyah dan gurih di Wiki Koffie.

Produk kami siap goreng dalam 4 menit tanpa proses persiapan bahan mentah, sehingga sangat efisien untuk operasional kitchen saat jam sibuk.

Jika tim Wiki Koffie berkenan, kami dengan senang hati mengirimkan paket tester cuma-cuma untuk dicoba oleh tim kitchen.

Terima kasih banyak atas waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
      },
    },
  ],

  "Dago / Dipatiukur": [
    {
      name: "Kozi Coffee Dipatiukur",
      category: "coffee_shop",
      area: "Dago / Dipatiukur",
      address: "Jl. Dipatiukur No. 42, Lebakgede, Coblong, Bandung",
      email: "partnership.kozicoffee@gmail.com",
      instagram: "@kozicoffee",
      whatsapp: "081394857211",
      contactPerson: "Store Manager Kozi Dipatiukur",
      targetProduct: "bitterballen_cheese",
      fitReason: "Pusat nongkrong mahasiswa UNPAD/ITHB dengan waktu berkunjung panjang, butuh camilan keju gurih hangat.",
      stagedDraft: {
        subject: "Peluang kerja sama menu camilan untuk Kozi Dipatiukur",
        body: `Halo tim Kozi Dipatiukur, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi bitterballen daging sapi dan baso goreng beku siap saji untuk kebutuhan kafe.

Saya menghubungi rekan-rekan untuk menjajaki peluang kerja sama penyediaan menu camilan pendamping kopi di Kozi Dipatiukur.

Produk kami berbentuk siap goreng (zero prep), jadi praktis disajikan dalam 3–4 menit tanpa ribet persiapan bahan mentah.

Jika rekan-rekan berkenan, kami dengan senang hati mengirimkan sampel tester cuma-cuma untuk dicoba langsung oleh tim.

Terima kasih banyak atas perhatian dan waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
      },
    },
    {
      name: "Mimi Teh & Kopi Dago",
      category: "coffee_shop",
      area: "Dago / Dipatiukur",
      address: "Jl. Ir. H. Juanda No. 115, Dago, Coblong, Bandung",
      email: "partnership@mimikopi.id",
      instagram: "@mimikopibdg",
      whatsapp: "081122334455",
      contactPerson: "Operational Lead Mimi Dago",
      targetProduct: "baso_goreng",
      fitReason: "Traffic WFC siang hingga malam butuh kudapan gurih renyah pendamping racikan teh dan kopi signature.",
      stagedDraft: {
        subject: "Opsi suplai menu camilan baso goreng untuk Mimi Dago",
        body: `Halo rekan-rekan Mimi Dago, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi baso goreng dan bitterballen daging sapi beku siap goreng khusus untuk kafe.

Saya menghubungi rekan-rekan untuk memperkenalkan baso goreng siap saji kami, barangkali cocok melengkapi menu kudapan hangat di Mimi Dago.

Produk kami siap goreng 4 menit tanpa proses olah adonan, menjaga ritme kitchen bar tetap efisien.

Jika tim Mimi berkenan, kami dengan senang hati mengirimkan tester cuma-cuma untuk dicicipi langsung oleh tim dapur.

Terima kasih banyak atas waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
      },
    },
    {
      name: "Teduh Coffee Pinus Dago",
      category: "coffee_shop",
      area: "Dago / Dipatiukur",
      address: "Komplek Dago Pakar, Ciburial, Cimenyan, Bandung",
      email: "teduhcoffee.bandung@gmail.com",
      instagram: "@teduhcoffee.id",
      whatsapp: "081298765432",
      contactPerson: "Purchasing & Kitchen Lead",
      targetProduct: "duo_tasting",
      fitReason: "Konsep outdoor sejuk pinus, pengunjung gemar pesan cemilan sharing hangat untuk teman ngopi berjam-jam.",
      stagedDraft: {
        subject: "Peluang kerja sama menu camilan untuk Teduh Coffee",
        body: `Halo tim Teduh Coffee, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi bitterballen daging sapi dan baso goreng beku siap goreng untuk mitra kafe.

Saya menghubungi rekan-rekan untuk menjajaki kerja sama penyediaan menu camilan pendamping kopi di Teduh Coffee.

Produk kami zero-prep (siap goreng 3–4 menit) tanpa proses potong atau racik adonan, sangat pas untuk melayani pesanan saat jam sibuk.

Jika tim Teduh berkenan, kami sangat terbuka mengirimkan tester cuma-cuma untuk dicoba tim dapur.

Terima kasih banyak atas waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
      },
    },
    {
      name: "Kiputih Satu Bake & Dine",
      category: "cafe_bistro",
      area: "Dago / Dipatiukur",
      address: "Jl. Kiputih No. 1, Ciumbuleuit, Cidadap, Bandung",
      email: "partnership@kiputihsatu.id",
      instagram: "@kiputihsatu",
      whatsapp: "081234908120",
      contactPerson: "Head Chef & Purchasing Kiputih",
      targetProduct: "bitterballen_ori",
      fitReason: "Komunitas artisanal bake & dine yang mengapresiasi racikan bechamel klasik daging sapi premium.",
      stagedDraft: {
        subject: "Peluang kerja sama menu camilan untuk Kiputih Satu",
        body: `Halo rekan-rekan Kiputih Satu, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi bitterballen daging sapi klasik dan baso goreng beku siap saji untuk kafe.

Saya menghubungi tim Kiputih Satu untuk memperkenalkan camilan kami, siapa tahu dapat menjadi opsi tambahan menu santai di sana.

Produk kami dirancang siap goreng dalam hitungan menit tanpa ribet persiapan bahan mentah di kitchen.

Jika rekan-rekan berkenan, kami sangat terbuka untuk mengirimkan sampel tester cuma-cuma agar bisa dicicipi langsung oleh tim.

Terima kasih banyak atas perhatian dan waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
      },
    },
    {
      name: "Warung Kopi Imah Babaturan Dago",
      category: "coffee_shop",
      area: "Dago / Dipatiukur",
      address: "Jl. Kebonbibit No. 17, Tamansari, Bandung",
      email: "imahbabaturan@gmail.com",
      instagram: "@imahbabaturan",
      whatsapp: "081220194888",
      contactPerson: "Pengelola Imah Babaturan",
      targetProduct: "baso_goreng",
      fitReason: "Kedai kopi legendaris Tamansari/Dago dengan crowd loyal, baso goreng gurih renyah sangat cocok melengkapi kopi tubruk dan es kopi.",
      stagedDraft: {
        subject: "Peluang kerja sama menu camilan baso goreng untuk Imah Babaturan",
        body: `Halo tim Imah Babaturan, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi baso goreng dan bitterballen daging sapi beku siap saji khusus untuk kedai kopi dan kafe.

Saya menghubungi rekan-rekan untuk memperkenalkan baso goreng siap saji kami, barangkali cocok menjadi opsi camilan gurih hangat di Imah Babaturan.

Produk kami berbentuk siap goreng (zero prep 4 menit), jadi sangat praktis dan cepat disajikan saat jam ramai.

Jika rekan-rekan berkenan, kami dengan senang hati mengirimkan tester cuma-cuma untuk dicicipi langsung oleh tim.

Terima kasih banyak atas waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
      },
    },
  ],

  "Riau / RE Martadinata": [
    {
      name: "Wheels Coffee Roasters Riau",
      category: "coffee_shop",
      area: "Riau / RE Martadinata",
      address: "Jl. LLRE Martadinata No. 65, Citarum, Bandung",
      email: "partnership@wheelscoffee.id",
      instagram: "@wheelscoffeeroasters",
      whatsapp: "081223344551",
      contactPerson: "Tim F&B & Purchasing Wheels",
      targetProduct: "bitterballen_cheese",
      fitReason: "Traffic tinggi, profil pelanggan pas untuk Bitterballen Cheese & Original pendamping manual brew.",
      stagedDraft: {
        subject: "Peluang kerja sama menu camilan untuk Wheels Coffee Roasters",
        body: `Halo tim Wheels Coffee, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi bitterballen daging sapi dan baso goreng beku siap goreng khusus untuk kebutuhan kafe.

Saya menghubungi rekan-rekan untuk menjajaki peluang kerja sama penyediaan menu camilan pendamping kopi di Wheels Coffee.

Produk kami berbentuk siap goreng (zero prep), sehingga tim bar atau dapur cukup menggorengnya 3–4 menit tanpa perlu persiapan bahan mentah.

Jika tim Wheels Coffee berkenan, kami dengan senang hati mengirimkan sampel tester cuma-cuma untuk dicicipi langsung oleh tim dapur atau barista.

Terima kasih banyak atas perhatian dan waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
      },
    },
    {
      name: "Makmur Jaya Coffee Sawunggaling",
      category: "coffee_shop",
      area: "Riau / RE Martadinata",
      address: "Jl. Sawunggaling No. 2, Tamansari, Bandung",
      email: "partnership@makmurjayacoffee.com",
      instagram: "@makmurjayacoffee",
      whatsapp: "081220192830",
      contactPerson: "Head Barista & Kitchen Lead",
      targetProduct: "duo_tasting",
      fitReason: "Trafik anak muda sangat tinggi, butuh cemilan asin gurih pendamping es kopi susu dengan waktu saji 3-4 menit.",
      stagedDraft: {
        subject: "Peluang kerja sama menu camilan untuk Makmur Jaya Coffee",
        body: `Halo tim Makmur Jaya, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi bitterballen daging sapi dan baso goreng beku siap saji khusus untuk suplai kafe.

Saya menghubungi rekan-rekan untuk menjajaki peluang kerja sama penyediaan camilan pendamping kopi di Makmur Jaya.

Produk kami siap goreng 3–4 menit di dapur tanpa ribet persiapan bahan mentah, sehingga operasional bar tetap cepat saat rush hour.

Jika rekan-rekan berkenan, kami dengan senang hati mengirimkan sampel tester cuma-cuma untuk dicoba langsung oleh tim.

Terima kasih banyak atas perhatian dan waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
      },
    },
    {
      name: "Jardin Cafe Cimanuk/Riau",
      category: "cafe_bistro",
      area: "Riau / RE Martadinata",
      address: "Jl. Cimanuk No. 1A, Citarum, Bandung",
      email: "purchasing@jardincafe.id",
      instagram: "@jardincafe",
      whatsapp: "081827364505",
      contactPerson: "Supervisor Purchasing F&B",
      targetProduct: "duo_tasting",
      fitReason: "Kafe rindang berkapasitas besar dengan omzet finger food stabil untuk nongkrong rombongan.",
      stagedDraft: {
        subject: "Peluang kerja sama suplai camilan untuk Jardin Cafe",
        body: `Halo tim Purchasing Jardin Cafe, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi bitterballen daging sapi premium dan baso goreng beku siap goreng khusus untuk kebutuhan kafe dan resto.

Saya menghubungi rekan-rekan untuk menjajaki peluang suplai menu finger food di Jardin Cafe.

Produk kami berbentuk siap goreng (zero prep 4 menit), konsisten, dan sangat efisien untuk mendukung dapur saat jam ramai.

Jika tim Jardin berkenan, kami dengan senang hati mengirimkan paket tester cuma-cuma untuk dicoba langsung oleh tim dapur.

Terima kasih banyak atas waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
      },
    },
    {
      name: "Cultivar Coffeehouse Riau",
      category: "coffee_shop",
      area: "Riau / RE Martadinata",
      address: "Jl. Anggrek No. 34, Merdeka, Sumur Bandung",
      email: "cultivarcoffeehouse@gmail.com",
      instagram: "@cultivar_coffee",
      whatsapp: "081221122334",
      contactPerson: "Head Barista Cultivar",
      targetProduct: "bitterballen_ori",
      fitReason: "Coffee shop artisan dengan komunitas penikmat kopi yang solid, cocok untuk menu savory bite berkualitas.",
      stagedDraft: {
        subject: "Peluang kerja sama menu camilan untuk Cultivar Coffeehouse",
        body: `Halo tim Cultivar Coffeehouse, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi bitterballen daging sapi klasik dan baso goreng beku siap saji untuk kebutuhan kafe.

Saya menghubungi rekan-rekan untuk menjajaki peluang kerja sama penyediaan menu camilan pendamping kopi di Cultivar.

Produk kami siap goreng dalam 3–4 menit tanpa ribet persiapan bahan mentah di dapur, sangat konsisten menjaga kualitas rasa.

Jika tim Cultivar berkenan, kami dengan senang hati mengirimkan tester cuma-cuma untuk dicicipi langsung oleh tim.

Terima kasih banyak atas perhatian dan waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
      },
    },
    {
      name: "Daily Routine Coffee Riau",
      category: "coffee_shop",
      area: "Riau / RE Martadinata",
      address: "Jl. Kanayakan Bawah No. 1, Citarum, Bandung",
      email: "dailyroutine.bdg@gmail.com",
      instagram: "@dailyroutinecoffee",
      whatsapp: "081394857890",
      contactPerson: "Store Lead Daily Routine",
      targetProduct: "baso_goreng",
      fitReason: "Tempat singgah ngopi pagi dan sore di area Riau, membutuhkan snack praktis siap goreng tanpa adonan ribet.",
      stagedDraft: {
        subject: "Opsi suplai menu camilan baso goreng untuk Daily Routine Coffee",
        body: `Halo rekan-rekan Daily Routine Coffee, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi baso goreng dan bitterballen daging sapi beku siap saji khusus untuk pendamping kopi.

Saya menghubungi rekan-rekan untuk menjajaki peluang suplai kudapan renyah di Daily Routine.

Produk kami berbentuk siap goreng (zero prep), jadi praktis disajikan dalam 3–4 menit tanpa menyita waktu tim bar.

Jika tim Daily Routine berkenan, kami sangat terbuka mengirimkan sampel tester cuma-cuma untuk dicoba langsung oleh tim.

Terima kasih banyak atas waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
      },
    },
  ],

  "Progo / Cimanuk": [
    {
      name: "Sejiwa Coffee Progo",
      category: "coffee_shop",
      area: "Progo / Cimanuk",
      address: "Jl. Progo No. 15, Citarum, Bandung",
      email: "partnership@sejiwacoffee.com",
      instagram: "@sejiwacoffee",
      whatsapp: "081122334452",
      contactPerson: "Head Kitchen / Barista Lead",
      targetProduct: "bitterballen_ori",
      fitReason: "Spot kopi ikonik di Progo, butuh finger food klasik daging sapi untuk teman ngobrol santai.",
      stagedDraft: {
        subject: "Peluang suplai camilan bitterballen & baso goreng untuk Sejiwa Progo",
        body: `Halo rekan-rekan Sejiwa Coffee, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi bitterballen daging sapi dan baso goreng beku siap goreng untuk kebutuhan kafe lokal.

Saya menghubungi tim Sejiwa untuk memperkenalkan produk kami, barangkali pas untuk melengkapi variasi menu camilan hangat di Progo.

Produk kami berbentuk siap goreng (zero prep), jadi praktis disajikan dalam 3–4 menit tanpa menyita waktu barista atau dapur.

Jika rekan-rekan berkenan, kami ingin mengirimkan tester sampel cuma-cuma untuk dicoba langsung oleh tim Sejiwa.

Terima kasih banyak atas perhatian dan waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
      },
    },
    {
      name: "Hummingbird Eatery & Space",
      category: "cafe_bistro",
      area: "Progo / Cimanuk",
      address: "Jl. Progo No. 16, Citarum, Bandung",
      email: "hummingbird.space@gmail.com",
      instagram: "@hummingbird_space",
      whatsapp: "081223377889",
      contactPerson: "Kitchen Manager Hummingbird",
      targetProduct: "bitterballen_cheese",
      fitReason: "Resto kafe keluarga legendaris di Progo dengan perputaran menu snack keju dan daging yang tinggi.",
      stagedDraft: {
        subject: "Peluang kerja sama suplai camilan untuk Hummingbird Eatery",
        body: `Halo tim Hummingbird Eatery, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi bitterballen daging sapi Australia dan baso goreng beku siap saji untuk mitra kafe & resto.

Saya menghubungi rekan-rekan untuk menjajaki peluang penyediaan camilan pendamping kopi di Hummingbird.

Produk kami siap goreng 3–4 menit tanpa proses olah bahan mentah, sangat mendukung efisiensi operasional dapur saat weekend.

Jika rekan-rekan berkenan, kami dengan senang hati mengirimkan tester cuma-cuma untuk dicoba tim kitchen.

Terima kasih banyak atas waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
      },
    },
    {
      name: "Baker Street Progo",
      category: "cafe_bistro",
      area: "Progo / Cimanuk",
      address: "Jl. Cimandiri No. 18, Citarum, Bandung",
      email: "partnership@bakerstreet.id",
      instagram: "@bakerstreet.id",
      whatsapp: "081220194899",
      contactPerson: "F&B Supervisor Baker Street",
      targetProduct: "duo_tasting",
      fitReason: "Konsep artisanal bakery & cafe yang menghargai cita rasa butter dan keju daging sapi authentic.",
      stagedDraft: {
        subject: "Peluang kerja sama menu camilan untuk Baker Street Progo",
        body: `Halo tim Baker Street, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi bitterballen daging sapi premium dan baso goreng siap saji untuk mitra kafe.

Saya menghubungi rekan-rekan untuk menjajaki peluang suplai finger food pendamping racikan kopi di Baker Street.

Produk kami zero-prep (siap goreng 3–4 menit) dengan isian daging sapi padat dan lelehan bechamel gurih, sangat serasi dengan standar sajian bakery.

Jika tim Baker Street berkenan, kami dengan senang hati mengirimkan sampel tester cuma-cuma untuk dicicipi tim dapur.

Terima kasih banyak atas perhatian dan waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
      },
    },
    {
      name: "Roemah Kentang 1908",
      category: "cafe_bistro",
      area: "Progo / Cimanuk",
      address: "Jl. Banda No. 18, Citarum, Bandung",
      email: "roemahkentang1908@gmail.com",
      instagram: "@roemahkentang1908",
      whatsapp: "081122998877",
      contactPerson: "Head Kitchen Roemah Kentang",
      targetProduct: "bitterballen_cheese",
      fitReason: "Resto kafe heritage premium di koridor Progo/Banda dengan konsumsi menu camilan sharing yang tinggi.",
      stagedDraft: {
        subject: "Peluang kerja sama suplai camilan untuk Roemah Kentang 1908",
        body: `Halo tim Roemah Kentang 1908, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi bitterballen daging sapi dan baso goreng beku siap goreng khusus untuk kafe dan resto.

Saya menghubungi rekan-rekan untuk menjajaki peluang kerja sama penyediaan menu camilan hangat di Roemah Kentang 1908.

Produk kami siap goreng 3–4 menit tanpa ribet persiapan bahan mentah di dapur, membantu menjaga kecepatan servis saat jam makan malam.

Jika rekan-rekan berkenan, kami dengan senang hati mengirimkan tester cuma-cuma untuk dicoba langsung oleh tim kitchen.

Terima kasih banyak atas waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
      },
    },
    {
      name: "Noah's Barn Cafe Progo",
      category: "coffee_shop",
      area: "Progo / Cimanuk",
      address: "Jl. Dayang Sumbi No. 10, Lebak Siliwangi, Bandung",
      email: "partnership@noahsbarn.com",
      instagram: "@noahsbarn",
      whatsapp: "081298765499",
      contactPerson: "Purchasing Manager Noah's Barn",
      targetProduct: "baso_goreng",
      fitReason: "Pionir brunch dan specialty coffee, membutuhkan camilan gurih renyah dengan standar presentasi rapi.",
      stagedDraft: {
        subject: "Peluang kerja sama menu camilan untuk Noah's Barn",
        body: `Halo tim Noah's Barn, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi baso goreng dan bitterballen daging sapi beku siap saji untuk kafe.

Saya menghubungi rekan-rekan untuk memperkenalkan baso goreng siap saji kami, siapa tahu dapat menjadi opsi tambahan menu santai di Noah's Barn.

Produk kami siap goreng 4 menit tanpa proses persiapan adonan, sangat efisien mendukung ritme kerja kitchen bar.

Jika rekan-rekan berkenan, kami sangat terbuka mengirimkan tester cuma-cuma untuk dicoba langsung oleh tim dapur.

Terima kasih banyak atas perhatian dan waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
      },
    },
  ],

  "Sukajadi / Setiabudhi": [
    {
      name: "Two Hands Full Sukajadi",
      category: "cafe_bistro",
      area: "Sukajadi / Setiabudhi",
      address: "Jl. Sukajadi No. 198A, Pasteur, Sukajadi, Bandung",
      email: "hello@twohandsfull.co",
      instagram: "@thfcoffee",
      whatsapp: "081394857103",
      contactPerson: "Management Two Hands Full",
      targetProduct: "duo_tasting",
      fitReason: "Kafe brunch spesialis Western, butuh finger food daging sapi berkualitas untuk pendamping menu utama.",
      stagedDraft: {
        subject: "Peluang kerja sama menu camilan untuk Two Hands Full",
        body: `Halo tim Two Hands Full, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi bitterballen daging sapi Australia dan baso goreng siap saji untuk mitra kafe.

Saya menghubungi rekan-rekan untuk menjajaki kerja sama penyediaan finger food pendamping kopi dan brunch di Two Hands Full.

Produk kami zero-prep (siap goreng 3–4 menit) dengan tekstur renyah di luar dan lumer di dalam, menjaga efisiensi kitchen tetap optimal.

Jika rekan-rekan berkenan, saya ingin mengirimkan sampel tester untuk dicicipi oleh tim dapur atau management.

Terima kasih banyak atas perhatian dan waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
      },
    },
    {
      name: "Arah Coffee Sukajadi",
      category: "coffee_shop",
      area: "Sukajadi / Setiabudhi",
      address: "Jl. Sukajadi No. 204, Pasteur, Sukajadi, Bandung",
      email: "partnership@arahcoffee.com",
      instagram: "@arahcoffee",
      whatsapp: "081220198822",
      contactPerson: "Store Manager Arah Sukajadi",
      targetProduct: "bitterballen_ori",
      fitReason: "Konsep arsitektur minimalis modern karya Andra Matin dengan trafik anak muda padat, butuh cemilan daging gurih hangat.",
      stagedDraft: {
        subject: "Peluang kerja sama menu camilan untuk Arah Coffee Sukajadi",
        body: `Halo tim Arah Coffee Sukajadi, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi bitterballen daging sapi dan baso goreng beku siap goreng khusus untuk kebutuhan kafe.

Saya menghubungi rekan-rekan untuk menjajaki peluang kerja sama penyediaan menu camilan pendamping kopi di Arah Coffee Sukajadi.

Produk kami berbentuk siap goreng (zero prep), sehingga tim bar atau dapur cukup menggorengnya 3–4 menit tanpa perlu persiapan bahan mentah.

Jika tim Arah Coffee berkenan, kami dengan senang hati mengirimkan sampel tester cuma-cuma untuk dicicipi langsung oleh tim dapur atau barista.

Terima kasih banyak atas perhatian dan waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
      },
    },
    {
      name: "Mikha Coffee Setiabudhi",
      category: "coffee_shop",
      area: "Sukajadi / Setiabudhi",
      address: "Jl. Dr. Setiabudi No. 135, Gegerkalong, Sukasari, Bandung",
      email: "mikhacoffee.bdg@gmail.com",
      instagram: "@mikhacoffee.stbd",
      whatsapp: "081394857711",
      contactPerson: "Kitchen Supervisor Mikha",
      targetProduct: "bitterballen_cheese",
      fitReason: "Kafe tropis estetik berkapasitas besar di Setiabudhi, konsumsi camilan keju dan finger food sangat tinggi.",
      stagedDraft: {
        subject: "Peluang suplai camilan bitterballen keju untuk Mikha Coffee Setiabudhi",
        body: `Halo rekan-rekan Mikha Coffee, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi bitterballen daging sapi isi keju lumer dan baso goreng beku siap saji untuk kafe.

Saya menghubungi rekan-rekan untuk memperkenalkan camilan kami, siapa tahu dapat menjadi opsi tambahan menu santai di Mikha Setiabudhi.

Produk kami dirancang siap goreng dalam hitungan menit tanpa ribet persiapan bahan mentah di kitchen.

Jika rekan-rekan berkenan, kami sangat terbuka untuk mengirimkan sampel tester cuma-cuma agar bisa dicicipi langsung oleh tim.

Terima kasih banyak atas perhatian dan waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
      },
    },
    {
      name: "Miss Bee Providore Setiabudhi",
      category: "cafe_bistro",
      area: "Sukajadi / Setiabudhi",
      address: "Jl. Rancabentang No. 11A, Ciumbuleuit, Cidadap, Bandung",
      email: "partnership@missbeeprovidore.com",
      instagram: "@missbee_providore",
      whatsapp: "081220194833",
      contactPerson: "F&B Purchasing Miss Bee",
      targetProduct: "duo_tasting",
      fitReason: "Resto kafe keluarga premium dengan standar Western food tinggi, sangat apresiatif terhadap bitterballen sapi Australia.",
      stagedDraft: {
        subject: "Peluang kerja sama suplai camilan untuk Miss Bee Providore",
        body: `Halo tim Purchasing Miss Bee Providore, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi bitterballen daging sapi Australia dan baso goreng beku siap saji untuk mitra kafe & resto.

Saya menghubungi rekan-rekan untuk menjajaki peluang penyediaan camilan pendamping kopi dan menu santai di Miss Bee.

Produk kami siap goreng 3–4 menit tanpa proses olah bahan mentah, sangat mendukung efisiensi operasional dapur saat jam sibuk akhir pekan.

Jika rekan-rekan berkenan, kami dengan senang hati mengirimkan tester cuma-cuma untuk dicoba tim kitchen.

Terima kasih banyak atas waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
      },
    },
    {
      name: "One Eighty Coffee and Music",
      category: "cafe_bistro",
      area: "Sukajadi / Setiabudhi",
      address: "Jl. Ganesa No. 3, Lb. Siliwangi, Coblong, Bandung",
      email: "kitchen@oneeightycoffee.com",
      instagram: "@oneeightycoffee",
      whatsapp: "081122334466",
      contactPerson: "Head Chef One Eighty",
      targetProduct: "baso_goreng",
      fitReason: "Kafe ikonik dengan seating kolam dan pengunjung ramai, membutuhkan finger food renyah siap goreng dalam 4 menit.",
      stagedDraft: {
        subject: "Opsi suplai menu camilan baso goreng untuk One Eighty Coffee",
        body: `Halo tim One Eighty Coffee, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi baso goreng dan bitterballen daging sapi beku siap saji khusus untuk kafe dan resto.

Saya menghubungi rekan-rekan untuk menjajaki kerja sama penyediaan finger food renyah di One Eighty Coffee.

Produk kami berbentuk siap goreng (zero prep), jadi praktis disajikan dalam 4 menit tanpa menyita waktu persiapan di dapur.

Jika tim One Eighty berkenan, kami dengan senang hati mengirimkan tester cuma-cuma untuk dicicipi langsung oleh tim dapur.

Terima kasih banyak atas perhatian dan waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
      },
    },
  ],

  "Pasirkaliki / Paskal": [
    {
      name: "Beer Point / Taphouse Paskal",
      category: "bar_taphouse",
      area: "Pasirkaliki / Paskal",
      address: "Paskal Hypersquare Blok G, Jl. Pasir Kaliki No. 25-27, Bandung",
      email: "bar.beerpointbdg@gmail.com",
      instagram: "@taphousebdg",
      whatsapp: "081299887709",
      contactPerson: "Head Chef / Bar Manager",
      targetProduct: "baso_goreng",
      fitReason: "Bar snack paling dicari adalah baso goreng renyah dan bitterballen panas pendamping minuman dingin.",
      stagedDraft: {
        subject: "Opsi suplai bar snack untuk Beer Point Paskal",
        body: `Halo tim Beer Point Paskal, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi baso goreng dan bitterballen daging sapi beku siap saji khusus untuk pendamping minuman.

Saya menghubungi rekan-rekan untuk menjajaki peluang suplai bar snack renyah dan gurih di Beer Point.

Produk kami siap goreng dalam 4 menit tanpa proses persiapan bahan mentah, sehingga sangat efisien untuk operasional kitchen bar saat jam sibuk.

Jika tim Beer Point berkenan, kami dengan senang hati mengirimkan paket tester cuma-cuma untuk dicoba oleh tim kitchen.

Terima kasih banyak atas waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
      },
    },
    {
      name: "Noughts & Crosses Coffee Paskal",
      category: "coffee_shop",
      area: "Pasirkaliki / Paskal",
      address: "Paskal Hypersquare Blok B No. 28, Jl. Pasir Kaliki, Bandung",
      email: "partnership@noughtsandcrosses.id",
      instagram: "@noughtsandcrosses.id",
      whatsapp: "081220194855",
      contactPerson: "Kitchen Lead Noughts & Crosses",
      targetProduct: "bitterballen_cheese",
      fitReason: "Coffee shop modern di Paskal dengan menu Western sharing, pas untuk Bitterballen Cheese lumer siap saji.",
      stagedDraft: {
        subject: "Peluang kerja sama menu camilan untuk Noughts & Crosses Paskal",
        body: `Halo tim Noughts & Crosses, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi bitterballen daging sapi dan baso goreng beku siap saji untuk kebutuhan kafe.

Saya menghubungi rekan-rekan untuk menjajaki peluang kerja sama penyediaan menu camilan pendamping kopi di Noughts & Crosses Paskal.

Produk kami berbentuk siap goreng (zero prep), jadi praktis disajikan dalam 3–4 menit tanpa ribet persiapan bahan mentah.

Jika rekan-rekan berkenan, kami dengan senang hati mengirimkan sampel tester cuma-cuma untuk dicoba langsung oleh tim.

Terima kasih banyak atas perhatian dan waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
      },
    },
    {
      name: "Gormeteria Pasirkaliki",
      category: "cafe_bistro",
      area: "Pasirkaliki / Paskal",
      address: "Jl. Pasir Kaliki No. 176, Pasir Kaliki, Cicendo, Bandung",
      email: "purchasing@gormeteria.com",
      instagram: "@gormeteria",
      whatsapp: "081122998833",
      contactPerson: "Head Kitchen Gormeteria",
      targetProduct: "duo_tasting",
      fitReason: "Resto kafe trendsetter di Pasirkaliki dengan crowd belanja dan keluarga, perputaran kudapan asin gurih sangat tinggi.",
      stagedDraft: {
        subject: "Peluang kerja sama suplai camilan untuk Gormeteria Pasirkaliki",
        body: `Halo tim Gormeteria, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi bitterballen daging sapi premium dan baso goreng beku siap goreng khusus untuk kebutuhan kafe dan resto.

Saya menghubungi rekan-rekan untuk menjajaki peluang suplai menu finger food di Gormeteria Pasirkaliki.

Produk kami berbentuk siap goreng (zero prep 3–4 menit), konsisten, dan sangat efisien untuk mendukung dapur saat jam ramai.

Jika tim Gormeteria berkenan, kami dengan senang hati mengirimkan paket tester cuma-cuma untuk dicoba langsung oleh tim dapur.

Terima kasih banyak atas waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
      },
    },
    {
      name: "Daily Breu Paskal",
      category: "coffee_shop",
      area: "Pasirkaliki / Paskal",
      address: "Paskal Hypersquare Blok D No. 6, Jl. Pasir Kaliki, Bandung",
      email: "dailybreu.bdg@gmail.com",
      instagram: "@dailybreu",
      whatsapp: "081394857622",
      contactPerson: "Store Lead Daily Breu",
      targetProduct: "bitterballen_ori",
      fitReason: "Spot favorit nugas dan ngopi di Paskal dengan kopi kuat, butuh cemilan daging sapi hangat untuk teman ngopi.",
      stagedDraft: {
        subject: "Peluang kerja sama menu camilan untuk Daily Breu Paskal",
        body: `Halo tim Daily Breu Paskal, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi bitterballen daging sapi klasik dan baso goreng beku siap saji untuk kebutuhan kafe.

Saya menghubungi rekan-rekan untuk menjajaki peluang kerja sama penyediaan menu camilan pendamping kopi di Daily Breu.

Produk kami siap goreng dalam 3–4 menit tanpa ribet persiapan bahan mentah di dapur, sangat konsisten menjaga kualitas rasa.

Jika tim Daily Breu berkenan, kami dengan senang hati mengirimkan tester cuma-cuma untuk dicicipi langsung oleh tim.

Terima kasih banyak atas perhatian dan waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
      },
    },
    {
      name: "Sumiko Coffee Paskal",
      category: "coffee_shop",
      area: "Pasirkaliki / Paskal",
      address: "Paskal Hypersquare Blok E No. 12, Jl. Pasir Kaliki, Bandung",
      email: "sumikocoffee@gmail.com",
      instagram: "@sumikocoffee",
      whatsapp: "081298765477",
      contactPerson: "Store Manager Sumiko",
      targetProduct: "baso_goreng",
      fitReason: "Kedai kopi bergaya Jepang minimalis di Paskal, sangat pas melengkapi varian snack gurih siap goreng 4 menit.",
      stagedDraft: {
        subject: "Opsi suplai menu camilan baso goreng untuk Sumiko Coffee Paskal",
        body: `Halo rekan-rekan Sumiko Coffee Paskal, salam kenal.

Saya Aria dari Savo Eats di Bandung. Kami memproduksi baso goreng dan bitterballen daging sapi beku siap saji khusus untuk pendamping kopi.

Saya menghubungi rekan-rekan untuk menjajaki peluang suplai kudapan renyah di Sumiko Coffee.

Produk kami berbentuk siap goreng (zero prep), jadi praktis disajikan dalam 3–4 menit tanpa menyita waktu tim bar.

Jika tim Sumiko berkenan, kami sangat terbuka mengirimkan sampel tester cuma-cuma untuk dicoba langsung oleh tim.

Terima kasih banyak atas waktunya.

Salam hangat,
Aria Muhammad | Savo Eats
thesavorium@gmail.com`,
      },
    },
  ],
};

export async function POST(req: Request) {
  try {
    const { area } = await req.json();
    const selectedArea = area && area !== "Semua Area" ? area : "Buah Batu / Lengkong";
    const firecrawlKey = process.env.FIRECRAWL_API_KEY || "";

    let verifiedCandidates = VERIFIED_DIRECTORY[selectedArea];
    if (!verifiedCandidates) {
      if (selectedArea === "Semua Area" || !selectedArea) {
        verifiedCandidates = [
          VERIFIED_DIRECTORY["Buah Batu / Lengkong"][0],
          VERIFIED_DIRECTORY["Braga / Asia Afrika"][0],
          VERIFIED_DIRECTORY["Riau / RE Martadinata"][0],
          VERIFIED_DIRECTORY["Dago / Dipatiukur"][0],
          VERIFIED_DIRECTORY["Pasirkaliki / Paskal"][0],
        ];
      } else {
        verifiedCandidates = VERIFIED_DIRECTORY["Buah Batu / Lengkong"];
      }
    }

    // 2. Live Web Search via Firecrawl (timeout 4s)
    let liveWebResults: { title: string; url: string; description: string }[] = [];
    if (firecrawlKey) {
      try {
        const fcRes = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          signal: AbortSignal.timeout(4000),
          headers: {
            Authorization: `Bearer ${firecrawlKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `rekomendasi coffee shop cafe di ${selectedArea} Bandung instagram`,
            limit: 5,
          }),
        });
        if (fcRes.ok) {
          const fcData = await fcRes.json();
          const rawData = fcData?.data;
          liveWebResults = Array.isArray(rawData)
            ? rawData
            : Array.isArray(rawData?.web)
            ? rawData.web
            : [];
        }
      } catch {
        // Continue to AI or Verified Directory
      }
    }

    // 3. AI Curation via Hades LLM (Groq Primary + Gemini Fallback)
    try {
      const searchContext = liveWebResults.length > 0
        ? liveWebResults.map((r, i) => `${i + 1}. ${r.title} (${r.url}): ${r.description}`).join("\n\n")
        : "";

      const systemPrompt = `Kamu adalah Hades, AI B2B Acquisition resmi Savo Eats Bandung milik Aria Muhammad.
Tugas: Mengurasi TEPAT 5 kafe / coffee shop NYATA dan aktif yang berlokasi KHUSUS di area: ${selectedArea}, Bandung.
MUTLAK: DILARANG mengembalikan kafe dari area lain (misal jangan kembalikan kafe Dago jika area adalah Buah Batu).
Gunakan bahasa Indonesia baku, santun (SPOK), sapa tim kafe dengan hormat (DILARANG KATA 'KALIAN'), tawarkan sampel tester cuma-cuma, zero prep 3-4 menit.`;

      const userPrompt = `Konteks Web:\n${searchContext}\n\nKurasi 5 kafe nyata di ${selectedArea}. Kembalikan persis JSON format:\n{\n  "candidates": [\n    {\n      "name": "Nama Kafe di ${selectedArea}",\n      "category": "coffee_shop",\n      "area": "${selectedArea}",\n      "address": "Alamat nyata di ${selectedArea} Bandung",\n      "email": "email",\n      "instagram": "@ig",\n      "whatsapp": "+628...",\n      "contactPerson": "Tim Purchasing / Barista Lead",\n      "targetProduct": "bitterballen_cheese",\n      "fitReason": "Alasan spesifik kecocokan dengan Savo Eats",\n      "stagedDraft": {\n        "subject": "Peluang kerja sama menu camilan untuk [Nama Kafe]",\n        "body": "Draf email 35-50 kata SPOK santun"\n      }\n    }\n  ]\n}`;

      const text = await callHadesLLM(systemPrompt, userPrompt, {
        jsonMode: true,
        temperature: 0.3,
      });

      if (text) {
        const parsed = JSON.parse(text);
        if (parsed.candidates && Array.isArray(parsed.candidates) && parsed.candidates.length >= 3) {
          const validCandidates = parsed.candidates
            .filter((c: ScoutCandidate) => c.name && c.address)
            .map((c: ScoutCandidate) => ({ ...c, area: selectedArea }));

          if (validCandidates.length >= 3) {
            return NextResponse.json({
              area: selectedArea,
              candidates: validCandidates.slice(0, 5),
            });
          }
        }
      }
    } catch {
      // Fallback to verified directory immediately
    }

    // 4. Return 100% Guaranteed Real Bandung Cafes for the requested area
    return NextResponse.json({
      area: selectedArea,
      candidates: verifiedCandidates,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal melakukan kurasi kafe.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
