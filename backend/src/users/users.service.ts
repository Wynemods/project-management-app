import {
  ConflictException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserRole } from 'generated/prisma';
import { getPrismaClient } from 'src/config/prisma.config';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/create-user.dto';
import { User } from './interfaces/user.interface';

@Injectable()
export class UsersService {
  private prisma = getPrismaClient();
  private readonly saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;

  async createUser(data: CreateUserDto): Promise<UserResponseDto> {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        throw new ConflictException(
          `User with email ${data.email} already exists`,
        );
      }

      const hashedPassword = await bcrypt.hash(data.password, this.saltRounds);

      const user = await this.prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: data.role || UserRole.USER,
          isActive: data.isActive ?? true,
        },
        include: {
          assignedProject: {
            select: { id: true, name: true, status: true }
          }
        }
      });

      return this.toResponseDto(user);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to create user: ${error.message}`,
      );
    }
  }

  async findAllUsers(): Promise<UserResponseDto[]> {
    try {
      const users = await this.prisma.user.findMany({
        include: {
          assignedProject: {
            select: { id: true, name: true, status: true }
          }
        },
        orderBy: { createdAt: 'desc' },
      });
      return users.map(user => this.toResponseDto(user));
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve users');
    }
  }

  async findActiveUsers(): Promise<UserResponseDto[]> {
    try {
      const users = await this.prisma.user.findMany({
        where: { isActive: true },
        include: {
          assignedProject: {
            select: { id: true, name: true, status: true }
          }
        },
        orderBy: { createdAt: 'desc' },
      });
      return users.map(user => this.toResponseDto(user));
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve active users',
      );
    }
  }

  async findUsersWithoutProject(): Promise<UserResponseDto[]> {
    try {
      const users = await this.prisma.user.findMany({
        where: { 
          isActive: true,
          role: UserRole.USER,
          assignedProject: null
        },
        orderBy: { createdAt: 'desc' },
      });
      return users.map(user => this.toResponseDto(user));
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve users without projects',
      );
    }
  }

  async findUserByRole(role: UserRole): Promise<UserResponseDto[]> {
    try {
      const users = await this.prisma.user.findMany({
        where: { role, isActive: true },
        include: {
          assignedProject: {
            select: { id: true, name: true, status: true }
          }
        },
        orderBy: { createdAt: 'desc' },
      });
      return users.map(user => this.toResponseDto(user));
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to retrieve users with role ${role}`,
      );
    }
  }

  async findOneUser(id: string): Promise<UserResponseDto> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          assignedProject: {
            select: { id: true, name: true, description: true, status: true, endDate: true }
          }
        },
      });

      if (!user) {
        throw new NotFoundException(`User with id ${id} not found`);
      }

      return this.toResponseDto(user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve user');
    }
  }

  async findUserByEmail(email: string): Promise<UserResponseDto> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: {
          assignedProject: {
            select: { id: true, name: true, status: true }
          }
        },
      });

      if (!user) {
        throw new NotFoundException(`User with email ${email} not found`);
      }

      return this.toResponseDto(user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve user');
    }
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<UserResponseDto> {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!existingUser) {
        throw new NotFoundException(`User with id ${id} not found`);
      }

      if (data.email && data.email !== existingUser.email) {
        const emailConflict = await this.prisma.user.findUnique({
          where: { email: data.email },
        });

        if (emailConflict) {
          throw new ConflictException('Another user with this email exists');
        }
      }

      const updateData: any = {};
      
      if (data.name) updateData.name = data.name;
      if (data.email) updateData.email = data.email;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.role) updateData.role = data.role;
      
      if (data.password) {
        updateData.password = await bcrypt.hash(data.password, this.saltRounds);
      }

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updateData,
        include: {
          assignedProject: {
            select: { id: true, name: true, status: true }
          }
        },
      });

      return this.toResponseDto(updatedUser);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update user');
    }
  }

  async updateUserLastLogin(id: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id },
        data: { lastLogin: new Date() },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to update last login');
    }
  }

  async assignUserProject(userId: string, projectId: string): Promise<UserResponseDto> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { assignedProject: true }
      });

      if (!user) {
        throw new NotFoundException(`User with id ${userId} not found`);
      }

      if (user.role === UserRole.ADMIN) {
        throw new BadRequestException('Cannot assign projects to admin users');
      }

      if (user.assignedProject) {
        throw new ConflictException('User already has an assigned project');
      }

      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        include: { assignedUser: true }
      });

      if (!project) {
        throw new NotFoundException(`Project with id ${projectId} not found`);
      }

      if (project.assignedUser) {
        throw new ConflictException('Project is already assigned to another user');
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          assignedProject: {
            connect: { id: projectId }
          }
        },
        include: {
          assignedProject: {
            select: { id: true, name: true, description: true, status: true, endDate: true }
          }
        },
      });

      return this.toResponseDto(updatedUser);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to assign project');
    }
  }

  async unassignUserProject(userId: string): Promise<UserResponseDto> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { assignedProject: true }
      });

      if (!user) {
        throw new NotFoundException(`User with id ${userId} not found`);
      }

      if (!user.assignedProject) {
        throw new BadRequestException('User has no assigned project');
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          assignedProject: {
            disconnect: true
          }
        },
        include: {
          assignedProject: {
            select: { id: true, name: true, status: true }
          }
        },
      });

      return this.toResponseDto(updatedUser);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to unassign project');
    }
  }

  async getUserWithPassword(email: string): Promise<User> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: {
          assignedProject: {
            select: { id: true, name: true, status: true }
          }
        }
      });

      if (!user) {
        throw new NotFoundException(`User with email ${email} not found`);
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve user');
    }
  }

  async changeUserPassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException(`User with id ${id} not found`);
      }

      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      );
      
      if (!isCurrentPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, this.saltRounds);

      await this.prisma.user.update({
        where: { id },
        data: { password: hashedNewPassword },
      });

      return { message: 'Password changed successfully' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to change password');
    }
  }

  async deactivateUser(id: string): Promise<{ message: string }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id, isActive: true },
      });

      if (!user) {
        throw new NotFoundException(`User with id ${id} not found`);
      }

      await this.prisma.user.update({
        where: { id },
        data: { isActive: false },
      });

      return { message: `User ${user.name} has been deactivated successfully` };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to deactivate user');
    }
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: { assignedProject: true }
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      if (user.assignedProject) {
        await this.prisma.project.update({
          where: { id: user.assignedProject.id },
          data: { assignedUserId: null }
        });
      }

      await this.prisma.user.delete({
        where: { id },
      });

      return { message: `User ${user.name} has been permanently deleted` };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete user');
    }
  }

  private toResponseDto(user: any): UserResponseDto {
    return new UserResponseDto({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      assignedProject: user.assignedProject,
    });
  }
}