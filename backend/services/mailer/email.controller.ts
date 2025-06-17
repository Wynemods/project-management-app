import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiProperty,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { EmailService } from './email.service';

import { Roles } from 'src/auth/decorators/roles.decorator';

import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { IsEmail, IsNotEmpty } from 'class-validator';

class SendTestEmailDto {
  @ApiProperty({
    description: 'Email address to send test email to',
    example: 'test@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}

@ApiTags('emails')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('emails')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send test email (Admin only)' })
  @ApiResponse({ status: 200, description: 'Test email sent successfully' })
  async sendTestEmail(
    @Body() body: SendTestEmailDto,
  ): Promise<{ message: string }> {
    await this.emailService.sendTestEmail(body.email);
    return { message: 'Test email sent successfully' };
  }
}
