import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
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
import { AppVersionModule } from './modules/app-version/app-version.module';
import { TodosModule } from './modules/todos/todos.module';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),  // 스케줄러 모듈
    // IP당 분당 300회 — 앱 시작 시 병렬 요청(15개+)을 감안한 넉넉한 기본값. 로그인/갱신은 엔드포인트별로 더 엄격하게
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 300 }]),
    PrismaModule,
    AuthModule,
    CategoriesModule,
    MemosModule,
    StatisticsModule,
    UsersModule,
    DashboardModule,
    CalendarMemosModule,
    NotificationsModule,
    AppVersionModule,
    TodosModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 처리되지 않은 예외(5xx)를 Sentry로 보고 — HttpException(4xx)은 보고하지 않음
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
    // 요청 제한 실제 적용 (ThrottlerModule 설정과 @Throttle은 이 가드가 있어야 동작)
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 개발 환경에서만 로거 미들웨어 적용
    if (process.env.NODE_ENV !== 'production') {
      consumer.apply(LoggerMiddleware).forRoutes('*');
    }
  }
}
