import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { VideoState } from '../../../generated/prisma/enums';
import { PrismaService } from '../infrastructure/prisma/prisma.service';
import { RedisService } from '../infrastructure/redis/redis.service';
import { YouTubeProvider } from './youtube.provider';
import { VIDEO_ENDED, VIDEO_WENT_LIVE, VideoStateEvent } from './video.events';

@Injectable()
export class VideoService implements OnApplicationBootstrap {
  private readonly logger = new Logger(VideoService.name);
  private syncing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly youtube: YouTubeProvider,
    private readonly config: ConfigService,
    private readonly events: EventEmitter2,
  ) {}

  onApplicationBootstrap() {
    void this.syncVideos().catch(() =>
      this.logger.error('Đồng bộ video khi khởi động thất bại'),
    );
  }

  @Cron('0 */15 * * * *', { waitForCompletion: true })
  async syncVideos() {
    const channels = [
      ...new Set(
        (this.config.get<string>('YOUTUBE_CHANNEL_IDS') ?? '')
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean),
      ),
    ];
    if (!this.config.get('YOUTUBE_API_KEY') || !channels.length || this.syncing)
      return;
    this.syncing = true;
    try {
      for (const channelId of channels) {
        try {
          if (!/^UC[\w-]{22}$/.test(channelId)) {
            this.logger.warn('Bỏ qua YouTube channel ID không hợp lệ');
            continue;
          }
          const latest = await this.youtube.latestVideoIds(channelId);
          // Refresh streams even after they leave the latest uploads page.
          const active = await this.prisma.video.findMany({
            where: {
              channelId,
              state: { in: [VideoState.LIVE, VideoState.UPCOMING] },
            },
            select: { externalId: true },
          });
          const ids = [
            ...new Set([...latest, ...active.map((video) => video.externalId)]),
          ];
          for (let offset = 0; offset < ids.length; offset += 50) {
            const batch = ids.slice(offset, offset + 50);
            const videos = await this.youtube.videos(batch);
            const previous = await this.prisma.video.findMany({
              where: { externalId: { in: batch } },
              select: { externalId: true, state: true },
            });
            const previousStates = new Map(
              previous.map((video) => [video.externalId, video.state]),
            );
            await this.prisma.$transaction([
              ...videos.map((video) =>
                this.prisma.video.upsert({
                  where: { externalId: video.externalId },
                  create: video,
                  update: video,
                }),
              ),
              this.prisma.video.updateMany({
                where: {
                  externalId: {
                    in: batch.filter(
                      (id) => !videos.some((video) => video.externalId === id),
                    ),
                  },
                },
                data: {
                  state: VideoState.UNAVAILABLE,
                  embedUrl: null,
                  syncedAt: new Date(),
                },
              }),
            ]);
            // Publish only after the batch commits. Repeated cron runs should not
            // announce the same state again.
            for (const video of videos) {
              const oldState = previousStates.get(video.externalId);
              const event: VideoStateEvent = {
                externalId: video.externalId,
                channelId: video.channelId,
                title: video.title,
                occurredAt: new Date(),
              };
              if (
                video.state === VideoState.LIVE &&
                oldState !== VideoState.LIVE
              ) {
                this.events.emit(VIDEO_WENT_LIVE, event);
              } else if (
                video.state === VideoState.ENDED &&
                (oldState === VideoState.LIVE ||
                  oldState === VideoState.UPCOMING)
              ) {
                this.events.emit(VIDEO_ENDED, event);
              }
            }
          }
          this.logger.log(`Đã đồng bộ ${ids.length} video của ${channelId}`);
        } catch {
          this.logger.error(
            `Đồng bộ kênh ${channelId} thất bại; sẽ thử lại ở lần cron sau`,
          );
        }
      }
    } finally {
      // Clear every state variant, including when a later batch fails.
      try {
        await Promise.all(
          ['ALL', ...Object.values(VideoState)].map((state) =>
            this.redis.del(`videos:list:${state}`),
          ),
        );
      } catch {
        this.logger.warn(
          'Không xóa được cache video; cache tự hết hạn sau 60 giây',
        );
      }
      this.syncing = false;
    }
  }

  async list(state?: string) {
    if (
      state !== undefined &&
      !Object.values(VideoState).includes(state as VideoState)
    ) {
      throw new BadRequestException(
        'state phải là VIDEO, UPCOMING, LIVE, ENDED hoặc UNAVAILABLE',
      );
    }
    const key = `videos:list:${state ?? 'ALL'}`;
    try {
      const cached = await this.redis.get(key);
      if (cached) {
        const parsed: unknown = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed as unknown[];
      }
    } catch {
      this.logger.warn('Không đọc được cache video; lấy từ database');
    }
    const videos = await this.prisma.video.findMany({
      where: {
        state: state ? (state as VideoState) : { not: VideoState.UNAVAILABLE },
      },
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      take: 100,
    });
    try {
      await this.redis.set(key, JSON.stringify(videos), 60);
    } catch {
      this.logger.warn('Không ghi được cache video');
    }
    return videos;
  }
}
