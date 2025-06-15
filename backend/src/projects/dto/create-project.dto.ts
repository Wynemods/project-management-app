import { 
    IsString, 
    IsNotEmpty, 
    IsOptional, 
    IsEnum, 
    IsDate, 
    IsUUID,
    MinLength,
    MaxLength 
  } from 'class-validator';
  import { Type } from 'class-transformer';
  import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
  import { ProjectStatus } from 'generated/prisma';
import { AuthUser } from 'src/auth/interfaces/auth.interface';
  
  export class CreateProjectDto {
    @ApiProperty({ description: 'Project name', minLength: 2, maxLength: 100 })
    @IsString({ message: 'Name must be a string' })
    @IsNotEmpty({ message: 'Name is required' })
    @MinLength(2, { message: 'Name must be at least 2 characters long' })
    @MaxLength(100, { message: 'Name must not exceed 100 characters' })
    name: string;
  
    @ApiPropertyOptional({ description: 'Project description', maxLength: 1000 })
    @IsOptional()
    @IsString({ message: 'Description must be a string' })
    @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
    description?: string;
  
    @ApiProperty({ description: 'Project end date' })
    @IsDate({ message: 'End date must be a valid date' })
    @Type(() => Date)
    endDate: Date;
  
    @ApiPropertyOptional({ 
      description: 'Project status',
      enum: ProjectStatus,
      default: ProjectStatus.NOT_STARTED
    })
    @IsOptional()
    @IsEnum(ProjectStatus, {
      message: `Status must be one of: ${Object.values(ProjectStatus).join(', ')}`,
    })
    status?: ProjectStatus;
  
    @ApiPropertyOptional({ description: 'User ID to assign to this project' })
    @IsOptional()
    @IsUUID('4', { message: 'Assigned user ID must be a valid UUID' })
    assignedUserId?: string;
  }


  export class ProjectResponseDto {
    id: string;
    name: string;
    description: string | null;
    status: ProjectStatus;
    endDate: Date;
    createdAt: Date;
    updatedAt: Date;
    assignedUser?: AuthUser | null;
  
    constructor(partial: Partial<ProjectResponseDto>) {
      Object.assign(this, partial);
    }
  }