import { SetMetadata } from '@nestjs/common';
import { Action } from '../enums/actions.enum';
import { Resource } from '../enums/resources.enum';

export const RESOURCE_ACTION_KEY = 'resource_action';
export const RequireResourceAction = (action: Action, resource: Resource) =>
  SetMetadata(RESOURCE_ACTION_KEY, { action, resource });
