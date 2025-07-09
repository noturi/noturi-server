import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CategoriesModule } from './categories/categories.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MemosModule } from './memos/memos.module';
import { StatisticsService } from './statistics/statistics.service';
import { StatisticsModule } from './statistics/statistics.module';

@Module({
  imports: [PrismaModule, CategoriesModule, AuthModule, UsersModule, MemosModule, StatisticsModule],
  controllers: [AppController],
  providers: [AppService, StatisticsService],
})
export class AppModule {}
