export const VIDEO_WENT_LIVE = 'video.went_live';
export const VIDEO_ENDED = 'video.ended';

export interface VideoStateEvent {
  externalId: string;
  channelId: string;
  title: string;
  occurredAt: Date;
}
