import { UserRole } from '@prisma/client';
import { Permission } from '../enums/permissions.enum';

export class PermissionsUtils {
  // Check if a user can perform an action on a resource
  static canPerformAction(
    userRole: UserRole, 
    userId: string, 
    action: Permission, 
    resourceOwnerId?: string
  ): boolean {
    if (userRole === UserRole.ADMIN) {
      return true;
    }

    // User-specific logic
    const ownershipRequired = [
      Permission.UPDATE_OWN_PROFILE,
      Permission.CHANGE_OWN_PASSWORD,
      Permission.VIEW_OWN_PROJECT,
    ];

    if (ownershipRequired.includes(action)) {
      return userId === resourceOwnerId;
    }

    return false;
  }

  // a permission matrix based on user role
  static generatePermissionMatrix(userRole: UserRole) {
    return {
      users: {
        create: userRole === UserRole.ADMIN,
        read: userRole === UserRole.ADMIN,
        update: userRole === UserRole.ADMIN,
        delete: userRole === UserRole.ADMIN,
        manage: userRole === UserRole.ADMIN,
      },
      projects: {
        create: userRole === UserRole.ADMIN,
        read: true,
        update: userRole === UserRole.ADMIN,
        delete: userRole === UserRole.ADMIN,
        assign: userRole === UserRole.ADMIN,
        complete: userRole === UserRole.USER,
      },
      profile: {
        update: true,
        changePassword: true,
        view: true,
      },
    };
  }
}