import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

export interface CloudinaryUploadResult {
  public_id: string;
  url: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  bytes: number;
}

@Injectable()
export class CloudinaryService {
  constructor(
    @Inject('CLOUDINARY') private cloudinaryInstance: typeof cloudinary,
  ) {}

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'profiles',
    publicId?: string,
  ): Promise<CloudinaryUploadResult> {
    try {
      // Validate file type
      if (!this.isValidImageType(file.mimetype)) {
        throw new BadRequestException('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        throw new BadRequestException('File size too large. Maximum 5MB allowed.');
      }

      const uploadOptions = {
        folder,
        resource_type: 'image' as const,
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto' },
          { format: 'webp' }
        ],
        ...(publicId && { public_id: publicId }),
      };

      return new Promise((resolve, reject) => {
        const uploadStream = this.cloudinaryInstance.uploader.upload_stream(
          uploadOptions,
          (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
            if (error) {
              reject(new BadRequestException(`Upload failed: ${error.message}`));
            } else if (result) {
              resolve({
                public_id: result.public_id,
                url: result.url,
                secure_url: result.secure_url,
                width: result.width,
                height: result.height,
                format: result.format,
                resource_type: result.resource_type,
                bytes: result.bytes,
              });
            } else {
              reject(new BadRequestException('Upload failed: Unknown error'));
            }
          },
        );

        uploadStream.end(file.buffer);
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Image upload failed: ${error.message}`);
    }
  }

  async deleteImage(publicId: string): Promise<{ result: string }> {
    try {
      const result = await this.cloudinaryInstance.uploader.destroy(publicId);
      return result;
    } catch (error) {
      throw new BadRequestException(`Failed to delete image: ${error.message}`);
    }
  }

  async updateImage(
    file: Express.Multer.File,
    oldPublicId: string,
    folder: string = 'profiles',
  ): Promise<CloudinaryUploadResult> {
    try {
      // Upload new image
      const newImage = await this.uploadImage(file, folder);

      // Delete old image if upload successful
      if (oldPublicId) {
        try {
          await this.deleteImage(oldPublicId);
        } catch (error) {
          console.warn(`Failed to delete old image ${oldPublicId}:`, error.message);
        }
      }

      return newImage;
    } catch (error) {
      throw error;
    }
  }

  private isValidImageType(mimetype: string): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    return validTypes.includes(mimetype);
  }

  generateTransformationUrl(publicId: string, transformations: any[] = []): string {
    return this.cloudinaryInstance.url(publicId, {
      transformation: transformations.length > 0 ? transformations : [
        { width: 400, height: 400, crop: 'fill' },
        { quality: 'auto' },
        { format: 'webp' }
      ]
    });
  }
}
