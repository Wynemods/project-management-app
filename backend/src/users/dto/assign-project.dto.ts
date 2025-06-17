import { IsNotEmpty, IsString } from 'class-validator';

export class AssignProjectDto {
  @IsString({ message: 'User ID must be a string' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;

  @IsString({ message: 'Project ID must be a string' })
  @IsNotEmpty({ message: 'Project ID is required' })
  projectId: string;
}
