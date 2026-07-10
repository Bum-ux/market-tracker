import { Post, Body, Controller, Res, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from 'src/common/decorators/public.decorator';
import type { Response, Request } from 'express';

@Controller('auth') // Đánh dấu class Controller có route gốc là /auth
export class AuthController {
  // export class AuthController để các file thư mục khác có thể import và sử dụng
  constructor(private readonly authService: AuthService) {} // Inject AuthService vào AuthController

  @Public() // Decorator đánh dấu method login được public nên không cần kiểm tra token
  @Post('login') // Tạo endpoint login lên server để yêu cầu đăng nhập
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, refreshToken } = await this.authService.login(dto);

    // Set refreshToken vào httpOnly cookie, KHÔNG trả trong JSON body nữa!
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
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

  @Public()
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refreshToken'];
    const payload: any = JSON.parse(
      Buffer.from(refreshToken.split('.')[1], 'base64').toString(),
    );

    const tokens = await this.authService.refreshTokens(
      payload.sub,
      refreshToken,
    );

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { access_token: tokens.access_token };
  }

  @Post('logout')
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.user.sub);
    res.clearCookie('refreshToken');
    return { message: 'Đăng xuất thành công!' };
  }
}
