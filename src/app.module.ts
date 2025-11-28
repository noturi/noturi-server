import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CategoriesModule } from './modules/categories/categories.module';
import { AuthModule } from './modules/auth/auth.module';
import { MemosModule } from './modules/memos/memos.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { UsersModule } from './modules/users/users.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CalendarMemosModule } from './modules/calendar-memos/calendar-memos.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),  // 스케줄러 모듈
    PrismaModule,
    AuthModule,
    CategoriesModule,
    MemosModule,
    StatisticsModule,
    UsersModule,
    DashboardModule,
    CalendarMemosModule,
    NotificationsModule,  // 푸시 알림 모듈
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
