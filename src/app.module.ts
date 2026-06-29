import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MarketModule } from './modules/market/market.module';
import { PrismaModule } from './prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { NewsModule } from './modules/news/news.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtGuard } from './common/guards/jwt.guard';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

@Module({
    imports: [
    ConfigModule.forRoot({ isGlobal: true}), 
    MarketModule,
    PrismaModule,
    AuthModule,
    NewsModule,
  ],
  controllers: [AppController],
  providers: [AppService, 
    {provide: APP_GUARD,
      useClass: JwtGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
    .apply(LoggerMiddleware)
    .forRoutes('*')
  }

}
