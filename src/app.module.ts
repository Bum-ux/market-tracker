import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MarketModule } from './modules/market/market.module';
import { PrismaModule } from './prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { NewsModule } from './modules/news/news.module';

@Module({
    imports: [
    ConfigModule.forRoot({ isGlobal: true}), 
    MarketModule,
    PrismaModule,
    AuthModule,
    NewsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
