import { UserRole } from "generated/prisma";
import { Permission } from "src/users/enums/permissions.enum";

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  ADMIN: 2,
  USER: 1
};

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    // User Permissions
    Permission.CREATE_USER,
    Permission.READ_USER,
    Permission.UPDATE_USER,
    Permission.DELETE_USER,

    // Project Permissions
    Permission.CREATE_PROJECT,
    Permission.READ_PROJECT,
    Permission.UPDATE_PROJECT,
    Permission.DELETE_PROJECT,
    Permission.ASSIGN_PROJECT,
    Permission.COMPLETE_PROJECT,

    // Notification Permissions
    Permission.CREATE_NOTIFICATION,
    Permission.READ_NOTIFICATION,
    Permission.DELETE_NOTIFICATION,

    // System Permissions
    Permission.MANAGE_SYSTEM
  ],
  USER: [
    // Limited permissions for regular users
    Permission.READ_USER,
    Permission.UPDATE_USER,
    Permission.READ_PROJECT,
    Permission.COMPLETE_PROJECT,
    Permission.READ_NOTIFICATION
  ]
};

// Permission Descriptions for Documentation
export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
    // User Permissions
    [Permission.CREATE_USER]: 'Ability to create new user accounts',
    [Permission.READ_USER]: 'Ability to view user information',
    [Permission.UPDATE_USER]: 'Ability to modify user details',
    [Permission.DELETE_USER]: 'Ability to remove user accounts',

    // Project Permissions
    [Permission.CREATE_PROJECT]: 'Ability to create new projects',
    [Permission.READ_PROJECT]: 'Ability to view project details',
    [Permission.UPDATE_PROJECT]: 'Ability to modify project information',
    [Permission.DELETE_PROJECT]: 'Ability to delete projects',
    [Permission.ASSIGN_PROJECT]: 'Ability to assign projects to users',
    [Permission.COMPLETE_PROJECT]: 'Ability to mark projects as completed',

    // Notification Permissions
    [Permission.CREATE_NOTIFICATION]: 'Ability to create notifications',
    [Permission.READ_NOTIFICATION]: 'Ability to read notifications',
    [Permission.DELETE_NOTIFICATION]: 'Ability to delete notifications',

    // System Permissions
    [Permission.MANAGE_SYSTEM]: 'Full system administration access',
    [Permission.MANAGE_PERMISSIONS]: ""
};

// Utility function to get permissions for a specific role
export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

// Utility function to check if a role can perform an action
export function canRolePerformAction(
  role: UserRole, 
  permission: Permission
): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}