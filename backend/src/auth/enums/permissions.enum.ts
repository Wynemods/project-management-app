export enum Permission {
  // User permissions
  CREATE_USER = 'create:user',
  READ_USER = 'read:user',
  UPDATE_USER = 'update:user',
  DELETE_USER = 'delete:user',
  MANAGE_USERS = 'manage:users',
  
  // Project permissions
  CREATE_PROJECT = 'create:project',
  READ_PROJECT = 'read:project',
  UPDATE_PROJECT = 'update:project',
  DELETE_PROJECT = 'delete:project',
  MANAGE_PROJECTS = 'manage:projects',
  ASSIGN_PROJECT = 'assign:project',
  COMPLETE_PROJECT = 'complete:project',
  
  // System permissions
  ADMIN_ACCESS = 'admin:access',
  VIEW_DASHBOARD = 'view:dashboard',
  MANAGE_SYSTEM = 'manage:system',
  
  // Profile permissions
  UPDATE_OWN_PROFILE = 'update:own_profile',
  CHANGE_OWN_PASSWORD = 'change:own_password',
  VIEW_OWN_PROJECT = 'view:own_project',
}