import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { NewsService } from './news.service';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('news') // Decorator để đánh dấu Controller và route gốc là /news
export class NewsController {
  // export class NewsController để những file khác có thể import và sử dụng được NewsController
  constructor(private readonly newsService: NewsService) {} // NestJS sẽ inject NewsService vào Controller thông qua constructor. Đây là nơi sử dụng Dependency Injection

  @Public()
  @Get('rss') // Sử dụng phương thức Get để lấy dữ liệu từ rss và tạo endpoint
  async getRssData(@Query('url') url: string) {
    // @Query('url') dùng để lấy giá trị của tham số url từ Query String
    // Hàm bất đồng bộ để truy vấn đường link
    if (!url) {
      // Lệnh điều kiện dùng để kiểm tra tham số url có rỗng hay không. Nếu rỗng thì sẽ chạy dòng 13.
      // Nếu có url thì sẽ bỏ qua dòng 13 và xuống dòng 14
      throw new BadRequestException('Cần truyền url vào!'); // Nếu không có đường link (url) thì ném một BadRequestException mới với thông tin chi tiết
    }
    const newsData = await this.newsService.fetchNews(url); // Chờ newsService lấy dữ liệu từ đường link về và gán vào biến newsData
    return { success: true, count: newsData.length, data: newsData }; // Trả kết quả success là true, count là độ dài của dữ liệu được kéo từ đường link về và data là newsData
  }

  @Get('list')
  async getAllNews() {
    const data = await this.newsService.getAllNews();
    return { success: true, count: data.length, data };
  }
}
