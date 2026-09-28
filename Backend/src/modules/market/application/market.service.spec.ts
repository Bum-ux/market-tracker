import { EventEmitter2 } from '@nestjs/event-emitter';
import { MarketService } from './market.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { MARKET_PRICE_CHANGED } from '../../notification/notification.events';

describe('Market price events', () => {
  const market = {
    findMany: jest.fn(),
    upsert: jest.fn(),
    updateMany: jest.fn(),
  };
  const events = { emitAsync: jest.fn() };
  let service: MarketService;
  beforeEach(() => {
    jest.resetAllMocks();
    market.findMany.mockResolvedValue([{ coinId: 'ethereum' }]);
    market.upsert.mockImplementation(
      ({ where }: { where: { coinId: string } }) =>
        Promise.resolve({
          id: where.coinId === 'bitcoin' ? 1 : 2,
          name: where.coinId,
          lastPrice: 100,
        }),
    );
    market.updateMany.mockResolvedValue({ count: 1 });
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ bitcoin: { usd: 100 }, ethereum: { usd: 120 } }),
    } as Response);
    service = new MarketService(
      { market } as unknown as PrismaService,
      events as unknown as EventEmitter2,
    );
  });
  afterEach(() => jest.restoreAllMocks());

  it('monitors bookmarked coins and emits only after a changed price is saved', async () => {
    const result = await service.fetchCryptoData();
    expect(result).toHaveLength(2);
    expect(fetch).toHaveBeenCalledWith(
      expect.objectContaining({
        search: expect.stringContaining('bitcoin%2Cethereum') as unknown,
      }),
      expect.anything(),
    );
    expect(events.emitAsync).toHaveBeenCalledTimes(1);
    expect(events.emitAsync).toHaveBeenCalledWith(
      MARKET_PRICE_CHANGED,
      expect.objectContaining({
        marketId: 2,
        previousPrice: 100,
        price: 120,
      }),
    );
    expect(market.updateMany.mock.invocationCallOrder[0]).toBeLessThan(
      events.emitAsync.mock.invocationCallOrder[0],
    );
  });

  it('sets a baseline without notifying on the first sample', async () => {
    market.upsert.mockResolvedValue({ id: 1, lastPrice: null });
    await service.fetchCryptoData();
    expect(market.updateMany).toHaveBeenCalled();
    expect(events.emitAsync).not.toHaveBeenCalled();
  });

  it('does not emit when another worker already changed the baseline', async () => {
    market.updateMany.mockResolvedValue({ count: 0 });
    await service.fetchCryptoData();
    expect(events.emitAsync).not.toHaveBeenCalled();
  });

  it('does not emit on a failed database write', async () => {
    market.updateMany.mockRejectedValue(new Error('offline'));
    await expect(service.fetchCryptoData()).rejects.toThrow('offline');
    expect(events.emitAsync).not.toHaveBeenCalled();
  });

  it('does not write an API error or invalid price as a new baseline', async () => {
    jest
      .mocked(fetch)
      .mockResolvedValueOnce({ ok: false, status: 429 } as Response);
    await expect(service.fetchCryptoData()).rejects.toThrow('429');
    expect(market.upsert).not.toHaveBeenCalled();
    jest.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({ bitcoin: { usd: null }, ethereum: { usd: 'bad' } }),
    } as Response);
    await expect(service.fetchCryptoData()).resolves.toEqual([]);
    expect(market.upsert).not.toHaveBeenCalled();
  });

  it('coalesces overlapping cron and HTTP refreshes', async () => {
    const first = service.fetchCryptoData();
    expect(service.fetchCryptoData()).toBe(first);
    await first;
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
