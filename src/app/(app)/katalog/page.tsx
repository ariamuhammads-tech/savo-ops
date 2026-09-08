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
      <div className="border-b border-border/40 pb-6 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>Katalog Produk &amp; Unit Economics</span>
            <span>·</span>
            <span>Suplai Grosir Kafe Bandung</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-medium tracking-tight text-foreground mt-1">
            Katalog Produk &amp; Margin B2B Savo Eats
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
            Kelola nama, harga grosir, HPP porsi kafe, serta foto aset produk resmi. Foto yang diunggah siap otomatis dilampirkan di email Outbox.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="size-3.5" />
            <span>Reset Default</span>
          </button>
          <Link
            href="/outbox"
            className="px-4 py-2 bg-foreground text-background text-xs font-medium inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity"
          >
            <span>Buka Outbox Email</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>

      {/* Product Spec Table Grid (Zero Card Wrapping, Pure Hairline Rows) */}
      <div className="divide-y divide-border/40 border-t border-b border-border/40">
        {items.map((item) => {
          const isEditing = editingId === item.id && editForm !== null;

          return (
            <div
              key={item.id}
              className={`py-8 transition-colors ${
                isEditing ? "bg-muted/10 px-4 border-l-2 border-foreground" : ""
              }`}
            >
              {isEditing ? (
                /* EDIT MODE FORM */
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border/40 pb-3">
                    <span className="text-xs font-medium text-foreground uppercase tracking-wider">
                      Ubah Data · {item.name}
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        className="px-4 py-2 text-xs font-medium bg-foreground text-background hover:opacity-90 cursor-pointer"
                      >
                        Simpan Perubahan
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block mb-1 text-muted-foreground">
                        Nama Produk
                      </label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        className="w-full border-b border-border/60 bg-transparent py-1.5 font-medium text-foreground focus:outline-hidden focus:border-foreground"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-muted-foreground">
                        Tagline / Kategori
                      </label>
                      <input
                        type="text"
                        value={editForm.categoryTag}
                        onChange={(e) =>
                          setEditForm({ ...editForm, categoryTag: e.target.value })
                        }
                        className="w-full border-b border-border/60 bg-transparent py-1.5 text-foreground focus:outline-hidden focus:border-foreground"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-muted-foreground">
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
                        className="w-full border-b border-border/60 bg-transparent py-1.5 font-mono text-foreground focus:outline-hidden focus:border-foreground"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-muted-foreground">
                        Keterangan Satuan Pack
                      </label>
                      <input
                        type="text"
                        value={editForm.packUnit}
                        onChange={(e) =>
                          setEditForm({ ...editForm, packUnit: e.target.value })
                        }
                        className="w-full border-b border-border/60 bg-transparent py-1.5 text-foreground focus:outline-hidden focus:border-foreground"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-muted-foreground">
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
                        className="w-full border-b border-border/60 bg-transparent py-1.5 text-foreground focus:outline-hidden focus:border-foreground"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-muted-foreground">
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
                        className="w-full border-b border-border/60 bg-transparent py-1.5 font-mono text-foreground focus:outline-hidden focus:border-foreground"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-muted-foreground">
                        Saran Harga Jual Kafe (Rp)
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
                        className="w-full border-b border-border/60 bg-transparent py-1.5 font-mono text-foreground focus:outline-hidden focus:border-foreground"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 text-muted-foreground">
                        Waktu Goreng / Saji
                      </label>
                      <input
                        type="text"
                        value={editForm.cookTime}
                        onChange={(e) =>
                          setEditForm({ ...editForm, cookTime: e.target.value })
                        }
                        className="w-full border-b border-border/60 bg-transparent py-1.5 text-foreground focus:outline-hidden focus:border-foreground"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block mb-1 text-muted-foreground">
                        Deskripsi Penawaran Produk
                      </label>
                      <textarea
                        rows={3}
                        value={editForm.description}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            description: e.target.value,
                          })
                        }
                        className="w-full border-b border-border/60 bg-transparent py-1.5 text-xs text-foreground focus:outline-hidden focus:border-foreground"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* DISPLAY VIEW */
                <div className="space-y-6">
                  {/* Top Bar with Title and Price */}
                  <div className="flex flex-wrap items-baseline justify-between gap-4">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium block">
                        {item.categoryTag}
                      </span>
                      <h2 className="text-2xl font-normal tracking-tight text-foreground mt-0.5">
                        {item.name}
                      </h2>
                    </div>

                    <div className="flex items-baseline gap-4">
                      <div className="text-right">
                        <span className="text-2xl font-light text-foreground">
                          {item.b2bPrice > 0
                            ? `Rp ${item.b2bPrice.toLocaleString("id-ID")}`
                            : "GRATIS"}
                        </span>
                        <span className="text-xs text-muted-foreground block">
                          {item.packUnit}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(item)}
                        className="text-xs text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
                        title="Ubah nama, harga, dan porsi produk"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  {/* Main Grid: Description + Specs + Photo */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left: Description & Economics Spec */}
                    <div className="lg:col-span-8 space-y-6">
                      <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                        {item.description}
                      </p>

                      {/* Economics Spec Strip (Pure Open Hairline Datums) */}
                      <div className="pt-4 border-t border-border/40 grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs">
                        <div>
                          <span className="text-muted-foreground text-[11px] block uppercase tracking-wider">
                            {item.portionDesc}
                          </span>
                          <span className="font-medium text-foreground text-sm mt-1 block">
                            HPP Rp {item.hppPerPortion.toLocaleString("id-ID")}
                          </span>
                        </div>

                        <div>
                          <span className="text-muted-foreground text-[11px] block uppercase tracking-wider">
                            Saran Jual Kafe
                          </span>
                          <span className="font-medium text-foreground text-sm mt-1 block">
                            {item.recommendedSellPrice > 0
                              ? `Rp ${item.recommendedSellPrice.toLocaleString("id-ID")}`
                              : "Sampel Gratis"}
                          </span>
                        </div>

                        <div>
                          <span className="text-muted-foreground text-[11px] block uppercase tracking-wider">
                            Margin Laba Kafe
                          </span>
                          <span className="font-medium text-foreground text-sm mt-1 block">
                            {item.marginPercent}
                          </span>
                        </div>

                        <div>
                          <span className="text-muted-foreground text-[11px] block uppercase tracking-wider">
                            Waktu Saji
                          </span>
                          <span className="font-medium text-foreground text-sm mt-1 block">
                            {item.cookTime}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Product Photo Asset Slot */}
                    <div className="lg:col-span-4">
                      {item.imageUrl ? (
                        <div className="relative group overflow-hidden border border-border/40 aspect-video bg-muted/20 flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <label className="px-3 py-1.5 bg-foreground text-background text-xs font-medium cursor-pointer flex items-center gap-1">
                              <Upload className="size-3" />
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
                              className="px-3 py-1.5 bg-destructive text-destructive-foreground text-xs font-medium cursor-pointer"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="border border-dashed border-border/60 hover:border-foreground p-5 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition-colors bg-muted/10 hover:bg-muted/20 aspect-video">
                          <ImageIcon className="size-5 text-muted-foreground" />
                          <div>
                            <span className="text-xs font-medium text-foreground block">
                              Upload Foto Aset
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              JPG, PNG, WebP &lt; 2MB
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
