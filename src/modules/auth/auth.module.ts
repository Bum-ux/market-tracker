import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PrismaModule } from "src/prisma.module";

@Module({
    imports: [
        PrismaModule,
        JwtModule.register({
            secret: 'your-secret-key',
            signOptions: {expiresIn: '1d'},
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService],
})
export class AuthModule{}