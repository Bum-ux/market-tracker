import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PrismaModule } from "src/prisma.module";

@Module({
    imports: [
        PrismaModule,
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            secret: config.get('JWT_SECRET'),
            signOptions: { expiresIn: '1d' },
          }),
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService],
    exports: [JwtModule]
})
export class AuthModule{}