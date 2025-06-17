import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission } from '../enums/permissions.enum';
import { AuthenticatedUser } from '../interfaces/jwt.interface';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PermissionsService } from '../services/permission.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const permissionConfig = this.reflector.getAllAndOverride<any>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!permissionConfig) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (Array.isArray(permissionConfig)) {
      return this.checkAllPermissions(user, permissionConfig);
    }

    if (permissionConfig.type === 'any') {
      return this.checkAnyPermission(user, permissionConfig.permissions);
    }

    if (permissionConfig.type === 'all') {
      return this.checkAllPermissions(user, permissionConfig.permissions);
    }

    if (permissionConfig.type === 'ownership') {
      return this.checkOwnershipPermission(user, permissionConfig.permission, request);
    }

    return false;
  }

  private checkAllPermissions(user: AuthenticatedUser, permissions: Permission[]): boolean {
    const hasPermissions = this.permissionsService.hasAllPermissions(user.role, permissions);
    
    if (!hasPermissions) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }

  private checkAnyPermission(user: AuthenticatedUser, permissions: Permission[]): boolean {
    const hasPermission = this.permissionsService.hasAnyPermission(user.role, permissions);
    
    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }

  private checkOwnershipPermission(user: AuthenticatedUser, permission: Permission, request: any): boolean {
    const resourceId = request.params.id || request.params.userId;
    
    const context = {
      user: { id: user.id, role: user.role },
      resource: resourceId ? { 
        id: resourceId, 
        ownerId: resourceId,
        type: 'user' 
      } : undefined,
    };

    const hasPermission = this.permissionsService.hasContextualPermission(context, permission);
    
    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions or access denied');
    }

    return true;
  }
}
