import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { ConflictException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { UnauthorizedException } from '@nestjs/common';

@Injectable() // Khởi tạo injectable để có thể sử dụng dependency injection
export class AuthService {
  // export AuthService để các file thư mục khác có thể import và sử dụng
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
  ) {} // Inject PrismaService và JwtService để có thể xử lý database và kiểm duyệt token

  async register(dto: RegisterDto) {
    // Hàm bất đồng bộ xử lý phiên đăng ký và đưa dữ liệu đăng ký vào RegisterDto
    const emailExisted = await this.prismaService.user.findUnique({
      // Tìm user theo email trong database và gán vào biến emailExisted
      where: { email: dto.email }, // Nơi tìm dữ liệu email
    });
    if (emailExisted) {
      // Kiểm tra email đã có trong database chưa
      throw new ConflictException('Email đã tồn tại!'); // Nếu email đã tồn tại thì ném một thông bão lỗi với thông tin chi tiết
    }

    const harshedPassword = await bcrypt.hash(dto.password, 10); // Mã hóa mật khẩu bằng bcrypt với salt rounds = 10 rồi gán vào biến harshedPasssword

    const user = await this.prismaService.user.create({
      // Tạo mới ở mục user của database và gán vào biến user
      data: {
        email: dto.email, // Truyền dữ liệu email vào email
        password: harshedPassword, // Truyền dữ liệu password đã được mã hóa vào password
      },
    });
    const { password, ...result } = user; // Đưa tất cả dữ liệu của user vào biến result ngoại trừ password
    return result; // Trả dữ liệu của user về
  }

  private async generateTokens(userId: number, email: string) {
    const access_token = this.jwtService.sign(
      { sub: userId, email },
      { expiresIn: '15m' },
    );

    const refreshToken = this.jwtService.sign(
      { sub: userId, email },
      { expiresIn: '7d' },
    );
    return { access_token, refreshToken };
  }

  async login(dto: LoginDto) {
    // Hàm bất đồng bộ xử lý phiên đăng nhập và đưa dữ liệu đăng nhập vào LoginDto
    const userEmail = await this.prismaService.user.findUnique({
      // Tìm và kiểm tra email có bị trùng trong database không và gán vào biến userEmail
      where: { email: dto.email }, // Nơi tìm dữ liệu email
    });
    if (!userEmail) {
      // Kiểm tra userEmail có trong database chưa
      throw new UnauthorizedException('Email không tồn tại!'); // Nếu email chưa tồn tại thì ném ra lỗi không thể xác minh cùng với thông tin chi tiết
    }

    const isMatch = await bcrypt.compare(dto.password, userEmail.password); // Lấy dữ liệu mật khẩu và mật khẩu của user đã được mã hóa để so sánh và gán vào biến isMatch
    if (!isMatch) {
      // Kiểm tra mật khẩu có khớp không
      throw new UnauthorizedException('Sai mật khẩu!'); // Nếu mật khẩu không khớp thì ném lỗi không thể xác minh cùng với thông tin chi tiết
    }

    const { access_token, refreshToken } = await this.generateTokens(
      userEmail.id,
      userEmail.email,
    );

    const harshedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prismaService.user.update({
      where: { id: userEmail.id },
      data: { refreshToken: harshedRefreshToken },
    });

    return { access_token, refreshToken };
  }

  async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Không có quyền truy cập!');
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isMatch) {
      throw new UnauthorizedException('Refresh token không hợp lệ!');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    const harshedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    await this.prismaService.user.update({
      where: { id: user.id },
      data: { refreshToken: harshedRefreshToken },
    });

    return tokens;
  }

  async logout(userId: number) {
    await this.prismaService.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { message: 'Đăng xuất thành công!' };
  }
}
