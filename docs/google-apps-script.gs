/**
 * SAVO Ops — Google Sheets sync bridge (Apps Script Web App).
 *
 * SETUP (owner):
 * 1. Buat 1 Google Sheet baru (beri nama mis. "SAVO Data").
 * 2. Menu Extensions -> Apps Script. Hapus isi default, tempel SELURUH file ini.
 * 3. Save (ikon disket).
 * 4. Deploy -> New deployment -> pilih tipe "Web app".
 *    - Execute as: Me
 *    - Who has access: Anyone
 *    - Deploy. Salin "Web app URL" (diakhiri /exec).
 * 5. Kirim Web app URL itu ke Claude. Token sudah tertanam di bawah.
 *
 * Tab "produk" & "bahan" dibuat otomatis dengan header yang benar saat
 * pertama kali disinkronkan — Anda tidak perlu menatanya sendiri.
 */

var TOKEN = "savo_b02486887dfd4bdcaee2137393976511d1819a92";

var TABS = {
  produk: [
    "SKU", "Nama", "Kategori", "Satuan", "Berat (g)", "Harga B2C",
    "Harga B2B", "Stok", "Stok Min", "Aktif", "Catatan", "updated_at",
  ],
  bahan: [
    "Nama", "Satuan", "Stok", "Stok Min", "Harga Beli Terakhir",
    "Pemasok", "Catatan", "updated_at",
  ],
};

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function ensureSheet_(tab) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(tab);
  var headers = TABS[tab];
  if (!sh) {
    sh = ss.insertSheet(tab);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sh.setFrozenRows(1);
  }
  return sh;
}

function readTab_(tab) {
  var headers = TABS[tab];
  if (!headers) return [];
  var sh = ensureSheet_(tab);
  var last = sh.getLastRow();
  if (last < 2) return [];
  var values = sh.getRange(2, 1, last - 1, headers.length).getValues();
  var rows = [];
  for (var i = 0; i < values.length; i++) {
    var r = values[i];
    var blank = true;
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      obj[headers[c]] = r[c];
      if (String(r[c]).trim() !== "") blank = false;
    }
    if (!blank) rows.push(obj);
  }
  return rows;
}

function writeTab_(tab, rows) {
  var headers = TABS[tab];
  if (!headers) return;
  var sh = ensureSheet_(tab);
  var last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, headers.length).clearContent();
  if (!rows || !rows.length) return;
  var out = rows.map(function (obj) {
    return headers.map(function (h) {
      return obj[h] === undefined || obj[h] === null ? "" : obj[h];
    });
  });
  sh.getRange(2, 1, out.length, headers.length).setValues(out);
}

function doGet(e) {
  if (!e || e.parameter.token !== TOKEN) return json_({ error: "unauthorized" });
  var tab = e.parameter.tab;
  if (!TABS[tab]) return json_({ error: "unknown tab" });
  return json_({ rows: readTab_(tab) });
}

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ error: "bad json" });
  }
  if (!body || body.token !== TOKEN) return json_({ error: "unauthorized" });
  if (!TABS[body.tab]) return json_({ error: "unknown tab" });
  writeTab_(body.tab, body.rows || []);
  return json_({ ok: true, written: (body.rows || []).length });
}

/** Stamp updated_at when a row is edited by hand, so sync knows it changed. */
function onEdit(e) {
  try {
    var sh = e.range.getSheet();
    var tab = sh.getName();
    var headers = TABS[tab];
    if (!headers) return;
    var row = e.range.getRow();
    if (row < 2) return;
    var uCol = headers.indexOf("updated_at") + 1;
    if (uCol < 1) return;
    sh.getRange(row, uCol).setValue(new Date().toISOString());
  } catch (err) {
    // ignore
  }
}
