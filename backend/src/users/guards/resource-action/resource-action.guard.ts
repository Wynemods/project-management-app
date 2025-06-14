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
import { Action } from 'src/users/enums/actions.enum';
import { Resource } from 'src/users/enums/resources.enum';
import { PermissionService } from 'src/users/services/permission.service';

// Metadata keys
export const RESOURCE_ACTION_KEY = 'resource_action';

// Interface for resource action metadata
export interface ResourceActionMetadata {
  resource: Resource;
  action: Action;
  ownerIdPath?: string; // Optional path to owner ID
}

// Decorator to set resource and action
export const ResourceAction = (
  resource: Resource, 
  action: Action, 
  ownerIdPath?: string
) => SetMetadata(RESOURCE_ACTION_KEY, { 
  resource, 
  action, 
  ownerIdPath 
});

@Injectable()
export class ResourceActionGuard implements CanActivate {
  private readonly logger = new Logger(ResourceActionGuard.name);

  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Retrieve resource action metadata
    const resourceAction = this.reflector.getAllAndOverride<ResourceActionMetadata>(
      RESOURCE_ACTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no resource action is defined, allow access
    if (!resourceAction) {
      return true;
    }

    // Get the request and user
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Ensure user is authenticated
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Determine owner ID if specified
    let ownerId: string | undefined;
    if (resourceAction.ownerIdPath) {
      // Support nested paths like 'body.user.id' or 'params.userId'
      ownerId = this.getNestedValue(request, resourceAction.ownerIdPath);
    }

    // Perform permission check
    const accessResult = this.permissionService.canPerformActionWithDetails(
      user.role,
      resourceAction.action,
      resourceAction.resource,
      {
        ownerId,
        requesterId: user.id,
      }
    );

    // Handle access denial
    if (!accessResult.allowed) {
      this.logAccessDenial(user, resourceAction, accessResult.reason);
      throw new ForbiddenException(
        accessResult.reason || 'Access to resource denied'
      );
    }

    return true;
  }

  // Utility method to get nested object values
  private getNestedValue(obj: any, path: string): string | undefined {
    return path.split('.').reduce((acc, part) => 
      acc && acc[part] !== undefined ? acc[part] : undefined, 
      obj
    );
  }

  // Logging method for access denials
  private logAccessDenial(
    user: { id: string; role: UserRole },
    resourceAction: ResourceActionMetadata,
    reason?: string
  ): void {
    this.logger.warn(
      `Resource access denied - User: ${user.id}, ` +
      `Role: ${user.role}, ` +
      `Resource: ${resourceAction.resource}, ` +
      `Action: ${resourceAction.action}, ` +
      `Reason: ${reason || 'Unknown'}`
    );
  }
}