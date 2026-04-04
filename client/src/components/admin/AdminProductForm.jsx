/**
 * AdminProductForm.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Full admin product create/edit form using:
 *   • React Hook Form (form state & submission)
 *   • Zod (schema validation)
 *   • @hookform/resolvers/zod (bridge)
 *   • Cloudinary (image upload via backend endpoint)
 *   • Framer Motion (form entrance animations)
 *   • react-hot-toast (notifications)
 *   • TanStack Query (mutation + cache invalidation)
 */

import { useState, useCallback } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  Upload, X, Plus, Leaf, Package, DollarSign,
  Sun, Droplets, Ruler, Tag, Image as ImageIcon,
} from "lucide-react";
import { PageTransition, StaggerContainer, StaggerItem } from "../PageTransition";

// ─── Brand Colors ─────────────────────────────────────────────────────────────
const C = {
  sage:    "#2D5A27",
  forest:  "#1B3022",
  white:   "#F9FBF9",
  charcoal:"#333333",
};

// ─── Zod Schema ───────────────────────────────────────────────────────────────
const productSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(120, "Name too long"),

  category: z.enum(
    ["Indoor", "Outdoor", "Fertilizer", "Seeds", "Pots & Planters", "Tools"],
    { required_error: "Please select a category" }
  ),

  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(3000, "Description too long"),

  shortDescription: z.string().max(200).optional(),

  price: z
    .number({ invalid_type_error: "Price must be a number" })
    .positive("Price must be greater than 0")
    .max(99999, "Price too high"),

  compareAtPrice: z
    .number()
    .positive()
    .optional()
    .nullable()
    .refine((v) => v == null || v > 0, "Compare price must be positive"),

  stock: z
    .number({ invalid_type_error: "Stock must be a number" })
    .int("Stock must be a whole number")
    .min(0, "Stock cannot be negative")
    .max(9999),

  sku: z.string().max(60).optional(),

  // Plant attributes
  height: z
    .enum(["Upto 30cm", "30–60cm", "60cm–1m", "1m–2m", "2m+"])
    .optional()
    .nullable(),

  sunlight: z
    .enum(["Low Light", "Indirect Light", "Bright Indirect", "Full Sun"])
    .optional()
    .nullable(),

  water: z
    .enum(["Daily", "Every 2–3 Days", "Weekly", "Bi-Weekly", "Monthly"])
    .optional()
    .nullable(),

  difficulty: z.enum(["Beginner", "Intermediate", "Expert"]).default("Beginner"),
  petFriendly:  z.boolean().default(false),
  airPurifying: z.boolean().default(false),

  // Fertilizer fields
  fertilizerType: z
    .enum(["Organic", "Chemical", "Bio-Fertilizer"])
    .optional()
    .nullable(),
  npkRatio: z.string().max(20).optional(),
  weightKg: z.number().positive().optional().nullable(),

  // Tags
  tags: z.array(z.string().min(1).max(40)).max(10),

  // Flags
  isActive:   z.boolean().default(true),
  isFeatured: z.boolean().default(false),

  // Images are handled separately (upload state)
});

// ─── API Calls ────────────────────────────────────────────────────────────────
const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function uploadImages(files, token) {
  const fd = new FormData();
  files.forEach((f) => fd.append("images", f));

  const res = await fetch(`${API}/admin/products/upload-images`, {
    method:  "POST",
    headers: { Authorization: `Bearer ${token}` },
    body:    fd,
  });
  if (!res.ok) throw new Error("Image upload failed");
  return res.json(); // { images: [{ url, publicId }] }
}

async function saveProduct({ data, token, productId }) {
  const res = await fetch(
    `${API}/admin/products${productId ? `/${productId}` : ""}`,
    {
      method:  productId ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:  `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to save product");
  }
  return res.json();
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function FieldError({ message }) {
  if (!message) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-red-500 text-xs mt-1"
    >
      {message}
    </motion.p>
  );
}

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-stone-200">
      <div className="p-1.5 rounded-lg" style={{ background: "#f0fdf4" }}>
        <Icon size={16} style={{ color: C.sage }} />
      </div>
      <h3 className="font-semibold text-sm" style={{ color: C.charcoal }}>{title}</h3>
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? "bg-[#2D5A27]" : "bg-stone-300"}`}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </div>
      <span className="text-sm text-stone-700">{label}</span>
    </label>
  );
}

