import multer from "multer";
import type { UploadApiOptions, UploadApiResponse } from "cloudinary";
import { cloudinary } from "../config/cloudinary";
import { AppError } from "../utils/app-error";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

const baseMulter = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new AppError("Only image files (JPG, PNG, WebP) are allowed", 400, "INVALID_FILE_TYPE"));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// For doctor profile photo upload (expects 'photo' field)
export const uploadMiddleware = baseMulter.single("photo");

// For article cover and inline images (accepts 'image' or 'file' or 'photo')
export const uploadArticleImageMiddleware = baseMulter.single("image");

// Flexible single image upload supporting either field
export const uploadFlexibleImageMiddleware = (
  req: any,
  res: any,
  next: any
) => {
  const handler = baseMulter.fields([
    { name: "photo", maxCount: 1 },
    { name: "image", maxCount: 1 },
    { name: "file", maxCount: 1 }
  ]);

  handler(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return next(new AppError("File size exceeds 5MB limit", 400, "FILE_TOO_LARGE"));
      }
      return next(err);
    }

    // Attach single file to req.file if uploaded through fields
    if (req.files) {
      const file =
        req.files.photo?.[0] ||
        req.files.image?.[0] ||
        req.files.file?.[0];
      if (file) {
        req.file = file;
      }
    }
    next();
  });
};

export const uploadToCloudinary = (
  buffer: Buffer,
  options: UploadApiOptions
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result!);
    });
    stream.end(buffer);
  });
};
