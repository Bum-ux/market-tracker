import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: number, before?: number) {
    const [items, unreadCount] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where: { userId, ...(before ? { id: { lt: before } } : {}) },
        orderBy: { id: 'desc' },
        take: 21,
        include: {
          news: { select: { link: true } },
          video: { select: { watchUrl: true } },
          market: { select: { coinId: true } },
        },
      }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    return {
      items: items.slice(0, 20),
      unreadCount,
      nextCursor: items.length > 20 ? items[19].id : null,
    };
  }

  async markRead(userId: number, id: number) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) throw new NotFoundException('Không tìm thấy thông báo');
    await this.prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { id };
  }

  async markAllRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}
