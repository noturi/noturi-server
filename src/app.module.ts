import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { MemosModule } from './memos/memos.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StatisticsModule } from './statistics/statistics.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    CategoriesModule,
    AuthModule,
    UsersModule,
    MemosModule,
    StatisticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 개발 환경에서만 로거 미들웨어 적용
    if (process.env.NODE_ENV !== 'production') {
      consumer.apply(LoggerMiddleware).forRoutes('*');
    }
  }
}
