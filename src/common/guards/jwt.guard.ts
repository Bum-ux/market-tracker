import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenExpiredError } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/modules/infrastructure/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable() // Đánh dấu JwtGuard là một provider để Nestjs có thể quản lý và inject
export class JwtGuard implements CanActivate {
  // Triển khai interface CanActivate để tạo Guard kiểm tra quyền truy cập
  constructor(
    private readonly jwtService: JwtService, // Inject JwTService để xử lys token
    private readonly reflector: Reflector, //Inject reflector để đọc và truy xuất metadata
    private readonly configService: ConfigService, // Inject ConfigService để sử dụng Config
    private readonly prismaService: PrismaService,
  ) {}
  async canActivate(
    // Gọi hàm CanActivate
    context: ExecutionContext, // Chứa thông tin về request hiện tại như Request, Controller và Handler
  ): Promise<boolean> {
    // Guard có thể trả về dạng boolean, Promise<boolean> hoặc Observable<boolean>
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      // Gọi hàm reflector để có thể đọc và tổng hợp siêu dữ liệu rồi trả kết quả dạng boolean.
      // Truyền biến IS_PUBLIC_KEY vào để có thể đánh dấu những chỗ nơi không cần kiểm tra token thông qua các ngữ cảnh controller và class
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true; // Kiểm nếu ngữ cảnh đó đã được đánh dấu public chưa và trả kết quả về là true

    const request = context.switchToHttp().getRequest(); // Chuyển sang HTTP để lấy request và token rồi gán vào biến request

    const authHeader = request.headers.authorization; // Lấy Authorization Header từ HTTP equest

    if (!authHeader) {
      // Kiểm tra xem authHeader đã có token chưa
      throw new UnauthorizedException('Không có token!'); // Nếu chưa có thì ném lỗi không thể xác thực với thông tin chi tiết
    }
    const token = authHeader.split(' ')[1]; // Tách chuỗi để lấy mỗi token

    try {
      // Sử dụng khối try-catch để có thể thử và bắt lỗi rồi xử lý
      const payload = this.jwtService.verify(token, {
        // Gọi jwtService để xác thực token và lấy chìa khóa bí mật từ configservice để xác thực token
        secret: this.configService.get('JWT_SECRET'),
      });

      console.log(payload);

      request.user = payload; // Lưu thông tin người dùng đã được giải mã từ JWT vào request
      return true; // Trả kết quả là true
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        const cookieToken = request.cookies['refreshToken'];

        if (!cookieToken) {
          throw new UnauthorizedException('Token không tồn tại');
        }

        const payload = this.jwtService.verify(cookieToken, {
          secret: this.configService.get('JWT_SECRET'),
        });

        const user = await this.prismaService.user.findUnique({
          where: { id: payload.sub },
        });
        if (!user || !user.refreshToken) {
          throw new UnauthorizedException('Không có quyền truy cập!');
        }

        if (user.refreshToken !== cookieToken) {
          console.log('user.refreshToken !== cookieToken');

          throw new UnauthorizedException('Token đã hết hạn');
        }
        const newPayload = {
          sub: user.id,
          email: user.email,
          role: user.role,
        };

        const accessToken = this.jwtService.sign(newPayload, {
          expiresIn: '15m',
        });

        const refreshToken = this.jwtService.sign(newPayload, {
          expiresIn: '7d',
        });

        await this.prismaService.user.update({
          where: { id: user.id },
          data: { refreshToken: refreshToken },
        });

        const response = context.switchToHttp().getResponse();

        response.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: false,
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        response.setHeader('Authorization', `Bearer ${accessToken}`);

        request.user = newPayload;

        return true;
      }
      // Bắt lỗi ngay lập tức để xử lý tránh tình trạng dừng chương trình khi có lỗi
      throw new UnauthorizedException('Token không hợp lệ!'); // Ném ra lỗi không thể xác thực với thông tin chi tiết
    }
  }
}
