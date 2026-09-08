"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Edit3,
  Check,
  X,
  Upload,
  Trash2,
  ImageIcon,
  RotateCcw,
  Sparkles,
  Camera,
  ArrowRight,
} from "lucide-react";
import {
  CatalogItem,
  DEFAULT_CATALOG,
  getStoredCatalog,
  saveStoredCatalog,
} from "@/lib/catalog-data";
import { toast } from "sonner";

export default function KatalogB2BPage() {
  const [items, setItems] = useState<CatalogItem[]>(DEFAULT_CATALOG);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CatalogItem | null>(null);

  useEffect(() => {
    setItems(getStoredCatalog());
  }, []);

  const handleStartEdit = (item: CatalogItem) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleSaveEdit = () => {
    if (!editForm) return;

    // Recalculate margin if both prices are valid
    let updatedMargin = editForm.marginPercent;
    if (editForm.recommendedSellPrice > 0 && editForm.hppPerPortion >= 0) {
      const marginVal =
        ((editForm.recommendedSellPrice - editForm.hppPerPortion) /
          editForm.recommendedSellPrice) *
        100;
      updatedMargin = marginVal.toFixed(1) + "%";
    }

    const updatedItem: CatalogItem = {
      ...editForm,
      marginPercent: updatedMargin,
    };

    const nextItems = items.map((i) => (i.id === updatedItem.id ? updatedItem : i));
    setItems(nextItems);
    saveStoredCatalog(nextItems);
    setEditingId(null);
    setEditForm(null);
    toast.success(`Produk "${updatedItem.name}" berhasil diperbarui!`);
  };

  const handleImageUpload = (
    itemId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran foto melebihi 2MB. Gunakan foto ringan agar siap dikirim via email.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const sizeKb = Math.round(file.size / 1024);

      const nextItems = items.map((i) =>
        i.id === itemId
          ? {
              ...i,
              imageUrl: dataUrl,
              imageName: file.name,
              imageSizeKb: sizeKb,
            }
          : i
      );

      setItems(nextItems);
      saveStoredCatalog(nextItems);
      toast.success(`Foto produk "${file.name}" tersimpan di katalog aset!`);
    };

    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemoveImage = (itemId: string) => {
    const nextItems = items.map((i) =>
      i.id === itemId
        ? {
            ...i,
            imageUrl: null,
            imageName: null,
            imageSizeKb: null,
          }
        : i
    );
    setItems(nextItems);
    saveStoredCatalog(nextItems);
    toast.success("Foto produk dihapus dari katalog.");
  };

  const handleResetDefaults = () => {
    if (confirm("Kembalikan seluruh harga dan penamaan produk ke setelan standar resmi Savo?")) {
      setItems(DEFAULT_CATALOG);
      saveStoredCatalog(DEFAULT_CATALOG);
      toast.success("Katalog dikembalikan ke harga default.");
    }
  };

  return (
    <div className="content-container space-y-8">
      {/* Editorial Header */}
      <div className="border-b border-border pb-6 flex flex-wrap items-baseline justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground font-mono">
            PRICING & ASSET CATALOG // B2B WHOLESALE
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Katalog Produk & Margin B2B Savo Eats
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Kelola nama, harga grosir, HPP porsi kafe, serta foto aset produk resmi. Foto yang diunggah di sini siap otomatis dilampirkan di email Outbox tanpa perlu upload berulang kali.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="apple-btn-secondary"
          >
            <RotateCcw className="size-3.5" />
            <span>Reset Default</span>
          </button>
          <Link
            href="/outbox"
            className="apple-btn-primary"
          >
            <span>Buka Outbox Email</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>

      {/* Product Spec Table Grid */}
      <div className="space-y-0 divide-y divide-border border-t border-b border-border">
        {items.map((item) => {
          const isEditing = editingId === item.id && editForm !== null;

          return (
            <div
              key={item.id}
              className={`py-8 space-y-6 transition-colors ${
                isEditing ? "bg-secondary/20 px-4 rounded-md" : ""
              }`}
            >
              {isEditing ? (
                /* EDIT MODE FORM */
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-xs font-bold font-mono text-primary uppercase">
                      ✏️ Mengedit Detail: {item.name}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-md border border-border hover:bg-secondary font-medium"
                      >
                        <X className="size-3" />
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        className="inline-flex items-center gap-1 px-3.5 py-1 text-xs rounded-md bg-foreground text-background font-bold hover:opacity-90"
                      >
                        <Check className="size-3" />
                        Simpan Perubahan
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold mb-1 text-muted-foreground">
                        Nama Produk
                      </label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        className="w-full rounded-md border border-border bg-secondary/30 px-3 py-2 font-medium text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-muted-foreground">
                        Tagline / Kategori
                      </label>
                      <input
                        type="text"
                        value={editForm.categoryTag}
                        onChange={(e) =>
                          setEditForm({ ...editForm, categoryTag: e.target.value })
                        }
                        className="w-full rounded-md border border-border bg-secondary/30 px-3 py-2 text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-muted-foreground">
                        Harga Grosir B2B (Rp)
                      </label>
                      <input
                        type="number"
                        value={editForm.b2bPrice}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            b2bPrice: Number(e.target.value),
                          })
                        }
                        className="w-full rounded-md border border-border bg-secondary/30 px-3 py-2 font-mono text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-muted-foreground">
                        Keterangan Satuan Pack
                      </label>
                      <input
                        type="text"
                        value={editForm.packUnit}
                        onChange={(e) =>
                          setEditForm({ ...editForm, packUnit: e.target.value })
                        }
                        className="w-full rounded-md border border-border bg-secondary/30 px-3 py-2 text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-muted-foreground">
                        Keterangan Porsi Kafe
                      </label>
                      <input
                        type="text"
                        value={editForm.portionDesc}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            portionDesc: e.target.value,
                          })
                        }
                        className="w-full rounded-md border border-border bg-secondary/30 px-3 py-2 text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-muted-foreground">
                        HPP per Porsi Kafe (Rp)
                      </label>
                      <input
                        type="number"
                        value={editForm.hppPerPortion}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            hppPerPortion: Number(e.target.value),
                          })
                        }
                        className="w-full rounded-md border border-border bg-secondary/30 px-3 py-2 font-mono text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-muted-foreground">
                        Saran Harga Jual Menu Kafe (Rp)
                      </label>
                      <input
                        type="number"
                        value={editForm.recommendedSellPrice}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            recommendedSellPrice: Number(e.target.value),
                          })
                        }
                        className="w-full rounded-md border border-border bg-secondary/30 px-3 py-2 font-mono text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1 text-muted-foreground">
                        Waktu Goreng / Deep-Fry
                      </label>
                      <input
                        type="text"
                        value={editForm.cookTime}
                        onChange={(e) =>
                          setEditForm({ ...editForm, cookTime: e.target.value })
                        }
                        className="w-full rounded-md border border-border bg-secondary/30 px-3 py-2 text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-muted-foreground">
                      Deskripsi Karakter Produk
                    </label>
                    <textarea
                      rows={3}
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm({ ...editForm, description: e.target.value })
                      }
                      className="w-full rounded-md border border-border bg-secondary/30 p-2.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              ) : (
                /* DISPLAY VIEW */
                <div className="space-y-4">
                  {/* Top Bar with Title and Action */}
                  <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-primary font-bold">
                        {item.categoryTag}
                      </span>
                      <h2 className="font-display text-xl font-bold text-foreground mt-0.5">
                        {item.name}
                      </h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-display text-xl font-bold text-primary">
                          {item.b2bPrice > 0
                            ? `Rp ${item.b2bPrice.toLocaleString("id-ID")}`
                            : "GRATIS"}
                        </span>
                        <span className="text-xs text-muted-foreground block font-mono">
                          {item.packUnit}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border border-border bg-secondary/40 hover:bg-secondary text-foreground transition-colors cursor-pointer"
                        title="Ubah nama, harga, dan porsi produk"
                      >
                        <Edit3 className="size-3" />
                        Edit
                      </button>
                    </div>
                  </div>

                  {/* Main Grid: Photo + Specs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Left: Product Photo Asset Box */}
                    <div className="border border-border/70 rounded-xl bg-secondary/20 p-3.5 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                            <Camera className="size-3.5 text-primary" />
                            Foto Produk Resmi
                          </span>
                          {item.imageUrl && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold">
                              Siap di-Attach
                            </span>
                          )}
                        </div>

                        {item.imageUrl ? (
                          <div className="relative group rounded-lg overflow-hidden border border-border/80 aspect-video bg-black/5 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <label className="p-2 rounded-md bg-card text-foreground text-xs font-semibold hover:bg-secondary cursor-pointer flex items-center gap-1">
                                <Upload className="size-3.5" />
                                Ganti
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp"
                                  className="hidden"
                                  onChange={(e) => handleImageUpload(item.id, e)}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(item.id)}
                                className="p-2 rounded-md bg-destructive text-destructive-foreground hover:opacity-90"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className="border-2 border-dashed border-border/80 hover:border-primary/60 rounded-lg p-5 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition-colors bg-card/50 hover:bg-secondary/40 aspect-video">
                            <ImageIcon className="size-6 text-muted-foreground" />
                            <div>
                              <span className="text-xs font-semibold text-foreground block">
                                Upload Foto Plating / Produk
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                JPG, PNG, WebP (Maks 2MB)
                              </span>
                            </div>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              onChange={(e) => handleImageUpload(item.id, e)}
                            />
                          </label>
                        )}
                      </div>

                      <p className="text-[11px] text-muted-foreground leading-normal">
                        {item.imageUrl
                          ? `Foto "${item.imageName || "Asset"}" (${item.imageSizeKb || 0} KB) siap otomatis dipilih saat kirim email penawaran ke kafe.`
                          : "Upload foto terbaik produk ini agar Anda tidak perlu mencari file foto lagi dari komputer setiap mengirim email."}
                      </p>
                    </div>

                    {/* Right: Description & Economics Spec */}
                    <div className="md:col-span-2 space-y-3 flex flex-col justify-between">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border border border-border rounded-lg bg-secondary/20 overflow-hidden text-xs">
                        <div className="p-3">
                          <span className="text-muted-foreground text-[10px] block font-semibold uppercase tracking-wider">
                            {item.portionDesc}
                          </span>
                          <span className="font-mono font-bold text-foreground text-xs mt-1 block">
                            HPP Rp {item.hppPerPortion.toLocaleString("id-ID")}
                          </span>
                        </div>

                        <div className="p-3">
                          <span className="text-muted-foreground text-[10px] block font-semibold uppercase tracking-wider">
                            Saran Jual Kafe
                          </span>
                          <span className="font-mono font-bold text-foreground text-xs mt-1 block">
                            {item.recommendedSellPrice > 0
                              ? `Rp ${item.recommendedSellPrice.toLocaleString("id-ID")}`
                              : "Sampel Gratis"}
                          </span>
                        </div>

                        <div className="p-3 bg-emerald-500/5">
                          <span className="text-emerald-700 dark:text-emerald-400 text-[10px] block font-semibold uppercase tracking-wider">
                            Margin Laba Kafe
                          </span>
                          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 text-xs mt-1 block">
                            {item.marginPercent}
                          </span>
                        </div>

                        <div className="p-3">
                          <span className="text-muted-foreground text-[10px] block font-semibold uppercase tracking-wider">
                            Waktu Saji
                          </span>
                          <span className="font-mono font-medium text-foreground text-xs mt-1 block">
                            {item.cookTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
