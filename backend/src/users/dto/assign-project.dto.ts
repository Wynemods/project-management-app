import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignProjectDto {
  @IsUUID('4', { message: 'Invalid user ID' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;

  @IsUUID('4', { message: 'Invalid project ID' })
  @IsNotEmpty({ message: 'Project ID is required' })
  projectId: string;
}