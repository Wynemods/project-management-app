import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserRole } from 'generated/prisma';
import { ChangePasswordDto } from 'src/auth/dto/change-password.dto';
import { RequirePermissions } from './decorators/permissions.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Permission } from './enums/permissions.enum';
import { ResourceOwner } from './guards/resource-owner/resource-owner.guard';
import { UsersService } from './users.service';
import { JwtAuthGuard } from './guards/jwt/jwt.guard';



@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Create a new user (admin-only)
  @Post()
  @RequirePermissions(Permission.CREATE_USER)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // Get all users (admin-only)
  @Get()
  @RequirePermissions(Permission.READ_USER)
  findAll() {
    return this.usersService.findAll();
  }

  // Get active users (admin-only)
  @Get('active')
  @RequirePermissions(Permission.READ_USER)
  findActive() {
    return this.usersService.findActive();
  }

  // Get users by role (admin-only)
  @Get('role/:role')
  @RequirePermissions(Permission.READ_USER)
  findByRole(@Param('role') role: UserRole) {
    return this.usersService.findByRole(role);
  }

  // Get a specific user
  @Get(':id')
  @ResourceOwner({
    ownerIdPath: 'params.id'
  })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // Update a user
  @Put(':id')
  @ResourceOwner({
    ownerIdPath: 'params.id'
  })
  update(
    @Param('id') id: string, 
    @Body() updateUserDto: UpdateUserDto
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  // Change user password
  @Put(':id/change-password')
  @ResourceOwner({
    ownerIdPath: 'params.id'
  })
  changePassword(
    @Param('id') id: string, 
    @Body() changePasswordDto: ChangePasswordDto
  ) {
    return this.usersService.changePassword(
      id, 
      changePasswordDto.currentPassword, 
      changePasswordDto.newPassword
    );
  }

  // Deactivate a user (soft delete)
  @Delete(':id')
  @RequirePermissions(Permission.DELETE_USER)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  // Permanently delete a user (admin-only)
  @Delete(':id/permanent')
  @RequirePermissions(Permission.MANAGE_SYSTEM)
  delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}