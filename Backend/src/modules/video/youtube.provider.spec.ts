import { ConfigService } from '@nestjs/config';
import {
  durationToSeconds,
  normalizeVideo,
  YouTubeProvider,
} from './youtube.provider';

const sample = {
  id: 'test-video',
  snippet: {
    channelId: 'channel',
    channelTitle: 'Channel',
    title: 'Video',
    description: '',
    publishedAt: '2026-09-16T00:00:00Z',
    liveBroadcastContent: 'none',
  },
  status: { embeddable: true, privacyStatus: 'public' },
  contentDetails: { duration: 'PT1H2M3S' },
};

describe('YouTube video normalization', () => {
  it.each([
    ['PT1H2M3S', 3723],
    ['P1DT2H', 93600],
    ['PT0S', 0],
    ['invalid', null],
    [undefined, null],
  ])('converts %s to seconds', (duration, expected) => {
    expect(durationToSeconds(duration)).toBe(expected);
  });

  it('preserves an ended livestream even when broadcast content is none', () => {
    const video = normalizeVideo({
      ...sample,
      liveStreamingDetails: {
        actualStartTime: '2026-09-16T00:00:00Z',
        actualEndTime: '2026-09-16T01:00:00Z',
      },
    });
    expect(video.state).toBe('ENDED');
    expect(video.actualEndAt).toEqual(new Date('2026-09-16T01:00:00Z'));
  });

  it.each([
    ['live', 'LIVE'],
    ['upcoming', 'UPCOMING'],
    ['none', 'VIDEO'],
  ])('maps broadcast state %s', (content, expected) => {
    expect(
      normalizeVideo({
        ...sample,
        snippet: { ...sample.snippet, liveBroadcastContent: content },
      }).state,
    ).toBe(expected);
  });

  it('omits embeds when the owner disables embedding', () => {
    expect(
      normalizeVideo({ ...sample, status: { embeddable: false } }).embedUrl,
    ).toBeNull();
  });
});

describe('YouTubeProvider', () => {
  const provider = new YouTubeProvider(
    new ConfigService({ YOUTUBE_API_KEY: 'secret-key' }),
  );
  afterEach(() => jest.restoreAllMocks());

  it('excludes private videos and normalizes public ones', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          items: [
            sample,
            { ...sample, id: 'private', status: { privacyStatus: 'private' } },
          ],
        }),
    } as Response);
    expect(await provider.videos(['test-video', 'private'])).toEqual([
      expect.objectContaining({
        externalId: 'test-video',
        durationSeconds: 3723,
      }),
    ]);
  });

  it('does not expose the API key on network failure', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockRejectedValue(new Error('request URL contains secret-key'));
    await expect(provider.videos(['test-video'])).rejects.toThrow(
      'Không kết nối được YouTube videos',
    );
  });

  it('rejects upstream errors instead of treating them as deleted videos', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({ ok: false, status: 403 } as Response);
    await expect(provider.videos(['test-video'])).rejects.toThrow('HTTP 403');
  });
});
