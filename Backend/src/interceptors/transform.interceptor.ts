import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { map, Observable, tap } from 'rxjs';
import { LoginDto } from 'src/modules/auth/dto/login.dto';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    console.log('request');
    const req = context.switchToHttp().getRequest<Request>();

    console.log(`[${req.method}] ${req.url}`);
    console.log('Body:', req.body);

    return next.handle().pipe(
      map((data) => ({
        success: true,
        statusCode: 200,
        message: 'Success',
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
