import { SetMetadata } from '@nestjs/common';
import { Permission } from '../enums/permissions.enum';
import { Action } from '../enums/actions.enum';
import { Resource } from '../enums/resources.enum';
import { PERMISSIONS_KEY, RESOURCE_KEY } from '../guards/permission/permission.guard';

// Decorator to set specific permissions
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// Decorator to set resource and action
export const ResourceAction = (resource: Resource, action: Action) =>
  SetMetadata(RESOURCE_KEY, { resource, action });
