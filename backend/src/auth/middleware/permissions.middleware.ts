import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Permission } from '../enums/permissions.enum';
import { PermissionsService } from '../services/permission.service';

@Injectable()
export class PermissionsMiddleware implements NestMiddleware {
  constructor(private permissionsService: PermissionsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    if (req.user) {
      // @ts-ignore
      req.userPermissions = this.permissionsService.getPermissionsForRole(req.user.role);
    }
    next();
  }
}

declare global {
  namespace Express {
    interface Request {
      userPermissions?: Permission[];
    }
  }
}