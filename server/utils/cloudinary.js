import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

// ─── Configuration ─────────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

const UPLOAD_FOLDER = "leafyloop/products";

// ─── Upload from Buffer (Multer memory storage) ───────────────────────────────
/**
 * Uploads an image buffer to Cloudinary and returns URL + public_id.
 *
 * @param {Buffer} buffer     - File buffer from multer
 * @param {string} folder     - Cloudinary folder (default: leafyloop/products)
 * @param {Object} options    - Extra Cloudinary upload options
 * @returns {Promise<{ url: string, publicId: string, width: number, height: number }>}
 */
export function uploadImageBuffer(buffer, folder = UPLOAD_FOLDER, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type:      "image",
        allowed_formats:    ["jpg", "jpeg", "png", "webp", "avif"],
        transformation: [
          { width: 1200, height: 1200, crop: "limit", quality: "auto:good", fetch_format: "auto" },
        ],
        ...options,
      },
      (error, result) => {
        if (error) return reject(new Error(`Cloudinary upload failed: ${error.message}`));
        resolve({
          url:      result.secure_url,
          publicId: result.public_id,
          width:    result.width,
          height:   result.height,
          format:   result.format,
        });
      }
    );

    // Pipe buffer into the upload stream
    Readable.from(buffer).pipe(uploadStream);
  });
}

// ─── Upload from URL ──────────────────────────────────────────────────────────
export async function uploadImageFromUrl(imageUrl, folder = UPLOAD_FOLDER) {
  const result = await cloudinary.uploader.upload(imageUrl, {
    folder,
    resource_type: "image",
    transformation: [
      { width: 1200, height: 1200, crop: "limit", quality: "auto:good", fetch_format: "auto" },
    ],
  });
  return { url: result.secure_url, publicId: result.public_id };
}

// ─── Delete Image ─────────────────────────────────────────────────────────────
export async function deleteImage(publicId) {
  if (!publicId) return null;
  const result = await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  return result;
}

// ─── Bulk Delete ──────────────────────────────────────────────────────────────
export async function deleteImages(publicIds = []) {
  if (!publicIds.length) return;
  return cloudinary.api.delete_resources(publicIds, { resource_type: "image" });
}

// ─── Generate Thumbnail URL ───────────────────────────────────────────────────
/**
 * Returns an optimized thumbnail URL from a Cloudinary URL.
 * Doesn't make an API call — uses URL transformation.
 */
export function getThumbnailUrl(cloudinaryUrl, width = 400, height = 400) {
  if (!cloudinaryUrl) return "/placeholder.jpg";
  // Insert transformation into the Cloudinary URL
  return cloudinaryUrl.replace(
    "/upload/",
    `/upload/w_${width},h_${height},c_fill,q_auto,f_auto/`
  );
}

export { cloudinary };
