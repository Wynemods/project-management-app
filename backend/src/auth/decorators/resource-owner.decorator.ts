import { SetMetadata } from '@nestjs/common';

export const RESOURCE_OWNER_KEY = 'resource_owner';
export const CheckResourceOwner = (ownerField = 'userId') =>
  SetMetadata(RESOURCE_OWNER_KEY, ownerField);
