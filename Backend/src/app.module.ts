import { RedisModule } from './modules/infrastructure/redis/redis.module';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MarketModule } from './modules/market/market.module';
import { PrismaModule } from './modules/infrastructure/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { NewsModule } from './modules/news/news.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtGuard } from './common/guards/jwt.guard';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { BookmarkModule } from './modules/bookmark/bookmark.module';
import { AdminModule } from './modules/admin/admin.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 10000,
          limit: 10,
        },
      ],
    }),
    RedisModule,
    ConfigModule.forRoot({ isGlobal: true }),
    MarketModule,
    PrismaModule,
    AuthModule,
    NewsModule,
    BookmarkModule,
    AdminModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
