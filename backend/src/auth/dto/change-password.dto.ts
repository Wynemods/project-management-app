import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldP@ssw0rd!', description: 'Current password' })
  @IsString({ message: 'Current password must be a string' })
  @IsNotEmpty({ message: 'Current password is required' })
  currentPassword: string;

  @ApiProperty({
    example: 'NewP@ssw0rd123',
    description: 'New password with at least 8 characters, including uppercase, lowercase, and number/special char',
  })
  @IsString({ message: 'New password must be a string' })
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'New password must contain uppercase, lowercase, and number/special character',
  })
  newPassword: string;
}
