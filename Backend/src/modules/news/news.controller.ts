import {
  Controller,
  Get,
  Query,
  BadRequestException,
  UseInterceptors,
} from '@nestjs/common';
import { NewsService } from './news.service';
import { Public } from 'src/common/decorators/public.decorator';
import { TransformInterceptor } from 'src/interceptors/transform.interceptor';

@Controller('news') // Deco để đánh dấu Controller và route gốc là /news
export class NewsController {
  // export class NewsController để những file khác có thể import và sử dụng được NewsController
  constructor(private readonly newsService: NewsService) {} // NestJS sẽ inject NewsService vào Controller thông qua constructor. Đây là nơi sử dụng Dependency Injection

  @Get('list')
  async getAllNews() {
    return this.newsService.getAllNews();

    // const data = await this.newsService.getAllNews();
    // return { success: true, count: data.length, data };
  }
}
