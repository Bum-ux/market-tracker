import { Post, Body, Controller, Res, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from 'src/common/decorators/public.decorator';
import type { Response, Request } from 'express';
import { Throttle } from '@nestjs/throttler';

@Controller('auth') // Đánh dấu class Controller có route gốc là /auth
export class AuthController {
  // export class AuthController để các file thư mục khác có thể import và sử dụng
  constructor(private readonly authService: AuthService) {} // Inject AuthService vào AuthController

  @Throttle({ default: { limit: 5, ttl: 5000 } })
  @Public() // Decorator đánh dấu method login được public nên không cần kiểm tra token
  @Post('login') // Tạo endpoint login lên server để yêu cầu đăng nhập
  async login(
    @Body() dto: LoginDto, // Lấy dữ liệu dto ở phần Body và đưa vào LoginDto
    @Res({ passthrough: true }) res: Response, // passthrough để có thể gửi Response thủ công đến công đến route handler mong muốn
  ) {
    const { access_token, refreshToken } = await this.authService.login(dto); // Nhận access token và refresh token từ Auth Service

    res.cookie('refreshToken', refreshToken, {
      // Set refreshToken vào httpOnly cookie để không trả trong JSON body
      httpOnly: true,
      secure: false, // Cho phép gửi cookie qua HTTP thay vì HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000, // Đặt thời gian hết hạn cho refresh token
    });

    return { access_token }; // Trả kết quả vừa login về
  }

  @Public() // Decorator đánh dấu method register được public nên không cần kiểm tra token
  @Post('register') // Tạo endpoint register lên server để yêu cầu đăng ký
  async register(@Body() dto: RegisterDto) {
    // Hàm bất đồng bộ lấy dữ liệu từ phần body của HTTP Request và đưa vào RegisterDto
    const result = await this.authService.register(dto); // Chuyển đối tượng truyền dữ liệu sang cho authService để xử lý và xác nhận rồi gán vào biến result
    return result; // Trả kết quả vừa register về
  }

  @Public() // Decorator đánh dấu method refresh được public nên không cần kiểm tra token
  @Post('refresh') // Tạo endpoint refresh lên server để yêu cầu refresh
  async refresh(
    // Hàm bất đồng bộ gọi request và response
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response, // Response được chỉ định đến route handler nhất định
  ) {
    const refreshToken = req.cookies['refreshToken']; // Lấy refreshToken từ Cookie của HTTP Request.
    const payload: any = JSON.parse(
      // Đọc và truy xuất file JSON và gán vào biến payload. Để interface payload là any để có thể sử dụng được bất kỳ interface nào
      Buffer.from(refreshToken.split('.')[1], 'base64').toString(), // Giải mã phần payload của JWT từ Base64 thành chuỗi JSON rồi chuyển thành Object
    );

    const tokens = await this.authService.refreshTokens(
      // Gọi authService để xử lý refresh token
      payload.sub, // Gọi payload để đọc và truy xuất dạng sub
      refreshToken, // Gọi refreshToken để gửi yêu cầu
    );

    res.cookie('refreshToken', tokens.refreshToken, {
      // Gửi phản hồi trả dữ liệu refresh token và giá trị token từ cookie
      httpOnly: true, // Cũng set httpOnly để không trả về dạng JSON
      secure: false, // Ép cookie dùng HTTP thay vì HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000, // Thời gian hết hạn của token
    });
    return { access_token: tokens.access_token }; // Trả kết quả là access_token và giá trị tokens của access_token
  }

  @Post('logout') // Tạo endpoint logout lên server để yêu cầu đăng xuất
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    // Hàm bất đồng bộ lấy HTTP request hiện tại và gửi response tới route handler mong muốn, đặt response về kiểu Response
    await this.authService.logout(req.user.sub); // Gọi authService để xử lý yêu cầu logout của user ở dạng sub
    res.clearCookie('refreshToken'); // Gửi phản hồi tới cookie để xóa refresh token
    return { message: 'Đăng xuất thành công!' }; // Trả về thông tin chi tiết
  }
}
