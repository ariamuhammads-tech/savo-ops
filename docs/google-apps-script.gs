/**
 * SAVO Ops — Google Sheets sync bridge (Apps Script Web App) — GENERIC.
 *
 * The app sends the tab name + column headers, so this one script works for
 * ALL features (produk, bahan, pelanggan, pesanan, pembayaran, pembelian,
 * produksi, invoice, pengeluaran) without editing this file again.
 *
 * SETUP (owner) — do this ONCE:
 * 1. Open your "SAVO Data" Google Sheet → Extensions → Apps Script.
 * 2. Delete everything there, paste THIS whole file, Save.
 * 3. Deploy → Manage deployments → edit (pencil) the existing Web app →
 *    Version: New version → Deploy. (Keeps the same URL.)
 *    (Who has access must stay "Anyone".)
 * That's it — no need to change the URL in the app.
 */

var TOKEN = "savo_b02486887dfd4bdcaee2137393976511d1819a92";

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function sheetFor_(tab, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(tab);
  if (!sh) sh = ss.insertSheet(tab);
  if (headers && headers.length) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sh.setFrozenRows(1);
  }
  return sh;
}

function readTab_(tab) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(tab);
  if (!sh) return [];
  var last = sh.getLastRow();
  var lastCol = sh.getLastColumn();
  if (last < 2 || lastCol < 1) return [];
  var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  var values = sh.getRange(2, 1, last - 1, lastCol).getValues();
  var rows = [];
  for (var i = 0; i < values.length; i++) {
    var r = values[i];
    var blank = true;
    var o = {};
    for (var c = 0; c < headers.length; c++) {
      if (!headers[c]) continue;
      o[headers[c]] = r[c];
      if (String(r[c]).trim() !== "") blank = false;
    }
    if (!blank) rows.push(o);
  }
  return rows;
}

function writeTab_(tab, headers, rows) {
  var sh = sheetFor_(tab, headers);
  var lastCol = Math.max(headers.length, 1);
  var last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, lastCol).clearContent();
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
  if (!tab) return json_({ error: "no tab" });
  return json_({ rows: readTab_(tab) });
}

function doPost(e) {
  var b;
  try {
    b = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ error: "bad json" });
  }
  if (!b || b.token !== TOKEN) return json_({ error: "unauthorized" });
  if (!b.tab || !b.headers) return json_({ error: "missing tab/headers" });
  writeTab_(b.tab, b.headers, b.rows || []);
  return json_({ ok: true, written: (b.rows || []).length });
}

/** Stamp updated_at when a row is edited by hand, so two-way sync detects it. */
function onEdit(e) {
  try {
    var sh = e.range.getSheet();
    var lastCol = sh.getLastColumn();
    var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0];
    var uCol = headers.indexOf("updated_at") + 1;
    if (uCol < 1) return;
    var row = e.range.getRow();
    if (row < 2) return;
    sh.getRange(row, uCol).setValue(new Date().toISOString());
  } catch (err) {
    // ignore
  }
}
