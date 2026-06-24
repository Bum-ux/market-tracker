import { Module } from '@nestjs/common';
import { MarketController } from './application/market.controller';
import { MarketService } from './application/market.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  controllers: [MarketController],
  providers: [MarketService]
})
export class MarketModule {}
