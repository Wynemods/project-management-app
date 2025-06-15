import { IsOptional, IsString, MinLength, MaxLength, IsEnum, IsDate, IsUUID } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ProjectStatus } from "generated/prisma";

export class UpdateProjectDto {
    @ApiPropertyOptional({ description: 'Project name', minLength: 2, maxLength: 100 })
    @IsOptional()
    @IsString({ message: 'Name must be a string' })
    @MinLength(2, { message: 'Name must be at least 2 characters long' })
    @MaxLength(100, { message: 'Name must not exceed 100 characters' })
    name?: string;
  
    @ApiPropertyOptional({ description: 'Project description', maxLength: 1000 })
    @IsOptional()
    @IsString({ message: 'Description must be a string' })
    @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
    description?: string;
  
    @ApiPropertyOptional({ description: 'Project end date' })
    @IsOptional()
    @IsDate({ message: 'End date must be a valid date' })
    @Type(() => Date)
    endDate?: Date;
  
    @ApiPropertyOptional({ 
      description: 'Project status',
      enum: ProjectStatus 
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