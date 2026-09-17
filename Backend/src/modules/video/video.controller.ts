import { Controller, Get, Query } from '@nestjs/common';
import { VideoService } from './video.service';

@Controller('videos')
export class VideoController {
  constructor(private readonly videos: VideoService) {}

  @Get('list')
  list(@Query('state') state?: string) {
    return this.videos.list(state);
  }
}
