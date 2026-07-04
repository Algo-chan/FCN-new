import multer from "multer";
import type { UploadApiOptions, UploadApiResponse } from "cloudinary";
import { cloudinary } from "../config/cloudinary";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (JPG, PNG, WebP) are allowed"));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024
  }
}).single("photo");

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
