import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';

import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/create-user.dto';
import { ChangePasswordDto } from 'src/auth/dto/change-password.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthenticatedUser } from 'src/auth/interfaces/jwt.interface';
import { FileUploadInterceptor } from 'src/common/interceptors/file-upload.interceptor';
import { multerOptions } from 'src/config/multer.config';
import { UploadImageResponseDto } from './dto/upload-image.dto';
import { CloudinaryService } from 'services/cloudinary/cloudinary.service';

@ApiTags('users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiQuery({
    name: 'active',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: UserRole,
    description: 'Filter by user role',
  })
  @ApiQuery({
    name: 'withoutProject',
    required: false,
    type: Boolean,
    description: 'Get users without assigned projects',
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: [UserResponseDto],
  })
  async findAll(
    @Query('active') active?: string,
    @Query('role') role?: UserRole,
    @Query('withoutProject') withoutProject?: string,
  ): Promise<UserResponseDto[]> {
    if (withoutProject === 'true') {
      return this.usersService.findUsersWithoutProject();
    }

    if (role) {
      return this.usersService.findUserByRole(role);
    }

    if (active === 'true') {
      return this.usersService.findActiveUsers();
    }

    return this.usersService.findAllUsers();
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserResponseDto,
  })
  async getProfile(
    @CurrentUser('id') userId: string,
  ): Promise<UserResponseDto> {
    return this.usersService.findOneUser(userId);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    return this.usersService.findOneUser(id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: UserResponseDto,
  })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const { role, ...userUpdate } = updateUserDto;
    return this.usersService.updateUser(userId, userUpdate);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change current user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Current password is incorrect' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.usersService.changeUserPassword(
      userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }

  @Post(':id/change-password')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change user password (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  async changeUserPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.usersService.changeUserPassword(
      id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }

  @Post(':userId/assign-project/:projectId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign project to user (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'projectId', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'Project assigned successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User or project not found' })
  @ApiResponse({
    status: 409,
    description: 'User already has a project or project already assigned',
  })
  async assignProject(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ): Promise<UserResponseDto> {
    return this.usersService.assignUserProject(userId, projectId);
  }

  @Delete(':userId/unassign-project')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unassign project from user (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Project unassigned successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'User has no assigned project' })
  async unassignProject(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<UserResponseDto> {
    return this.usersService.unassignUserProject(userId);
  }

  @Patch(':id/deactivate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate user (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.usersService.deactivateUser(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Permanently delete user (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.usersService.deleteUser(id);
  }

  @Post('profile-image')
  @UseInterceptors(
    FileInterceptor('image', multerOptions),
    FileUploadInterceptor,
  )
  @ApiOperation({ summary: 'Upload profile image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Profile image file (JPEG, PNG, WebP - max 5MB)',
        },
      },
      required: ['image'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
    type: UploadImageResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file or upload failed' })
  async uploadProfileImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UploadImageResponseDto> {
    try {
      const currentUser = await this.usersService.findOneUser(user.id);

      let uploadResult;

      if (currentUser.profileImageId) {
        uploadResult = await this.cloudinaryService.updateImage(
          file,
          currentUser.profileImageId,
          'profiles',
        );
      } else {
        uploadResult = await this.cloudinaryService.uploadImage(
          file,
          'profiles',
          `profile_${user.id}_${Date.now()}`,
        );
      }

      await this.usersService.updateProfileImage(user.id, {
        profileImageId: uploadResult.public_id,
        profileImageUrl: uploadResult.secure_url,
      });

      return new UploadImageResponseDto({
        publicId: uploadResult.public_id,
        url: uploadResult.url,
        secureUrl: uploadResult.secure_url,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
      });
    } catch (error) {
      throw new BadRequestException(
        `Profile image upload failed: ${error.message}`,
      );
    }
  }

  @Delete('profile-image')
  @ApiOperation({ summary: 'Delete profile image' })
  @ApiResponse({
    status: 200,
    description: 'Profile image deleted successfully',
  })
  @ApiResponse({ status: 400, description: 'No profile image to delete' })
  async deleteProfileImage(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    try {
      const currentUser = await this.usersService.findOneUser(user.id);

      if (!currentUser.profileImageId) {
        throw new BadRequestException('No profile image to delete');
      }

      await this.cloudinaryService.deleteImage(currentUser.profileImageId);

      await this.usersService.updateProfileImage(user.id, {
        profileImageId: null,
        profileImageUrl: null,
      });

      return { message: 'Profile image deleted successfully' };
    } catch (error) {
      throw new BadRequestException(
        `Failed to delete profile image: ${error.message}`,
      );
    }
  }
}
