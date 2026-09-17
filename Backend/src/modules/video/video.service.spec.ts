import { ConfigService } from '@nestjs/config';
import { VideoService } from './video.service';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { RedisService } from '../infrastructure/redis/redis.service';
import { YouTubeProvider } from './youtube.provider';

describe('VideoService', () => {
  const channelId = 'UC' + 'a'.repeat(22);
  let service: VideoService;
  let prisma: {
    video: { findMany: jest.Mock; upsert: jest.Mock; updateMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let redis: { get: jest.Mock; set: jest.Mock; del: jest.Mock };
  let youtube: { latestVideoIds: jest.Mock; videos: jest.Mock };

  beforeEach(() => {
    prisma = {
      video: {
        findMany: jest.fn().mockResolvedValue([]),
        upsert: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    };
    youtube = {
      latestVideoIds: jest.fn().mockResolvedValue(['new-video']),
      videos: jest.fn().mockResolvedValue([]),
    };
    service = new VideoService(
      prisma as unknown as PrismaService,
      redis as unknown as RedisService,
      youtube as unknown as YouTubeProvider,
      new ConfigService({
        YOUTUBE_API_KEY: 'key',
        YOUTUBE_CHANNEL_IDS: channelId,
      }),
    );
  });

  it('returns cached data without querying the database', async () => {
    redis.get.mockResolvedValue('[{"id":1}]');
    expect(await service.list()).toEqual([{ id: 1 }]);
    expect(prisma.video.findMany).not.toHaveBeenCalled();
  });

  it('serves database data despite Redis read and write failure', async () => {
    redis.get.mockRejectedValue(new Error('offline'));
    redis.set.mockRejectedValue(new Error('offline'));
    prisma.video.findMany.mockResolvedValue([{ id: 2 }]);
    expect(await service.list('LIVE')).toEqual([{ id: 2 }]);
    expect(prisma.video.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { state: 'LIVE' } }),
    );
  });

  it('rejects invalid state before accessing storage', async () => {
    await expect(service.list('invalid')).rejects.toThrow('state phải là');
    expect(redis.get).not.toHaveBeenCalled();
  });

  it('refreshes active streams outside the latest uploads page', async () => {
    prisma.video.findMany.mockResolvedValue([{ externalId: 'old-live' }]);
    await service.syncVideos();
    expect(youtube.videos).toHaveBeenCalledWith(['new-video', 'old-live']);
    expect(prisma.video.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ state: 'UNAVAILABLE' }) as unknown,
      }),
    );
    expect(redis.del).toHaveBeenCalledWith('videos:list:LIVE');
  });

  it('does not mark videos unavailable when YouTube fails and retries next time', async () => {
    youtube.videos.mockRejectedValue(new Error('quota exceeded'));
    await service.syncVideos();
    expect(prisma.video.updateMany).not.toHaveBeenCalled();
    await service.syncVideos();
    expect(youtube.latestVideoIds).toHaveBeenCalledTimes(2);
  });
});
