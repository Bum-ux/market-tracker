import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationListener } from './notification.listener';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { NEWS_UPDATED, MARKET_PRICE_CHANGED } from './notification.events';
import { VIDEO_WENT_LIVE, VIDEO_ENDED } from '../video/video.events';
import type { Prisma } from '../../../generated/prisma/client';

describe('Notification event delivery', () => {
  const occurredAt = new Date('2026-09-28T10:00:00Z');
  const findMany = jest.fn();
  const createMany = jest.fn<
    Promise<Prisma.BatchPayload>,
    [Prisma.NotificationCreateManyArgs]
  >();
  const prisma = {
    newsBookmark: { findMany },
    marketBookmark: { findMany },
    videoBookmark: { findMany },
    video: { findUnique: jest.fn() },
    notification: { createMany },
  };
  let app: TestingModule;
  let events: EventEmitter2;

  beforeEach(async () => {
    jest.resetAllMocks();
    findMany.mockResolvedValue([{ userId: 7 }, { userId: 9 }]);
    prisma.video.findUnique.mockResolvedValue({ id: 12 });
    app = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [
        NotificationListener,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    await app.init();
    events = app.get(EventEmitter2);
  });
  afterEach(async () => {
    await app.close();
  });

  it.each([
    [
      NEWS_UPDATED,
      { eventKey: 'news-1', newsId: 12, title: 'Updated', occurredAt },
      'NEWS_UPDATED',
      'newsId',
    ],
    [
      MARKET_PRICE_CHANGED,
      {
        eventKey: 'market-1',
        marketId: 12,
        name: 'Bitcoin',
        previousPrice: 10,
        price: 11,
        occurredAt,
      },
      'MARKET_PRICE_CHANGED',
      'marketId',
    ],
    [
      VIDEO_WENT_LIVE,
      { externalId: 'abc', title: 'Stream', occurredAt },
      'VIDEO_WENT_LIVE',
      'videoId',
    ],
    [
      VIDEO_ENDED,
      { externalId: 'abc', title: 'Stream', occurredAt },
      'VIDEO_ENDED',
      'videoId',
    ],
  ])(
    'routes %s through the registered listener to bookmark owners',
    async (name, event, type, target) => {
      await events.emitAsync(name, event);
      expect(findMany).toHaveBeenCalledWith({
        where: { [target]: 12, createdAt: { lte: occurredAt } },
        select: { userId: true },
      });
      expect(createMany).toHaveBeenCalledWith({
        data: [7, 9].map(
          (userId) =>
            expect.objectContaining({ userId, type, [target]: 12 }) as unknown,
        ),
        skipDuplicates: true,
      });
    },
  );

  it('does not create notifications when nobody has bookmarked the item', async () => {
    findMany.mockResolvedValue([]);
    await events.emitAsync(NEWS_UPDATED, { newsId: 12, occurredAt });
    expect(createMany).not.toHaveBeenCalled();
  });

  it('uses the same deduplication key when a video event is redelivered', async () => {
    const event = { externalId: 'abc', title: 'Stream', occurredAt };
    await events.emitAsync(VIDEO_WENT_LIVE, event);
    await events.emitAsync(VIDEO_WENT_LIVE, event);
    expect(createMany.mock.calls[0][0]).toEqual(createMany.mock.calls[1][0]);
  });

  it('propagates persistence errors to the publisher', async () => {
    createMany.mockRejectedValue(new Error('database offline'));
    await expect(
      events.emitAsync(NEWS_UPDATED, { newsId: 12, occurredAt }),
    ).rejects.toThrow('database offline');
  });
});
