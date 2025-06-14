import { Injectable } from "@nestjs/common";
import { UserRole } from "generated/prisma";
import { canRolePerformAction, getPermissionsForRole, ROLE_HIERARCHY, PERMISSION_DESCRIPTIONS } from "src/config/permission.config";
import { Action } from "../enums/actions.enum";
import { Permission } from "../enums/permissions.enum";
import { Resource } from "../enums/resources.enum";


@Injectable()
export class PermissionService {
  // Check if a role has a specific permission
  hasPermission(role: UserRole, permission: Permission): boolean {
    return canRolePerformAction(role, permission);
  }

  // Get all permissions for a specific role
  getRolePermissions(role: UserRole): Permission[] {
    return getPermissionsForRole(role);
  }

  // Generate a permission based on action and resource
  generatePermission(action: Action, resource: Resource): Permission {
    const permissionKey = `${action.toUpperCase()}_${resource.toUpperCase()}` as Permission;
    return Permission[permissionKey] || null;
  }

  // Check if a role can perform a specific action on a resource
  canPerformAction(
    role: UserRole, 
    action: Action, 
    resource: Resource
  ): boolean {
    const permission = this.generatePermission(action, resource);
    return permission ? this.hasPermission(role, permission) : false;
  }

  // Check if a user can access their own resource
  canAccessOwnResource(
    role: UserRole,
    action: Action,
    resource: Resource,
    ownerId: string,
    requesterId: string
  ): boolean {
    // Admin always has access
    if (role === UserRole.ADMIN) {
      return true;
    }

    // User can access their own resource
    if (ownerId === requesterId) {
      return this.canPerformAction(role, action, resource);
    }

    // Special case for reading user information
    if (resource === Resource.USER && action === Action.READ) {
      return true;
    }

    return false;
  }

  // Check if a role has any of the given permissions
  hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
    return permissions.some(permission => 
      this.hasPermission(role, permission)
    );
  }

  // Check if a role has all of the given permissions
  hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
    return permissions.every(permission => 
      this.hasPermission(role, permission)
    );
  }

  // Check role hierarchy
  checkRoleHierarchy(currentRole: UserRole, requiredRole: UserRole): boolean {
    return ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY[requiredRole];
  }

  // Get description for a specific permission
  getPermissionDescription(permission: Permission): string {
    return PERMISSION_DESCRIPTIONS[permission] || 'No description available';
  }

  // Get all permissions with their descriptions
  getAllPermissionDescriptions(): Record<Permission, string> {
    return PERMISSION_DESCRIPTIONS;
  }

  // Advanced method to check granular permissions
  canPerformActionWithDetails(
    role: UserRole,
    action: Action,
    resource: Resource,
    additionalContext?: {
      ownerId?: string;
      requesterId?: string;
    }
  ): { 
    allowed: boolean; 
    reason?: string 
  } {
    // First, check basic permission
    const permission = this.generatePermission(action, resource);
    
    if (!permission) {
      return { 
        allowed: false, 
        reason: 'Invalid permission mapping' 
      };
    }

    // Check role-based permission
    if (!this.hasPermission(role, permission)) {
      return { 
        allowed: false, 
        reason: 'Insufficient role permissions' 
      };
    }

    // If additional context is provided, check resource ownership
    if (additionalContext?.ownerId && additionalContext?.requesterId) {
      const canAccessOwn = this.canAccessOwnResource(
        role,
        action,
        resource,
        additionalContext.ownerId,
        additionalContext.requesterId
      );

      if (!canAccessOwn) {
        return { 
          allowed: false, 
          reason: 'Cannot access this resource' 
        };
      }
    }

    return { 
      allowed: true 
    };
  }
}