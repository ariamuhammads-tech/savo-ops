"use client";

import { useState, useTransition } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Download, Upload, CheckCircle2, FileSpreadsheet } from "lucide-react";

import {
  IMPORT_CONFIG,
  coerceCell,
  type ImportType,
} from "./import-config";
import { importData } from "./actions";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PreviewRow = {
  values: Record<string, unknown>;
  errors: string[];
};

export function ImportPanel() {
  const [type, setType] = useState<ImportType>("produk");
  const [rows, setRows] = useState<PreviewRow[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [pending, startTransition] = useTransition();

  const cfg = IMPORT_CONFIG[type];
  const validRows = (rows ?? []).filter((r) => r.errors.length === 0);
  const invalidCount = (rows ?? []).length - validRows.length;

  function downloadTemplate() {
    const headers = cfg.fields.map((f) => f.header);
    const example = cfg.fields.map((f) =>
      f.field === "name"
        ? "Contoh Nama"
        : f.type === "number"
          ? 0
          : f.type === "enum"
            ? f.enum?.[0]
            : "",
    );
    const ws = XLSX.utils.aoa_to_sheet([headers, example]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, cfg.label);
    XLSX.writeFile(wb, `template-${type}.xlsx`);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

    const preview: PreviewRow[] = json.map((raw) => {
      const values: Record<string, unknown> = {};
      const errors: string[] = [];
      for (const f of cfg.fields) {
        const { value, error } = coerceCell(f, raw[f.header]);
        values[f.field] = value;
        if (error && f.required) errors.push(error);
      }
      return { values, errors };
    });
    setRows(preview);
  }

  function confirm() {
    startTransition(async () => {
      const res = await importData(
        type,
        validRows.map((r) => r.values),
      );
      if (res.ok) {
        toast.success(`Impor selesai: ${res.inserted} baru, ${res.updated} diperbarui.`);
        setRows(null);
        setFileName("");
      } else {
        toast.error(res.error ?? "Gagal impor.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Upload className="size-5 text-primary" />
          Impor Data (Excel)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="imp-type">Jenis data</Label>
          <Select
            id="imp-type"
            value={type}
            onChange={(e) => {
              setType(e.target.value as ImportType);
              setRows(null);
              setFileName("");
            }}
          >
            <option value="produk">Produk</option>
            <option value="bahan">Bahan Baku</option>
            <option value="pelanggan">Pelanggan</option>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={downloadTemplate}>
            <Download />
            Unduh template
          </Button>
          <Button type="button" variant="secondary" asChild>
            <label className="cursor-pointer">
              <FileSpreadsheet />
              {fileName || "Pilih file…"}
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={onFile}
              />
            </label>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Baris dicocokkan berdasarkan{" "}
          <span className="font-medium">
            {cfg.matchBy === "sku" ? "SKU (atau Nama)" : "Nama"}
          </span>
          . Yang cocok akan diperbarui, sisanya ditambahkan.
        </p>

        {rows && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <span className="rounded bg-[color:var(--success)]/10 px-2 py-1 font-medium text-[color:var(--success)]">
                {validRows.length} baris valid
              </span>
              {invalidCount > 0 && (
                <span className="rounded bg-destructive/10 px-2 py-1 font-medium text-destructive">
                  {invalidCount} dilewati
                </span>
              )}
            </div>

            <div className="max-h-72 overflow-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-secondary">
                  <tr>
                    {cfg.fields.slice(0, 5).map((f) => (
                      <th key={f.field} className="whitespace-nowrap px-2 py-1.5 font-medium">
                        {f.header}
                      </th>
                    ))}
                    <th className="px-2 py-1.5" />
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 100).map((r, i) => (
                    <tr
                      key={i}
                      className={
                        "border-t border-border " +
                        (r.errors.length ? "bg-destructive/5" : "")
                      }
                    >
                      {cfg.fields.slice(0, 5).map((f) => (
                        <td key={f.field} className="whitespace-nowrap px-2 py-1.5">
                          {String(r.values[f.field] ?? "")}
                        </td>
                      ))}
                      <td className="px-2 py-1.5 text-destructive">
                        {r.errors[0] ?? ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button
              type="button"
              onClick={confirm}
              disabled={pending || validRows.length === 0}
              className="w-full"
            >
              <CheckCircle2 />
              {pending
                ? "Mengimpor…"
                : `Konfirmasi impor ${validRows.length} baris`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
