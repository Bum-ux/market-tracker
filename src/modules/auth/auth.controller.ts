import {Post, Body, Controller} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService){}

    @Public()
    @Post('login')
    async login(@Body()dto:LoginDto) {
        const result = await this.authService.login(dto)
        return result
    }

    @Public()
    @Post('register')
    async register(@Body()dto:RegisterDto) {
        const result = await this.authService.register(dto)
        return result
    }
}