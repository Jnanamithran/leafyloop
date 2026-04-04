// ─── server/routes/productRoutes.js ───────────────────────────────────────────
import express from "express";
import multer from "multer";
import { Product } from "../models/Product.js";
import { uploadImageBuffer, deleteImages } from "../utils/cloudinary.js";
import { protect, adminOnly, optionalAuth } from "../middleware/authMiddleware.js";

const router  = express.Router();
const upload  = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// ─── Public Routes ────────────────────────────────────────────────────────────

/** GET /api/products?category=Indoor&search=monstera&minPrice=0&maxPrice=5000&sort=price&page=1 */
router.get("/", optionalAuth, async (req, res) => {
  try {
    const {
      category, search, minPrice, maxPrice,
      sort = "-createdAt", page = 1, limit = 12,
      featured, petFriendly, airPurifying,
    } = req.query;

    const filter = { isActive: true };

    if (category)    filter.category    = category;
    if (featured)    filter.isFeatured  = true;
    if (petFriendly) filter.petFriendly = true;
    if (airPurifying) filter.airPurifying = true;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (search) {
      filter.$text = { $search: search };
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .select("-reviews -__v"),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      products,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/** GET /api/products/:slug */
router.get("/:slug", optionalAuth, async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true })
      .populate("reviews.user", "name avatar");
    if (!product) return res.status(404).json({ success: false, message: "Product not found." });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/** POST /api/products/:id/reviews */
router.post("/:id/reviews", protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found." });

    const alreadyReviewed = product.reviews.some(
      (r) => r.user.toString() === req.user._id.toString()
    );
    if (alreadyReviewed) return res.status(400).json({ success: false, message: "Already reviewed." });

    product.reviews.push({ user: req.user._id, name: req.user.name, rating, comment });
    await product.save();
    res.status(201).json({ success: true, message: "Review added." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Admin Routes ─────────────────────────────────────────────────────────────

/** POST /api/admin/products/upload-images — Cloudinary upload */
router.post(
  "/admin/upload-images",
  protect,
  adminOnly,
  upload.array("images", 5),
  async (req, res) => {
    try {
      if (!req.files?.length) return res.status(400).json({ success: false, message: "No files uploaded." });

      const uploads = await Promise.all(
        req.files.map((f) => uploadImageBuffer(f.buffer))
      );

      res.json({
        success: true,
        images:  uploads.map((u, i) => ({ ...u, isPrimary: i === 0 })),
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

/** POST /api/admin/products */
router.post("/admin", protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/** PUT /api/admin/products/:id */
router.put("/admin/:id", protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!product) return res.status(404).json({ success: false, message: "Product not found." });
    res.json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

/** DELETE /api/admin/products/:id */
router.delete("/admin/:id", protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found." });

    // Delete images from Cloudinary
    const publicIds = product.images.map((img) => img.publicId).filter(Boolean);
    if (publicIds.length) await deleteImages(publicIds);

    await product.deleteOne();
    res.json({ success: true, message: "Product deleted." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
