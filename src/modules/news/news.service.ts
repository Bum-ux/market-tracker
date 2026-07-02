import { PrismaService } from 'src/prisma.service';
import { Injectable } from '@nestjs/common';
import Parser from 'rss-parser';

@Injectable()
export class NewsService {
  constructor(
    private readonly prismaService: PrismaService,
    // private readonly parser = new Parser(),
  ) {}
  private parser = new Parser();
  async fetchNews(url: string) {
    try {
      const newFeed = await this.parser.parseURL(url);
      console.log(newFeed);
      for (const item of newFeed.items) {
        await this.prismaService.news.upsert({
          where: { link: item.link ?? '' },
          update: {},
          create: {
            title: item.title ?? 'Không có tiêu đề',
            link: item.link ?? '',
            pubDate: item.pubDate ?? '',
            contentSnippet: item.contentSnippet ?? '',
          },
        });
      }

      return newFeed.items.map((item) => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        contentSnippet: item.contentSnippet,
      }));
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Lỗi RSS: ${error.message}`);
      }
      throw new Error('Lỗi không xác định');
    }
  }
}
