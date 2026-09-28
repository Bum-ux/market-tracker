import Parser from 'rss-parser';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NewsService } from './news.service';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { RedisService } from '../infrastructure/redis/redis.service';
import { NEWS_UPDATED } from '../notification/notification.events';

describe('News update events', () => {
  const item = {
    link: 'https://example.com/story',
    title: 'Updated title',
    pubDate: 'today',
    contentSnippet: 'body',
  };
  const news = {
    findUnique: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  };
  const events = { emitAsync: jest.fn() };
  let service: NewsService;
  beforeEach(() => {
    jest.resetAllMocks();
    jest
      .spyOn(Parser.prototype, 'parseURL')
      .mockResolvedValue({ items: [item] });
    news.findUnique.mockResolvedValue({
      ...item,
      id: 3,
      title: 'Old title',
      categoryId: 1,
    });
    news.updateMany.mockResolvedValue({ count: 1 });
    service = new NewsService(
      {
        news,
        category: { upsert: jest.fn().mockResolvedValue({ id: 1 }) },
      } as unknown as PrismaService,
      { del: jest.fn() } as unknown as RedisService,
      events as unknown as EventEmitter2,
    );
  });
  afterEach(() => jest.restoreAllMocks());

  it('persists changed content and then publishes a news update', async () => {
    await service.fetchNews('https://example.com/rss', 'News');
    expect(news.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ title: item.title }) as unknown,
      }),
    );
    expect(events.emitAsync).toHaveBeenCalledWith(
      NEWS_UPDATED,
      expect.objectContaining({ newsId: 3, title: item.title }),
    );
    expect(news.updateMany.mock.invocationCallOrder[0]).toBeLessThan(
      events.emitAsync.mock.invocationCallOrder[0],
    );
  });

  it('does not notify for unchanged articles', async () => {
    news.findUnique.mockResolvedValue({ ...item, id: 3, categoryId: 1 });
    await service.fetchNews('https://example.com/rss', 'News');
    expect(news.updateMany).not.toHaveBeenCalled();
    expect(events.emitAsync).not.toHaveBeenCalled();
  });

  it('does not notify for new articles', async () => {
    news.findUnique.mockResolvedValue(null);
    await service.fetchNews('https://example.com/rss', 'News');
    expect(news.upsert).toHaveBeenCalled();
    expect(events.emitAsync).not.toHaveBeenCalled();
  });

  it('does not emit if saving fails or another worker updated the article', async () => {
    news.updateMany.mockResolvedValueOnce({ count: 0 });
    await service.fetchNews('https://example.com/rss', 'News');
    news.updateMany.mockRejectedValueOnce(new Error('offline'));
    await expect(
      service.fetchNews('https://example.com/rss', 'News'),
    ).rejects.toThrow('offline');
    expect(events.emitAsync).not.toHaveBeenCalled();
  });
});
