import { RedisService } from './../infrastructure/redis/redis.service';
import { PrismaService } from 'src/modules/infrastructure/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import Parser from 'rss-parser';
import { log } from 'console';

@Injectable() // Khởi tạo injectable để có thể sử dụng Dependency Injection
export class NewsService {
  // export class NewsService để những file khác có thể import và sử dụng NewsService

  constructor(
    private readonly prismaService: PrismaService, // Inject PrismaService vào NewsService
    private readonly redisService: RedisService,
  ) {}
  private parser = new Parser(); // Khởi tạo parser là một Parser mới để đọc và phân tích dữ liệu
  async fetchNews(url: string) {
    // Hàm bất đồng bộ lấy dữ liệu Rss từ url
    try {
      // Sử dụng khối try-catch để có thế thực thi và bắt lỗi code rồi xử lý thay vì dừng chương trình
      const newFeed = await this.parser.parseURL(url); // Gửi request HTTP đến RSS URL, phân tích dữ liệu url và trả về đối tượng là newFeed
      console.log(newFeed); // In dũ liệu của biến newFeed
      for (const item of newFeed.items) {
        // khai báo biến item được chạy trong vòng lặp for để duyệt qua những items trong biến newFeed để lưu vào database
        await this.prismaService.news.upsert({
          // Chờ prismaService update hoặc insert những dữ liệu vào database. news là một models trong prismaclient
          where: { link: item.link ?? '' }, // Tìm vị trí để đưa link vào database.
          // Dấu '??' là để xác định nếu link đang null hoặc undefined, nếu null hoặc undefined thì sẽ dùng bên rỗng. Đây là Nullish Coalescing Operator
          update: {}, // Nếu dữ liệu đã tồn tại thì sẽ không cập nhật gì
          create: {
            // Tạo data vào database
            title: item.title ?? 'Không có tiêu đề', // Cách chạy giống dòng 24
            link: item.link ?? '', // Cách chạy giống dòng 24
            pubDate: item.pubDate ?? '', // Cách chạy giống dòng 24
            contentSnippet: item.contentSnippet ?? '', // Cách chạy giống dòng 24
          },
        });
      }

      await this.redisService.del('news:list');
      return newFeed.items.map((item) => ({
        // Trả kết quả newFeed và dẫn item bằng map đến item và gán dữ liệu là data trong database
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        contentSnippet: item.contentSnippet,
      }));
    } catch (error) {
      // Bắt lỗi và xử lý lỗi của khối try
      if (error instanceof Error) {
        // Xác định xem error có phải là kiểu Error hay không
        throw new Error(`Lỗi RSS: ${error.message}`); // Ném ra một Error mới cùng với thông tin chi tiết
      }
      throw new Error('Lỗi không xác định'); // Ném ra một Error mới cùng với thông tin chung nếu như không xác định lỗi chính xác
    }
  }

  async getAllNews() {
    const cached = await this.redisService.get('news:list');

    if (cached) {
      console.log(cached);
      return JSON.parse(cached);
    }

    console.log('CACHE MISS - Query từ Database');
    const allNews = await this.prismaService.news.findMany({
      orderBy: { createdAt: 'desc' },
    });

    await this.redisService.set('news:list', JSON.stringify(allNews), 300);

    return allNews;
  }
}
