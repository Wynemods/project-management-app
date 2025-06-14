// src/modules/auth/controllers/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from '../users/guards/jwt/jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // User Registration
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // User Login
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // Token Refresh (requires authentication)
  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Req() req) {
    // Extract token from Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    return this.authService.refreshToken(token);
  }

  // Validate Token (for internal or debugging purposes)
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validateToken(@Body('token') token: string) {
    return this.authService.validateToken(token);
  }
}
