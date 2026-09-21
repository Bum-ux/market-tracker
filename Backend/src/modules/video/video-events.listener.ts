import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { VIDEO_ENDED, VIDEO_WENT_LIVE } from './video.events';
import type { VideoStateEvent } from './video.events';

@Injectable()
export class VideoEventsListener {
  private readonly logger = new Logger(VideoEventsListener.name);

  @OnEvent(VIDEO_WENT_LIVE)
  onWentLive(event: VideoStateEvent) {
    this.logger.log(
      `Livestream bắt đầu: ${event.externalId} (${event.channelId})`,
    );
  }

  @OnEvent(VIDEO_ENDED)
  onEnded(event: VideoStateEvent) {
    this.logger.log(
      `Livestream kết thúc: ${event.externalId} (${event.channelId})`,
    );
  }
}
