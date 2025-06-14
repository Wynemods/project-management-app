// src/modules/permissions/controllers/permission.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RequirePermissions } from '../decorators/permissions.decorator';
import { Permission } from '../enums/permissions.enum';
import { PermissionService } from '../services/permission.service';

@Controller('permissions')
@UseGuards(AuthGuard)
export class PermissionController {
  constructor(
    private readonly permissionService: PermissionService,
  ) {}

  // Get permissions for the current user's role
  @Get()
  getUserRolePermissions(@Request() req) {
    return {
      role: req.user.role,
      permissions: this.permissionService.getRolePermissions(req.user.role)
    };
  }

  // Check if user has a specific permission
  @Post('check')
  checkPermission(
    @Request() req,
    @Body() body: { permission: Permission }
  ) {
    return {
      permission: body.permission,
      hasPermission: this.permissionService.hasPermission(
        req.user.role, 
        body.permission
      )
    };
  }

  // Admin-only endpoint to get all permission descriptions
  @Get('descriptions')
  @RequirePermissions(Permission.MANAGE_SYSTEM)
  getAllPermissionDescriptions() {
    return this.permissionService.getAllPermissionDescriptions();
  }
}