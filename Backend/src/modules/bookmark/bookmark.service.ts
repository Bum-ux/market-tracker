import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/modules/infrastructure/prisma/prisma.service';

@Injectable()
export class BookmarkService {
  constructor(private readonly prismaService: PrismaService) {}

  async getNewsBookMarks(userId: number) {
    const result = await this.prismaService.newsBookmark.findMany({
      where: { userId },
      include: { news: true },
      orderBy: { createdAt: 'desc' },
    });

    if (result.length === 0)
      return { message: 'Operation successfully. No bookmarks', data: [] };

    return result;
  }

  async addNewsBookMark(userId: number, newsId: number) {
    const news = await this.prismaService.news.findUnique({
      where: { id: newsId },
    });

    if (!news) {
      throw new NotFoundException('Không tìm thấy tin tức!');
    }

    const existedBookmark = await (
      this.prismaService as any
    ).newsBookmark.findUnique({
      where: {
        userId_newsId: { userId, newsId },
      },
    });

    if (existedBookmark) {
      throw new ConflictException('Tin tức này đã được bookmark!');
    }

    return (this.prismaService as any).newsBookmark.create({
      data: { userId, newsId },
      include: { news: true },
    });
  }

  async deleteNewsBookMark(userId: number, newsId: number) {
    const bookmark = await this.prismaService.newsBookmark.findUnique({
      where: {
        userId_newsId: { userId, newsId },
      },
    });

    if (!bookmark) {
      throw new NotFoundException('Không tìm thấy bookmark!');
    }

    await this.prismaService.newsBookmark.delete({
      where: {
        userId_newsId: { userId, newsId },
      },
    });

    return { message: 'Xóa bookmark thành công!' };
  }
}
