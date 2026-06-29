import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Observable } from "rxjs";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtGuard implements CanActivate{
    constructor(private readonly jwtService: JwtService, private readonly reflector: Reflector, private readonly configService: ConfigService){}
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass(),
        ]);

        if (isPublic) return true;

        const request = context.switchToHttp().getRequest();

        const authHeader = request.headers.authorization;

        if (!authHeader) {
            throw new UnauthorizedException('Không có token!')
        }
        const token = authHeader.split(' ')[1];

        try {
            const payload= this.jwtService.verify(token, {secret: this.configService.get('JWT_SECRET')});
            request.user = payload;
            return true;
        } catch {
            throw new UnauthorizedException('Token không hợp lệ!')
        }
    }
}