// src/common/guards/permissions.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'generated/prisma';
import { Action } from 'src/users/enums/actions.enum';
import { Permission } from 'src/users/enums/permissions.enum';
import { Resource } from 'src/users/enums/resources.enum';
import { PermissionService } from 'src/users/services/permission.service';

// Metadata keys for decorators
export const PERMISSIONS_KEY = 'permissions';
export const RESOURCE_KEY = 'resource';
export const ACTION_KEY = 'action';

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Retrieve metadata set by decorators
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    const resourceAction = this.reflector.getAllAndOverride<{
      resource: Resource;
      action: Action;
    }>(
      { resource: RESOURCE_KEY, action: ACTION_KEY },
      [context.getHandler(), context.getClass()],
    );

    // If no specific permissions or resource/action are defined, allow access
    if (!requiredPermissions && !resourceAction) {
      return true;
    }

    // Get the request and user
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Ensure user is authenticated
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check explicit permissions if provided
    if (requiredPermissions) {
      const hasPermission = this.permissionService.hasAnyPermission(
        user.role,
        requiredPermissions,
      );

      if (!hasPermission) {
        this.logPermissionDenial(user, requiredPermissions);
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    // Check resource and action if provided
    if (resourceAction) {
      const { resource, action } = resourceAction;
      
      // Additional context for granular permission check
      const additionalContext = {
        ownerId: request.params.id || request.body.userId,
        requesterId: user.id,
      };

      const accessResult = this.permissionService.canPerformActionWithDetails(
        user.role,
        action,
        resource,
        additionalContext,
      );

      if (!accessResult.allowed) {
        this.logPermissionDenial(user, accessResult.reason);
        throw new ForbiddenException(
          accessResult.reason || 'Access to resource denied',
        );
      }
    }

    return true;
  }

  // Logging method for permission denials
  private logPermissionDenial(
    user: { id: string; role: UserRole },
    details: Permission[] | string,
  ): void {
    this.logger.warn(
      `Permission denied for user ${user.id} with role ${user.role}. Details: ${
        Array.isArray(details) ? details.join(', ') : details
      }`,
    );
  }
}