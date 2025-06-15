import { Injectable } from '@nestjs/common';
import { UserRole } from 'generated/prisma';
import { Permission } from '../enums/permissions.enum';
import { ROLE_PERMISSIONS } from 'src/config/permission.config';
import { PermissionContext } from '../interfaces/permissions.interface';

@Injectable()
export class PermissionsService {
  getPermissionsForRole(role: UserRole): Permission[] {
    const roleConfig = ROLE_PERMISSIONS.find((config) => config.role === role);
    return roleConfig?.permissions || [];
  }

  hasPermission(userRole: UserRole, permission: Permission): boolean {
    const userPermissions = this.getPermissionsForRole(userRole);
    return userPermissions.includes(permission);
  }

  hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
    return permissions.some((permission) =>
      this.hasPermission(userRole, permission),
    );
  }

  hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
    return permissions.every((permission) =>
      this.hasPermission(userRole, permission),
    );
  }

  hasContextualPermission(
    context: PermissionContext,
    permission: Permission,
  ): boolean {
    const { user, resource } = context;

    if (!this.hasPermission(user.role, permission)) {
      return false;
    }

    if (user.role === UserRole.ADMIN) {
      return true;
    }

    switch (permission) {
      case Permission.UPDATE_OWN_PROFILE:
      case Permission.CHANGE_OWN_PASSWORD:
        return resource ? user.id === resource.ownerId : true;

      case Permission.VIEW_OWN_PROJECT:
      case Permission.COMPLETE_PROJECT:
        return resource ? user.id === resource.ownerId : true;

      case Permission.READ_USER:
        return resource ? user.id === resource.id : false;

      default:
        return false;
    }
  }

  getEffectivePermissions(
    userRole: UserRole,
    userId: string,
    resourceOwnerId?: string,
  ): Permission[] {
    const basePermissions = this.getPermissionsForRole(userRole);

    if (userRole === UserRole.ADMIN) {
      return basePermissions;
    }

    return basePermissions.filter((permission) => {
      const context: PermissionContext = {
        user: { id: userId, role: userRole },
        resource: resourceOwnerId
          ? { id: resourceOwnerId, ownerId: resourceOwnerId, type: 'user' }
          : undefined,
      };

      return this.hasContextualPermission(context, permission);
    });
  }

  createPermission(action: string, resource: string): string {
    return `${action}:${resource}`;
  }

  parsePermission(permission: Permission): {
    action: string;
    resource: string;
  } {
    const [action, resource] = permission.split(':');
    return { action, resource };
  }
}