// ─── Image Upload Zone ────────────────────────────────────────────────────────
function ImageUploadZone({ uploadedImages, onFilesSelected, onRemove, uploading }) {
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length) onFilesSelected(files);
  }, [onFilesSelected]);

  return (
    <div>
      <SectionHeader icon={ImageIcon} title="Product Images" />

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-stone-300 rounded-xl p-8 text-center
                   hover:border-[#2D5A27] transition-colors cursor-pointer group"
        onClick={() => document.getElementById("img-input").click()}
      >
        <Upload size={32} className="mx-auto mb-2 text-stone-400 group-hover:text-[#2D5A27] transition-colors" />
        <p className="text-sm font-medium text-stone-600">Drop images here or click to browse</p>
        <p className="text-xs text-stone-400 mt-1">JPG, PNG, WebP · Max 5MB each · Up to 5 images</p>
        <input
          id="img-input"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onFilesSelected(Array.from(e.target.files))}
        />
      </div>

      {/* Uploaded Previews */}
      {uploadedImages.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-4">
          {uploadedImages.map((img, i) => (
            <motion.div
              key={img.publicId || img.url || i}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-24 h-24 rounded-lg overflow-hidden border border-stone-200 group"
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              {i === 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-[#2D5A27] text-white text-[10px] text-center py-0.5">
                  Primary
                </div>
              )}
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5
                           flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={10} />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {uploading && (
        <div className="flex items-center gap-2 mt-3 text-sm text-stone-500">
          <div className="w-4 h-4 border-2 border-[#2D5A27] border-t-transparent rounded-full animate-spin" />
          Uploading images to Cloudinary…
        </div>
      )}
    </div>
  );
}

// ─── Main Form Component ──────────────────────────────────────────────────────
export default function AdminProductForm({ product = null, token, onSuccess }) {
  const queryClient   = useQueryClient();
  const isEditing     = !!product;

  const [uploadedImages, setUploadedImages] = useState(product?.images ?? []);
  const [imgUploading,   setImgUploading]   = useState(false);
  const [tagInput,       setTagInput]       = useState("");

  // ── Form Setup ──────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name:            product?.name            ?? "",
      category:        product?.category        ?? "",
      description:     product?.description     ?? "",
      shortDescription:product?.shortDescription ?? "",
      price:           product?.price           ?? undefined,
      compareAtPrice:  product?.compareAtPrice  ?? null,
      stock:           product?.stock           ?? 0,
      sku:             product?.sku             ?? "",
      height:          product?.height          ?? null,
      sunlight:        product?.sunlight        ?? null,
      water:           product?.water           ?? null,
      difficulty:      product?.difficulty      ?? "Beginner",
      petFriendly:     product?.petFriendly     ?? false,
      airPurifying:    product?.airPurifying     ?? false,
      fertilizerType:  product?.fertilizerType  ?? null,
      npkRatio:        product?.npkRatio        ?? "",
      weightKg:        product?.weightKg        ?? null,
      tags:            product?.tags            ?? [],
      isActive:        product?.isActive        ?? true,
      isFeatured:      product?.isFeatured      ?? false,
    },
  });

  const { fields: tagFields, append: appendTag, remove: removeTag } = useFieldArray({
    control,
    name: "tags",
  });

  const selectedCategory = watch("category");
  const isFertilizer     = selectedCategory === "Fertilizer";

  // ── Save Mutation ────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: saveProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(isEditing ? "Product updated! 🌿" : "Product created! 🌱");
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  // ── Image Handlers ───────────────────────────────────────────────────────────
  const handleFilesSelected = async (files) => {
    if (uploadedImages.length + files.length > 5) {
      toast.error("Maximum 5 images allowed.");
      return;
    }
    setImgUploading(true);
    try {
      const { images } = await uploadImages(files.slice(0, 5 - uploadedImages.length), token);
      setUploadedImages((prev) => [
        ...prev,
        ...images.map((img, i) => ({ ...img, isPrimary: prev.length === 0 && i === 0 })),
      ]);
      toast.success(`${images.length} image(s) uploaded`);
    } catch (err) {
      toast.error("Image upload failed. Please try again.");
    } finally {
      setImgUploading(false);
    }
  };

  const handleRemoveImage = (idx) => {
    setUploadedImages((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (next.length > 0) next[0].isPrimary = true;
      return next;
    });
  };

  // ── Tag Handlers ─────────────────────────────────────────────────────────────
  const handleAddTag = () => {
    const clean = tagInput.trim().toLowerCase();
    if (!clean || tagFields.some((t) => t === clean)) return;
    appendTag(clean);
    setTagInput("");
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const onSubmit = async (values) => {
    if (uploadedImages.length === 0) {
      toast.error("Please upload at least one product image.");
      return;
    }
    const payload = { ...values, images: uploadedImages };
    saveMutation.mutate({ data: payload, token, productId: product?._id });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  const inputClass =
    "w-full px-3 py-2.5 bg-white border border-stone-200 rounded-lg text-sm text-stone-800 " +
    "placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/30 focus:border-[#2D5A27] transition";

  const selectClass = inputClass + " cursor-pointer";

  const sectionClass = "bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-4";

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <PageTransition>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <StaggerContainer className="space-y-6">

          {/* ── Basic Info ─────────────────────────────────────────────────── */}
          <StaggerItem>
            <div className={sectionClass}>
              <SectionHeader icon={Leaf} title="Basic Information" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-stone-600 block mb-1">
                    Product Name *
                  </label>
                  <input
                    {...register("name")}
                    placeholder="e.g. Monstera Deliciosa"
                    className={inputClass}
                  />
                  <FieldError message={errors.name?.message} />
                </div>

                {/* Category */}
                <div>
                  <label className="text-xs font-medium text-stone-600 block mb-1">
                    Category *
                  </label>
                  <select {...register("category")} className={selectClass}>
                    <option value="">Select category…</option>
                    {["Indoor","Outdoor","Fertilizer","Seeds","Pots & Planters","Tools"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <FieldError message={errors.category?.message} />
                </div>

                {/* Difficulty */}
                <div>
                  <label className="text-xs font-medium text-stone-600 block mb-1">
                    Care Difficulty
                  </label>
                  <select {...register("difficulty")} className={selectClass}>
                    {["Beginner","Intermediate","Expert"].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Short Description */}
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-stone-600 block mb-1">
                    Short Description
                  </label>
                  <input
                    {...register("shortDescription")}
                    placeholder="One-liner shown on product cards…"
                    className={inputClass}
                  />
                  <FieldError message={errors.shortDescription?.message} />
                </div>

                {/* Full Description */}
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-stone-600 block mb-1">
                    Full Description *
                  </label>
                  <textarea
                    {...register("description")}
                    rows={5}
                    placeholder="Detailed product description…"
                    className={inputClass + " resize-none"}
                  />
                  <FieldError message={errors.description?.message} />
                </div>
              </div>
            </div>
          </StaggerItem>

          {/* ── Pricing & Inventory ─────────────────────────────────────────── */}
          <StaggerItem>
            <div className={sectionClass}>
              <SectionHeader icon={DollarSign} title="Pricing & Inventory" />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Price */}
                <div>
                  <label className="text-xs font-medium text-stone-600 block mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("price", { valueAsNumber: true })}
                    placeholder="0.00"
                    className={inputClass}
                  />
                  <FieldError message={errors.price?.message} />
                </div>

                {/* Compare At Price */}
                <div>
                  <label className="text-xs font-medium text-stone-600 block mb-1">
                    MRP / Compare At (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("compareAtPrice", { valueAsNumber: true })}
                    placeholder="Optional"
                    className={inputClass}
                  />
                  <FieldError message={errors.compareAtPrice?.message} />
                </div>

                {/* Stock */}
                <div>
                  <label className="text-xs font-medium text-stone-600 block mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    {...register("stock", { valueAsNumber: true })}
                    placeholder="0"
                    className={inputClass}
                  />
                  <FieldError message={errors.stock?.message} />
                </div>

                {/* SKU */}
                <div>
                  <label className="text-xs font-medium text-stone-600 block mb-1">SKU</label>
                  <input
                    {...register("sku")}
                    placeholder="LL-001"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </StaggerItem>

          {/* ── Plant Attributes ────────────────────────────────────────────── */}
          {!isFertilizer && (
            <StaggerItem>
              <div className={sectionClass}>
                <SectionHeader icon={Ruler} title="Plant Attributes" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Height */}
                  <div>
                    <label className="text-xs font-medium text-stone-600 block mb-1 flex items-center gap-1">
                      <Ruler size={12}/> Height
                    </label>
                    <select {...register("height")} className={selectClass}>
                      <option value="">Select…</option>
                      {["Upto 30cm","30–60cm","60cm–1m","1m–2m","2m+"].map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Sunlight */}
                  <div>
                    <label className="text-xs font-medium text-stone-600 block mb-1 flex items-center gap-1">
                      <Sun size={12}/> Sunlight Requirement
                    </label>
                    <select {...register("sunlight")} className={selectClass}>
                      <option value="">Select…</option>
                      {["Low Light","Indirect Light","Bright Indirect","Full Sun"].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Water */}
                  <div>
                    <label className="text-xs font-medium text-stone-600 block mb-1 flex items-center gap-1">
                      <Droplets size={12}/> Watering Frequency
                    </label>
                    <select {...register("water")} className={selectClass}>
                      <option value="">Select…</option>
                      {["Daily","Every 2–3 Days","Weekly","Bi-Weekly","Monthly"].map((w) => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Boolean flags */}
                <div className="flex flex-wrap gap-6 mt-2">
                  <Controller
                    name="petFriendly"
                    control={control}
                    render={({ field }) => (
                      <Toggle checked={field.value} onChange={field.onChange} label="Pet Friendly 🐾" />
                    )}
                  />
                  <Controller
                    name="airPurifying"
                    control={control}
                    render={({ field }) => (
                      <Toggle checked={field.value} onChange={field.onChange} label="Air Purifying 💨" />
                    )}
                  />
                </div>
              </div>
            </StaggerItem>
          )}

          {/* ── Fertilizer Fields ───────────────────────────────────────────── */}
          {isFertilizer && (
            <StaggerItem>
              <div className={sectionClass}>
                <SectionHeader icon={Package} title="Fertilizer Details" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-stone-600 block mb-1">Type</label>
                    <select {...register("fertilizerType")} className={selectClass}>
                      <option value="">Select…</option>
                      {["Organic","Chemical","Bio-Fertilizer"].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-600 block mb-1">NPK Ratio</label>
                    <input {...register("npkRatio")} placeholder="e.g. 10-10-10" className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-600 block mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      {...register("weightKg", { valueAsNumber: true })}
                      placeholder="1.0"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </StaggerItem>
          )}

          {/* ── Tags ────────────────────────────────────────────────────────── */}
          <StaggerItem>
            <div className={sectionClass}>
              <SectionHeader icon={Tag} title="Tags" />

              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                  placeholder="Add tag and press Enter…"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-2 rounded-lg text-white text-sm flex items-center gap-1 flex-shrink-0"
                  style={{ background: C.sage }}
                >
                  <Plus size={14} /> Add
                </button>
              </div>

              {tagFields.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tagFields.map((field, i) => (
                    <motion.span
                      key={field.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
                      style={{ background: "#f0fdf4", color: C.sage, border: `1px solid #bbf7d0` }}
                    >
                      {field}
                      <button
                        type="button"
                        onClick={() => removeTag(i)}
                        className="ml-0.5 hover:text-red-500 transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </motion.span>
                  ))}
                </div>
              )}
            </div>
          </StaggerItem>

          {/* ── Images ──────────────────────────────────────────────────────── */}
          <StaggerItem>
            <div className={sectionClass}>
              <ImageUploadZone
                uploadedImages={uploadedImages}
                onFilesSelected={handleFilesSelected}
                onRemove={handleRemoveImage}
                uploading={imgUploading}
              />
            </div>
          </StaggerItem>

          {/* ── Visibility Flags ─────────────────────────────────────────────── */}
          <StaggerItem>
            <div className={sectionClass}>
              <SectionHeader icon={Leaf} title="Visibility & Flags" />
              <div className="flex flex-wrap gap-6">
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <Toggle checked={field.value} onChange={field.onChange} label="Active (visible in store)" />
                  )}
                />
                <Controller
                  name="isFeatured"
                  control={control}
                  render={({ field }) => (
                    <Toggle checked={field.value} onChange={field.onChange} label="Featured on Homepage ⭐" />
                  )}
                />
              </div>
            </div>
          </StaggerItem>

          {/* ── Submit ──────────────────────────────────────────────────────── */}
          <StaggerItem>
            <div className="flex justify-end gap-3 pb-4">
              <button
                type="button"
                onClick={() => onSuccess?.()}
                className="px-6 py-2.5 rounded-xl text-sm font-medium border border-stone-200 text-stone-700
                           hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>

              <motion.button
                type="submit"
                disabled={isSubmitting || saveMutation.isPending || imgUploading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-2.5 rounded-xl text-sm font-semibold text-white
                           disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                style={{ background: isSubmitting || saveMutation.isPending ? "#6b7280" : C.forest }}
              >
                {isSubmitting || saveMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving…
                  </span>
                ) : (
                  isEditing ? "Update Product" : "Create Product 🌿"
                )}
              </motion.button>
            </div>
          </StaggerItem>

        </StaggerContainer>
      </form>
    </PageTransition>
  );
}
