import { ApiProperty } from '@nestjs/swagger';

export class UploadImageResponseDto {
  @ApiProperty({ description: 'Image public ID in Cloudinary' })
  publicId: string;

  @ApiProperty({ description: 'Image URL' })
  url: string;

  @ApiProperty({ description: 'Secure HTTPS URL' })
  secureUrl: string;

  @ApiProperty({ description: 'Image width in pixels' })
  width: number;

  @ApiProperty({ description: 'Image height in pixels' })
  height: number;

  @ApiProperty({ description: 'Image format' })
  format: string;

  @ApiProperty({ description: 'File size in bytes' })
  bytes: number;

  constructor(partial: Partial<UploadImageResponseDto>) {
    Object.assign(this, partial);
  }
}