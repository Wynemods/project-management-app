import { 
    Injectable, 
    NestInterceptor, 
    ExecutionContext, 
    CallHandler, 
    BadRequestException 
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  
  @Injectable()
  export class FileUploadInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const request = context.switchToHttp().getRequest();
      
      if (!request.file) {
        throw new BadRequestException('No file uploaded');
      }
  
      return next.handle();
    }
  }