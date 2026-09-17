import { Module } from '@nestjs/common';
import { PrismaModule } from '../infrastructure/prisma/prisma.module';
import { RedisModule } from '../infrastructure/redis/redis.module';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';
import { YouTubeProvider } from './youtube.provider';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [VideoController],
  providers: [VideoService, YouTubeProvider],
})
export class VideoModule {}
