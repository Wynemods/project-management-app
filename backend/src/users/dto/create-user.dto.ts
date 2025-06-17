import { Exclude } from 'class-transformer';
import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';
import { Project } from 'src/projects/interface/project.interface';

export class CreateUserDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password must contain uppercase, lowercase, and number/special character',
  })
  password: string;

  @IsOptional()
  @IsEnum(UserRole, {
    message: `Role must be one of: ${Object.values(UserRole).join(', ')}`,
  })
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  profileImageId?: string;
  @IsOptional()
  profileImageUrl?: string;
}

export class UserResponseDto {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
  assignedProject: Project | null;

  profileImageId: string | null;
  profileImageUrl: string | null;
  
  @Exclude()
  password: string;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}