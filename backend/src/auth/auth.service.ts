import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserRole } from 'generated/prisma';

import { JwtPayload } from './interfaces/jwt.interface';
import { AuthResponse, AuthUser } from './interfaces/auth.interface';

import { UsersService } from '../users/users.service';
import { TokenService } from './services/token.service'; 

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private tokenService: TokenService,
  ) {}

  private readonly logger = new Logger(AuthService.name);

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    try {
      try {
        await this.usersService.findUserByEmail(registerDto.email);
        throw new ConflictException('User with this email already exists');
      } catch (error) {
        if (error instanceof ConflictException) {
          throw error;
        }
      }

      const user = await this.usersService.createUser({
        name: registerDto.name,
        email: registerDto.email,
        password: registerDto.password,
        role: registerDto.role || UserRole.USER,
      });

      // Send welcome emails
      // try {
        // await this.mailerService.sendWelcomeEmail(user.email, {
        //   name: user.name,
        //   email: user.email,
        // });
      //   console.log(`Welcome email would be sent to ${user.email}`);
      // } catch (emailError) {
      //   console.warn(`Failed to send welcome email to ${user.email}:`, emailError.message);
      // }

      
      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const access_token = this.tokenService.generateToken(payload);

      await this.usersService.updateUserLastLogin(user.id);

      return {
        access_token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          lastLogin: new Date(),
        },
        message: 'Registration successful',
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to register user');
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    this.logger.log(`Attempting login for email: ${loginDto.email}`);
  
    try {
      let user;
      try {
        user = await this.usersService.findUserByEmail(loginDto.email);
        this.logger.debug(`User found: ${user.id}`);
      } catch (error) {
        if (error instanceof NotFoundException) {
          this.logger.warn(`Login failed: User not found for email ${loginDto.email}`);
          throw new UnauthorizedException('Invalid credentials');
        }
        this.logger.error(`Unexpected error during user lookup: ${error.message}`, error.stack);
        throw error;
      }
  
      if (!user.isActive) {
        this.logger.warn(`Login attempt for deactivated account: ${loginDto.email}`);
        throw new UnauthorizedException('Account is deactivated');
      }
      this.logger.log('User found and active');
      const userWithPassword = await this.usersService.getUserWithPassword(loginDto.email);

      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        userWithPassword.password,
      );
      this.logger.log(`Password comparison result: ${isPasswordValid}`);
  
      if (!isPasswordValid) {
        this.logger.warn(`Invalid password attempt for email: ${loginDto.email}`);
        throw new UnauthorizedException('Invalid credentials');
      }
  
      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };
  
      const access_token = this.tokenService.generateToken(payload);
  
      await this.usersService.updateUserLastLogin(user.id);
      this.logger.log(`Login successful for user: ${user.id}`);
  
      return {
        access_token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          lastLogin: new Date(),
        },
        message: 'Login successful, Welcome back!',
      };
    } catch (error) {
      if (!(error instanceof UnauthorizedException)) {
        this.logger.error(`Unhandled error during login: ${error.message}`, error.stack);
      }
      throw new UnauthorizedException('Invalid credentials');
    }
  }
  

  async validateToken(token: string): Promise<AuthUser> {
    try {
      const payload = this.tokenService.verifyToken(token);
      const user = await this.usersService.findOneUser(payload.sub);

      if (!user.isActive) {
        throw new UnauthorizedException('User account is deactivated');
      }

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        isActive: user.isActive,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid token');
    }
  }

  async refreshToken(token: string): Promise<{ access_token: string }> {
    try {
      const payload = this.tokenService.verifyToken(token);
      const user = await this.usersService.findOneUser(payload.sub);

      if (!user.isActive) {
        throw new UnauthorizedException('User account is deactivated');
      }

      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const access_token = this.tokenService.generateToken(newPayload);

      await this.usersService.updateUserLastLogin(user.id);

      return { access_token };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<{ message: string }> {
    try {
      await this.usersService.updateUserLastLogin(userId);
      
      return { message: 'Logged out successfully' };
    } catch (error) {
      throw new InternalServerErrorException('Failed to logout');
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    try {
      const result = await this.usersService.changeUserPassword(
        userId,
        currentPassword,
        newPassword,
      );

      return result;
    } catch (error) {
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      let user;
      try {
        user = await this.usersService.findUserByEmail(email);
      } catch (error) {
        return { message: 'If your email is registered, you will receive a password reset link.' };
      }

      if (!user.isActive) {
        return { message: 'If your email is registered, you will receive a password reset link.' };
      }

      // Generate password reset token (you might want to implement this)
      // const resetToken = this.tokenService.generateResetToken(user.id);
      
      // Send password reset email
      try {
        // await this.mailerService.sendPasswordResetEmail(user.email, {
        //   name: user.name,
        //   resetToken,
        //   resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
        // });
        console.log(`Password reset email would be sent to ${user.email}`);
      } catch (emailError) {
        console.warn(`Failed to send password reset email to ${user.email}:`, emailError.message);
      }

      return { message: 'If your email is registered, you will receive a password reset link.' };
    } catch (error) {
      throw new InternalServerErrorException('Failed to process password reset request');
    }
  }

}