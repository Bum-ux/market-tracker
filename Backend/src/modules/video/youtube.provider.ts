import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VideoState } from '../../../generated/prisma/enums';

interface YouTubeVideo {
  id: string;
  snippet: {
    channelId: string;
    channelTitle: string;
    title: string;
    description: string;
    publishedAt: string;
    liveBroadcastContent?: string;
    thumbnails?: Record<string, { url: string }>;
  };
  contentDetails?: { duration?: string };
  status?: { embeddable?: boolean; privacyStatus?: string };
  liveStreamingDetails?: {
    scheduledStartTime?: string;
    actualStartTime?: string;
    actualEndTime?: string;
  };
}

export function durationToSeconds(duration?: string): number | null {
  if (!duration) return null;
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(
    duration,
  );
  if (!match || !match.slice(1).some((part) => part !== undefined)) return null;
  return (
    Number(match[1] ?? 0) * 86400 +
    Number(match[2] ?? 0) * 3600 +
    Number(match[3] ?? 0) * 60 +
    Number(match[4] ?? 0)
  );
}

export function normalizeVideo(video: YouTubeVideo) {
  const live = video.liveStreamingDetails;
  const state = live?.actualEndTime
    ? VideoState.ENDED
    : video.snippet.liveBroadcastContent === 'live'
      ? VideoState.LIVE
      : video.snippet.liveBroadcastContent === 'upcoming'
        ? VideoState.UPCOMING
        : VideoState.VIDEO;
  const thumbnails = video.snippet.thumbnails;
  return {
    externalId: video.id,
    provider: 'youtube',
    channelId: video.snippet.channelId,
    channelTitle: video.snippet.channelTitle,
    title: video.snippet.title,
    description: video.snippet.description,
    watchUrl: `https://www.youtube.com/watch?v=${video.id}`,
    embedUrl:
      video.status?.embeddable === true
        ? `https://www.youtube.com/embed/${video.id}`
        : null,
    thumbnailUrl:
      thumbnails?.maxres?.url ??
      thumbnails?.high?.url ??
      thumbnails?.default?.url ??
      null,
    publishedAt: new Date(video.snippet.publishedAt),
    durationSeconds: durationToSeconds(video.contentDetails?.duration),
    state,
    scheduledStartAt: live?.scheduledStartTime
      ? new Date(live.scheduledStartTime)
      : null,
    actualStartAt: live?.actualStartTime
      ? new Date(live.actualStartTime)
      : null,
    actualEndAt: live?.actualEndTime ? new Date(live.actualEndTime) : null,
    syncedAt: new Date(),
  };
}

@Injectable()
export class YouTubeProvider {
  constructor(private readonly config: ConfigService) {}

  private async request<T>(
    resource: string,
    params: Record<string, string>,
  ): Promise<T[]> {
    const key = this.config.get<string>('YOUTUBE_API_KEY');
    if (!key) throw new Error('Thiếu YOUTUBE_API_KEY');
    const query = new URLSearchParams({ ...params, key });
    let response: Response;
    try {
      response = await fetch(
        `https://www.googleapis.com/youtube/v3/${resource}?${query}`,
        {
          signal: AbortSignal.timeout(15000),
        },
      );
    } catch {
      // Do not expose the request URL, which contains the API key.
      throw new Error(`Không kết nối được YouTube ${resource}`);
    }
    if (!response.ok)
      throw new Error(`YouTube ${resource}: HTTP ${response.status}`);
    const body = (await response.json()) as { items?: T[] };
    if (!Array.isArray(body.items))
      throw new Error(`YouTube ${resource}: response không hợp lệ`);
    return body.items;
  }

  async latestVideoIds(channelId: string): Promise<string[]> {
    const channels = await this.request<{
      contentDetails: { relatedPlaylists: { uploads: string } };
    }>('channels', { part: 'contentDetails', id: channelId });
    const playlistId = channels[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!playlistId)
      throw new Error(`Không tìm thấy uploads playlist của ${channelId}`);
    const items = await this.request<{ contentDetails: { videoId: string } }>(
      'playlistItems',
      { part: 'contentDetails', playlistId, maxResults: '50' },
    );
    return items.map((item) => item.contentDetails.videoId);
  }

  async videos(ids: string[]) {
    if (!ids.length) return [];
    const videos = await this.request<YouTubeVideo>('videos', {
      part: 'snippet,contentDetails,status,liveStreamingDetails',
      id: ids.join(','),
    });
    return videos
      .filter((video) => video.status?.privacyStatus === 'public')
      .map(normalizeVideo);
  }
}
