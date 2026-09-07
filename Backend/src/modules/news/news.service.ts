import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { RedisService } from '../infrastructure/redis/redis.service';
import { Injectable } from '@nestjs/common';
import Parser from 'rss-parser';
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * News-related services including fetching, deleting, etc.
 */
@Injectable() // Khởi tạo injectable để có thể sử dụng Dependency Injection
export class NewsService {
  // export class NewsService để những file khác có thể import và sử dụng NewsService

  constructor(
    private readonly prismaService: PrismaService, // Inject PrismaService vào NewsService
    private readonly redisService: RedisService,
  ) {}
  private parser = new Parser(); // Khởi tạo parser là một Parser mới để đọc và phân tích dữ liệu

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    const sources = [
      { url: process.env.RSS_GLOBAL_URL, category: 'Thế giới' },
      { url: process.env.RSS_BUSINESS_URL, category: 'kinh doanh' },
      { url: process.env.RSS_SPORTS_URL, category: 'Thể thao' },
      { url: process.env.RSS_EDUCATION_URL, category: 'Giáo dục' },
    ];

    for (const source of sources) {
      if (!source.url) {
        console.error(`Không tìm thấy url cho category: ${source.category}`);
        continue; // bỏ qua nguồn này, chạy tiếp nguồn khác, KHÔNG dừng cả vòng lặp
      }

      await this.fetchNews(source.url, source.category);
      console.log(`fetchNews đang chạy cho category: ${source.category}`);
    }
  }

  /**
   * Internal function to fetch and renew data for DB and server-side cache
   * @param url
   * @returns
   */
  async fetchNews(url: string, categoryName: string) {
    // Hàm bất đồng bộ lấy dữ liệu Rss từ url
    try {
      // Sử dụng khối try-catch để có thế thực thi và bắt lỗi code rồi xử lý thay vì dừng chương trình

      const category = await this.prismaService.category.upsert({
        where: { name: categoryName },
        update: {},
        create: { name: categoryName },
      });

      const newFeed = await this.parser.parseURL(url); // Gửi request HTTP đến RSS URL, phân tích dữ liệu url và trả về đối tượng là newFeed
      console.log(newFeed); // In dũ liệu của biến newFeed
      for (const item of newFeed.items) {
        // khai báo biến item được chạy trong vòng lặp for để duyệt qua những items trong biến newFeed để lưu vào database
        await this.prismaService.news.upsert({
          // Chờ prismaService update hoặc insert những dữ liệu vào database. news là một models trong prismaclient
          where: { link: item.link ?? '' }, // Tìm vị trí để đưa link vào database.
          // Dấu '??' là để xác định nếu link đang null hoặc undefined, nếu null hoặc undefined thì sẽ dùng bên rỗng. Đây là Nullish Coalescing Operator
          update: { categoryId: category.id }, // Nếu dữ liệu đã tồn tại thì sẽ không cập nhật gì
          create: {
            // Tạo data vào database
            title: item.title ?? 'Không có tiêu đề', // Cách chạy giống dòng 24
            link: item.link ?? '', // Cách chạy giống dòng 24
            pubDate: item.pubDate ?? '', // Cách chạy giống dòng 24
            contentSnippet: item.contentSnippet ?? '', // Cách chạy giống dòng 24
            categoryId: category.id,
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
