export const NEWS_UPDATED = 'news.updated';
export const MARKET_PRICE_CHANGED = 'market.price_changed';

export interface NewsUpdatedEvent {
  eventKey: string;
  newsId: number;
  title: string;
  occurredAt: Date;
}

export interface MarketPriceChangedEvent {
  eventKey: string;
  marketId: number;
  name: string;
  previousPrice: number;
  price: number;
  occurredAt: Date;
}
