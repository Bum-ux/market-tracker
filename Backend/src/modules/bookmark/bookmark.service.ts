import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/modules/infrastructure/prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';

@Injectable()
export class BookmarkService {
  constructor(private readonly prismaService: PrismaService) {}

  //*************************
  // #region News Bookmark
  //*************************
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
    try {
      return await this.prismaService.newsBookmark.create({
        data: { userId, newsId },
        include: { news: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Tin tức này đã được bookmark!');
        }
        if (error.code === 'P2003') {
          throw new NotFoundException('Không tìm thấy tin tức!');
        }
      }
      throw error;
    }
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

  //*************************
  // #region Video Bookmark
  //*************************
  async getVideoBookMarks(userId: number) {
    const result = await this.prismaService.videoBookmark.findMany({
      where: { userId },
      include: { video: true },
      orderBy: { createdAt: 'desc' },
    });

    if (result.length === 0)
      return { message: 'Operation successfully. No bookmarks', data: [] };

    return result;
  }

  async addVideoBookMark(userId: number, videoId: number){
    try {
      return await this.prismaService.videoBookmark.create({
        data: { userId, videoId },
        include: { video: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Video này đã được bookmark!');
        }
        if (error.code === 'P2003') {
          throw new NotFoundException('Không tìm thấy Video!');
        }
      }
      throw error;
    }
  }

  async deleteVideoBookMark(userId: number, videoId: number) {
    const bookmark = await this.prismaService.videoBookmark.findUnique({
      where: {
        userId_videoId: { userId, videoId },
      },
    });

    if (!bookmark) {
      throw new NotFoundException('Không tìm thấy bookmark!');
    }

    await this.prismaService.videoBookmark.delete({
      where: {
        userId_videoId: { userId, videoId },
      },
    });

    return { message: 'Xóa bookmark thành công!' };
  }

  //*************************
  // #region Market Bookmark
  //*************************
  async getMarketBookMarks(userId: number) {
    const result = await this.prismaService.marketBookmark.findMany({
      where: { userId },
      include: { market: true },
      orderBy: { createdAt: 'desc' },
    });

    if (result.length === 0)
      return { message: 'Operation successfully. No bookmarks', data: [] };

    return result;
  }

  async addMarketBookMark(userId: number, marketId: number){
    try {
      return await this.prismaService.marketBookmark.create({
        data: { userId, marketId },
        include: { market: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Market này đã được bookmark!');
        }
        if (error.code === 'P2003') {
          throw new NotFoundException('Không tìm thấy Market!');
        }
      }
      throw error;
    }
  }

  async deleteMarketBookMark(userId: number, marketId: number) {
    const bookmark = await this.prismaService.marketBookmark.findUnique({
      where: {
        userId_marketId: { userId, marketId },
      },
    });

    if (!bookmark) {
      throw new NotFoundException('Không tìm thấy bookmark!');
    }

    await this.prismaService.marketBookmark.delete({
      where: {
        userId_marketId: { userId, marketId },
      },
    });

    return { message: 'Xóa bookmark thành công!' };
  }
}
