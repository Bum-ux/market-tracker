import { Module } from '@nestjs/common';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';
import { PrismaService } from 'src/modules/infrastructure/prisma/prisma.service';
import { RedisModule } from '../infrastructure/redis/redis.module';

@Module({
  // Decorator đánh dấu NestJS biết đây là module để quản lý và nhóm các thành phần lại với nhau

  imports: [RedisModule],
  controllers: [NewsController], // Đăng ký thành phần NewsController để NestJS biết NewsController thuộc về NewsModule

  providers: [NewsService, PrismaService], // Đăng ký thành phần NewsService và PrismaService để làm provide và NestJS có thể Inject vào các class khác
})
export class NewsModule {} // export class NewsModule để module khác có thể import và sử dụng
