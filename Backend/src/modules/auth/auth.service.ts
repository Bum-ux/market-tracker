import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/modules/infrastructure/prisma/prisma.service';
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

  private async generateTokens(userId: number, email: string, role: string) {
    // Khái báo hàm bất đồng bộ generate token lấy dữ liệu là id và email của user
    const access_token = this.jwtService.sign(
      // Đặt token đã được generate cho user vào biến access_token
      { sub: userId, email, role }, // Đặt token đẫ được generate cho đối tượng theo Id của user và email
      { expiresIn: '15m' }, // Token hết hạn trong 15 phút
    );

    const refreshToken = this.jwtService.sign(
      // Đặt token đã được làm mới cho user vào biến refreshToken
      { sub: userId, email, role }, // Đặt token đã được làm mới cho đối tượng theo Id của user và email
      { expiresIn: '7d' }, // Token làm mới sẽ hết hạn trong 7 ngày
    );
    return { access_token, refreshToken }; // Trả về dữ liệu danh sách access_token và refreshToken
  }

  async login(dto: LoginDto) {
    // Hàm bất đồng bộ xử lý phiên đăng nhập và đưa dữ liệu đăng nhập vào LoginDto
    const user = await this.prismaService.user.findUnique({
      // Tìm và kiểm tra email có bị trùng trong database không và gán vào biến user
      where: { email: dto.email }, // Nơi tìm dữ liệu email
    });
    if (!user) {
      // Kiểm tra user có trong database chưa
      throw new UnauthorizedException('Email không tồn tại!'); // Nếu email chưa tồn tại thì ném ra lỗi không thể xác minh cùng với thông tin chi tiết
    }

    const isMatch = await bcrypt.compare(dto.password, user.password); // Lấy dữ liệu mật khẩu và mật khẩu của user đã được mã hóa để so sánh và gán vào biến isMatch
    if (!isMatch) {
      // Kiểm tra mật khẩu có khớp không
      throw new UnauthorizedException('Sai mật khẩu!'); // Nếu mật khẩu không khớp thì ném lỗi không thể xác minh cùng với thông tin chi tiết
    }

    const { access_token, refreshToken } = await this.generateTokens(
      // Lấy danh sách access token và refresh token để generateTokens
      user.id, // Lấy theo id của user
      user.email, // Lấy theo email của user
      user.role, // Lấy theo role của user
    );

    await this.prismaService.user.update({
      // Gọi primaService để update dữ liệu vào database user
      where: { id: user.id }, // Xác định vị trí update và update id theo id của user
      data: { refreshToken: refreshToken }, // Update refreshToken đã được mã hóa vào data
    });

    return { access_token, refreshToken }; // Trả kết quả dữ liệu danh sách access_token và refreshToken
  }

  async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Không có quyền truy cập!');
    }

    if (user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Refresh Token không hợp lệ!');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.prismaService.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
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
