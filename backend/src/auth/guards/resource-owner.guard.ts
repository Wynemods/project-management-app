import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ResourceOwnership = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = request.params[data || 'id'];
    
    return {
      userId: user.id,
      userRole: user.role,
      resourceId,
      isOwner: user.id === resourceId,
    };
  },
);
