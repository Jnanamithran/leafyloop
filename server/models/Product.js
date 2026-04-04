import mongoose from "mongoose";

// ─── Sub-schemas ──────────────────────────────────────────────────────────────
const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    avatar: String,
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

// ─── Product Schema ───────────────────────────────────────────────────────────
const productSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [120, "Name cannot exceed 120 characters"],
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [3000, "Description cannot exceed 3000 characters"],
    },

    shortDescription: {
      type: String,
      maxlength: 200,
      default: "",
    },

    // ── Categorisation ────────────────────────────────────────────────────────
    category: {
      type: String,
      required: true,
      enum: [
        "Indoor",
        "Outdoor",
        "Fertilizer",
        "Seeds",
        "Pots & Planters",
        "Tools",
      ],
    },

    tags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],

    // ── Pricing ───────────────────────────────────────────────────────────────
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },

    compareAtPrice: {
      type: Number,
      min: 0,
      default: null,
    },

    // ── Inventory ─────────────────────────────────────────────────────────────
    stock: {
      type: Number,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },

    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    // ── Plant-specific Attributes ──────────────────────────────────────────────
    height: {
      type: String,
      enum: ["Upto 30cm", "30–60cm", "60cm–1m", "1m–2m", "2m+"],
    },

    sunlight: {
      type: String,
      enum: ["Low Light", "Indirect Light", "Bright Indirect", "Full Sun"],
    },

    water: {
      type: String,
      enum: ["Daily", "Every 2–3 Days", "Weekly", "Bi-Weekly", "Monthly"],
    },

    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Expert"],
      default: "Beginner",
    },

    petFriendly: { type: Boolean, default: false },
    airPurifying: { type: Boolean, default: false },

    // ── Fertilizer-specific ───────────────────────────────────────────────────
    fertilizerType: {
      type: String,
      enum: ["Organic", "Chemical", "Bio-Fertilizer"],
      default: null,
    },

    npkRatio: {
      type: String,
      default: null,
    },

    weightKg: {
      type: Number,
      default: null,
    },

    // ── Images ────────────────────────────────────────────────────────────────
    images: [
      {
        url: { type: String, required: true },
        publicId: String,
        alt: String,
        isPrimary: { type: Boolean, default: false },
      },
    ],

    // ── Ratings ───────────────────────────────────────────────────────────────
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    numReviews: {
      type: Number,
      default: 0,
    },

    reviews: [reviewSchema],

    // ── SEO ───────────────────────────────────────────────────────────────────
    metaTitle: String,
    metaDescription: String,

    // ── Status ────────────────────────────────────────────────────────────────
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtuals ─────────────────────────────────────────────────────────────────
productSchema.virtual("primaryImage").get(function () {
  if (!this.images || this.images.length === 0) return "/placeholder.jpg";

  return (
    this.images.find((img) => img.isPrimary)?.url ||
    this.images[0].url
  );
});

productSchema.virtual("discountPercent").get(function () {
  if (!this.compareAtPrice || this.compareAtPrice <= this.price) return 0;

  return Math.round(
    ((this.compareAtPrice - this.price) / this.compareAtPrice) * 100
  );
});

productSchema.virtual("inStock").get(function () {
  return this.stock > 0;
});

// ─── Pre-save Hooks ───────────────────────────────────────────────────────────
productSchema.pre("save", function (next) {
  // ✅ Always generate slug if missing OR name changed
  if (this.isModified("name") || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  // ✅ Safe rating calculation
  if (this.isModified("reviews")) {
    this.numReviews = this.reviews.length;

    if (this.reviews.length === 0) {
      this.rating = 0;
    } else {
      const total = this.reviews.reduce((sum, r) => sum + r.rating, 0);
      this.rating = +(total / this.reviews.length).toFixed(1);
    }
  }

  next();
});

// ─── Indexes (OPTIMIZED & NO DUPLICATES) ──────────────────────────────────────
productSchema.index({
  name: "text",
  description: "text",
  tags: "text",
});

productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ isFeatured: 1, isActive: 1 });

// ❌ REMOVED duplicate slug index (fixes warning)

// ─── Model ────────────────────────────────────────────────────────────────────
export const Product = mongoose.model("Product", productSchema);