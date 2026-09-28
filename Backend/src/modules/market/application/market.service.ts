import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { MARKET_PRICE_CHANGED } from '../../notification/notification.events';

export interface CoinPrice {
  id: string;
  marketId: number;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
}

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);
  private pending?: Promise<CoinPrice[]>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  @Cron('0 */5 * * * *', { waitForCompletion: true })
  async syncBookmarkedMarkets() {
    try {
      await this.fetchCryptoData();
    } catch {
      this.logger.error('Không đồng bộ được giá market');
    }
  }

  fetchCryptoData() {
    if (!this.pending) {
      this.pending = this.fetchAndSave().finally(() => {
        this.pending = undefined;
      });
    }
    return this.pending;
  }

  private async fetchAndSave(): Promise<CoinPrice[]> {
    const bookmarked = await this.prisma.market.findMany({
      where: { marketBookmarks: { some: {} } },
      select: { coinId: true },
    });
    const ids = [...new Set(['bitcoin', ...bookmarked.map((m) => m.coinId)])];
    const result: CoinPrice[] = [];
    for (let offset = 0; offset < ids.length; offset += 100) {
      const url = new URL('https://api.coingecko.com/api/v3/simple/price');
      url.search = new URLSearchParams({
        vs_currencies: 'usd',
        ids: ids.slice(offset, offset + 100).join(','),
        include_24hr_change: 'true',
      }).toString();
      const response = await fetch(url, {
        headers: process.env.COINGECKO_API_KEY
          ? { 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY }
          : {},
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok)
        throw new Error(`Market API returned ${response.status}`);
      const prices = (await response.json()) as Record<
        string,
        { usd?: number; usd_24h_change?: number }
      >;
      for (const coinId of ids.slice(offset, offset + 100)) {
        const price = prices[coinId]?.usd;
        if (typeof price !== 'number' || !Number.isFinite(price) || price < 0)
          continue;
        const market = await this.prisma.market.upsert({
          where: { coinId },
          create: {
            coinId,
            name: coinId.charAt(0).toUpperCase() + coinId.slice(1),
            lastPrice: price,
          },
          update: {},
        });
        if (market.lastPrice !== price) {
          const updated = await this.prisma.market.updateMany({
            where: { id: market.id, lastPrice: market.lastPrice },
            data: { lastPrice: price },
          });
          // The first sample establishes a baseline; it is not a price change.
          if (updated.count && market.lastPrice !== null) {
            await this.events.emitAsync(MARKET_PRICE_CHANGED, {
              eventKey: randomUUID(),
              marketId: market.id,
              name: market.name ?? coinId,
              previousPrice: market.lastPrice,
              price,
              occurredAt: new Date(),
            });
          }
        }
        result.push({
          id: coinId,
          marketId: market.id,
          name: market.name ?? coinId,
          current_price: price,
          price_change_percentage_24h: prices[coinId].usd_24h_change ?? 0,
        });
      }
    }
    return result;
  }
}
