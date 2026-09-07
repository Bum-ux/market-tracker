import { Module } from '@nestjs/common';
import { MarketController } from './application/market.controller';
import { MarketService } from './application/market.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  // Đánh dấu một class Module cho NestJS để có thể quản lý và nhóm các thành phần lại với nhau
  controllers: [MarketController], // Truyền MarketCotroller vào Module để NestJs biết MarketController thuộc về MarketModule
  providers: [MarketService], // Truyền MarketService vào Module để NestJs biết MarketService thuộc về MarketModule và có thể Inject vào các class khác
})
export class MarketModule {} // Export class MarketModule để các file khác có thể import và sử dụng

// Nếu không có Module, cấu trúc thư mục file sẽ nằm lộn xộn nên việc có module là để gom tất cả lại với nhau và dễ tìm kiếm hơn
