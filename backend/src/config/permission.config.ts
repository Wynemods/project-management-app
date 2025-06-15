import { UserRole } from 'generated/prisma';
import { Permission } from 'src/auth/enums/permissions.enum';
import { PermissionRule } from 'src/auth/interfaces/permissions.interface';

export const ROLE_PERMISSIONS: PermissionRule[] = [
  {
    role: UserRole.ADMIN,
    permissions: [
      // Full access to everything
      Permission.CREATE_USER,
      Permission.READ_USER,
      Permission.UPDATE_USER,
      Permission.DELETE_USER,
      Permission.MANAGE_USERS,
      
      Permission.CREATE_PROJECT,
      Permission.READ_PROJECT,
      Permission.UPDATE_PROJECT,
      Permission.DELETE_PROJECT,
      Permission.MANAGE_PROJECTS,
      Permission.ASSIGN_PROJECT,
      
      Permission.ADMIN_ACCESS,
      Permission.VIEW_DASHBOARD,
      Permission.MANAGE_SYSTEM,
      
      Permission.UPDATE_OWN_PROFILE,
      Permission.CHANGE_OWN_PASSWORD,
      Permission.VIEW_OWN_PROJECT,
    ],
  },
  {
    role: UserRole.USER,
    permissions: [
      // Limited access
      Permission.READ_USER,
      Permission.UPDATE_OWN_PROFILE,
      Permission.CHANGE_OWN_PASSWORD,
      Permission.VIEW_OWN_PROJECT,
      Permission.COMPLETE_PROJECT,
      Permission.VIEW_DASHBOARD,
    ],
  },
];