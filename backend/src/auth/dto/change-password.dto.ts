import { 
    IsString, 
    MinLength,
  } from 'class-validator';
  
  export class ChangePasswordDto {
    @IsString({ message: 'Current password is required' })
    currentPassword: string;
  
    @IsString({ message: 'New password is required' })
    @MinLength(4, { message: 'New password must be at least 4 characters long' })
    newPassword: string;
  }