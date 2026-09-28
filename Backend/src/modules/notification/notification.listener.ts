import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { VIDEO_ENDED, VIDEO_WENT_LIVE } from '../video/video.events';
import type { VideoStateEvent } from '../video/video.events';
import { NEWS_UPDATED, MARKET_PRICE_CHANGED } from './notification.events';
import type {
  NewsUpdatedEvent,
  MarketPriceChangedEvent,
} from './notification.events';
import type { Prisma } from '../../../generated/prisma/client';

@Injectable()
export class NotificationListener {
  constructor(private readonly prisma: PrismaService) {}

  @OnEvent(NEWS_UPDATED, { suppressErrors: false })
  async onNewsUpdated(event: NewsUpdatedEvent) {
    const bookmarks = await this.prisma.newsBookmark.findMany({
      where: { newsId: event.newsId, createdAt: { lte: event.occurredAt } },
      select: { userId: true },
    });
    await this.save(bookmarks, {
      eventKey: event.eventKey,
      type: 'NEWS_UPDATED',
      newsId: event.newsId,
      title: 'Tin tức đã được cập nhật',
      message: event.title,
    });
  }

  @OnEvent(MARKET_PRICE_CHANGED, { suppressErrors: false })
  async onMarketPriceChanged(event: MarketPriceChangedEvent) {
    const bookmarks = await this.prisma.marketBookmark.findMany({
      where: { marketId: event.marketId, createdAt: { lte: event.occurredAt } },
      select: { userId: true },
    });
    await this.save(bookmarks, {
      eventKey: event.eventKey,
      type: 'MARKET_PRICE_CHANGED',
      marketId: event.marketId,
      title: `${event.name}: giá đã thay đổi`,
      message: `${event.previousPrice} USD → ${event.price} USD`,
    });
  }

  @OnEvent(VIDEO_WENT_LIVE, { suppressErrors: false })
  onVideoLive(event: VideoStateEvent) {
    return this.videoNotification(event, 'VIDEO_WENT_LIVE');
  }

  @OnEvent(VIDEO_ENDED, { suppressErrors: false })
  onVideoEnded(event: VideoStateEvent) {
    return this.videoNotification(event, 'VIDEO_ENDED');
  }

  private async videoNotification(
    event: VideoStateEvent,
    type: 'VIDEO_WENT_LIVE' | 'VIDEO_ENDED',
  ) {
    const video = await this.prisma.video.findUnique({
      where: { externalId: event.externalId },
      select: { id: true },
    });
    if (!video) return;
    const bookmarks = await this.prisma.videoBookmark.findMany({
      where: { videoId: video.id, createdAt: { lte: event.occurredAt } },
      select: { userId: true },
    });
    await this.save(bookmarks, {
      eventKey: `${type}:${event.externalId}:${event.occurredAt.toISOString()}`,
      type,
      videoId: video.id,
      title:
        type === 'VIDEO_WENT_LIVE'
          ? 'Livestream đã bắt đầu'
          : 'Livestream đã kết thúc',
      message: event.title,
    });
  }

  private async save(
    bookmarks: { userId: number }[],
    data: Omit<Prisma.NotificationCreateManyInput, 'userId'>,
  ) {
    if (!bookmarks.length) return;
    await this.prisma.notification.createMany({
      data: bookmarks.map(({ userId }) => ({ ...data, userId })),
      skipDuplicates: true,
    });
  }
}
