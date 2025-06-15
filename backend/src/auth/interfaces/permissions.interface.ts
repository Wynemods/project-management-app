import { UserRole } from 'generated/prisma';
import { Permission } from '../enums/permissions.enum';

export interface PermissionRule {
  role: UserRole;
  permissions: Permission[];
}

export interface ContextPermission {
  permission: Permission;
  resourceId?: string;
  ownerId?: string;
}

export interface PermissionContext {
  user: {
    id: string;
    role: UserRole;
  };
  resource?: {
    id: string;
    ownerId?: string;
    type: string;
  };
}