import type { UploadApiOptions, UploadApiResponse } from "cloudinary";
import { cloudinary } from "../config/cloudinary";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { AppError } from "../utils/app-error";

export class CloudinaryService {
  isConfigured(): boolean {
    return Boolean(
      env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_API_KEY &&
      env.CLOUDINARY_API_SECRET
    );
  }

  private uploadStream(buffer: Buffer, options: UploadApiOptions): Promise<UploadApiResponse> {
    if (!this.isConfigured()) {
      throw new AppError(
        "Cloudinary storage is not properly configured on the server",
        503,
        "STORAGE_NOT_CONFIGURED"
      );
    }

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error) {
          logger.error("Cloudinary upload failed", { error: error.message });
          reject(new AppError(`Image upload failed: ${error.message}`, 502, "UPLOAD_FAILED"));
        } else if (result) {
          resolve(result);
        } else {
          reject(new AppError("Cloudinary upload returned empty response", 502, "UPLOAD_FAILED"));
        }
      });
      stream.end(buffer);
    });
  }

  /**
   * Uploads a doctor's portrait photo with AI face-centering crop and WebP conversion
   */
  async uploadDoctorPhoto(
    buffer: Buffer,
    identifier: string
  ): Promise<{ url: string; public_id: string }> {
    const cleanId = identifier.replace(/[^a-zA-Z0-9_-]/g, "_");
    const result = await this.uploadStream(buffer, {
      folder: "fcn/doctor-photos",
      public_id: `doctor-${cleanId}-${Date.now()}`,
      resource_type: "image",
      transformation: [
        {
          width: 500,
          height: 500,
          crop: "fill",
          gravity: "face",
          quality: "auto",
          fetch_format: "webp"
        }
      ]
    });

    return {
      url: result.secure_url,
      public_id: result.public_id
    };
  }

  /**
   * Uploads clinical article images (covers or in-article charts/illustrations)
   */
  async uploadArticleImage(
    buffer: Buffer,
    identifier: string = "article"
  ): Promise<{ url: string; public_id: string }> {
    const cleanId = identifier.replace(/[^a-zA-Z0-9_-]/g, "_");
    const result = await this.uploadStream(buffer, {
      folder: "fcn/articles",
      public_id: `${cleanId}-${Date.now()}`,
      resource_type: "image",
      transformation: [
        {
          width: 1600,
          crop: "limit",
          quality: "auto",
          fetch_format: "webp"
        }
      ]
    });

    return {
      url: result.secure_url,
      public_id: result.public_id
    };
  }

  /**
   * Safely deletes an image asset from Cloudinary
   */
  async deleteImage(publicId: string): Promise<void> {
    if (!this.isConfigured() || !publicId) return;

    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      logger.warn("Failed to delete asset from Cloudinary", {
        publicId,
        error: (err as Error).message
      });
    }
  }
}

export const cloudinaryService = new CloudinaryService();
