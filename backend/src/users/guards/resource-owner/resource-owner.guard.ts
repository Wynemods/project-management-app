// src/common/guards/resource-owner.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'generated/prisma';

// Interfaces for resource ownership
export interface ResourceOwnerOptions {
  // Path to resource owner ID in the request
  ownerIdPath?: string;
  
  // Alternative paths to check ownership
  alternateOwnerPaths?: string[];
  
  // Custom ownership validation function
  customOwnershipCheck?: (request: any, user: any) => Promise<boolean> | boolean;
  
  // Allow admin bypass
  adminBypass?: boolean;
}

// Metadata key for resource owner decorator
export const RESOURCE_OWNER_KEY = 'resource_owner';

// Decorator to set resource ownership options
export const ResourceOwner = (options: ResourceOwnerOptions = {}) => 
  SetMetadata(RESOURCE_OWNER_KEY, {
    adminBypass: true, // Default to allowing admin bypass
    ...options
  });

@Injectable()
export class ResourceOwnerGuard implements CanActivate {
  private readonly logger = new Logger(ResourceOwnerGuard.name);

  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Retrieve resource owner metadata
    const resourceOwnerOptions = this.reflector.getAllAndOverride<ResourceOwnerOptions>(
      RESOURCE_OWNER_KEY,
      [context.getHandler(), context.getClass()]
    );

    // If no ownership options are defined, allow access
    if (!resourceOwnerOptions) {
      return true;
    }

    // Get the request and user
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Ensure user is authenticated
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Admin bypass
    if (
      resourceOwnerOptions.adminBypass !== false && 
      user.role === UserRole.ADMIN
    ) {
      return true;
    }

    // Custom ownership check (highest priority)
    if (resourceOwnerOptions.customOwnershipCheck) {
      const isOwner = await resourceOwnerOptions.customOwnershipCheck(request, user);
      if (isOwner) {
        return true;
      }
    }

    // Check owner ID from primary path
    if (resourceOwnerOptions.ownerIdPath) {
      const ownerId = this.getNestedValue(request, resourceOwnerOptions.ownerIdPath);
      if (this.isOwner(user, ownerId)) {
        return true;
      }
    }

    // Check alternate owner paths
    if (resourceOwnerOptions.alternateOwnerPaths) {
      for (const path of resourceOwnerOptions.alternateOwnerPaths) {
        const ownerId = this.getNestedValue(request, path);
        if (this.isOwner(user, ownerId)) {
          return true;
        }
      }
    }

    // Log and deny access if no ownership is found
    this.logAccessDenial(user, resourceOwnerOptions);
    throw new ForbiddenException('You do not have ownership of this resource');
  }

  // Utility method to get nested object values
  private getNestedValue(obj: any, path: string): string | undefined {
    return path.split('.').reduce((acc, part) => 
      acc && acc[part] !== undefined ? acc[part] : undefined, 
      obj
    );
  }

  // Check if the user is the owner
  private isOwner(user: any, ownerId?: string): boolean {
    return ownerId && user.id === ownerId;
  }

  // Logging method for access denials
  private logAccessDenial(
    user: { id: string; role: UserRole },
    options: ResourceOwnerOptions
  ): void {
    this.logger.warn(
      `Resource ownership access denied - ` +
      `User: ${user.id}, ` +
      `Role: ${user.role}, ` +
      `Owner Paths: ${JSON.stringify(options)}`
    );
  }
}
