import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from 'src/prisma.module';

@Module({
  // Đánh dấu class Module để NestJS biết đây là vị trí quản lý và liên kết các thành phần với nhau
  imports: [
    // Khai báo các Module mà AuthModule cần sử dụng.
    PrismaModule, // Import PrismaModule để sử dụng PrismaService trong AuthModule.
    JwtModule.registerAsync({
      // Cấu hình JWTModule được lấy từ Config Service
      imports: [ConfigModule], // import config module để quản lý của jwtmodule
      inject: [ConfigService], // inject config service để xử lý logic của jwt
      useFactory: (config: ConfigService) => ({
        // Sử dụng config service của jwt để lấy token ẩn và hết hạn trong 1 ngày
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  controllers: [AuthController], // import controller để nhận và gửi request/response
  providers: [AuthService], // import service để xử lý logic
  exports: [JwtModule], // export jwtmodule để các module khác sử dụng được jwtservice
})
export class AuthModule {} // export AuthModule để những Module khác có thể import và dùng được
