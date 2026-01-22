import { Module } from '@nestjs/common';
import { TodosService } from './todos.service';
import { TodosStatsService } from './todos-stats.service';
import { TodosSchedulerService } from './todos-scheduler.service';
import { TodosClientController } from './client/todos.client.controller';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TodosClientController],
  providers: [TodosService, TodosStatsService, TodosSchedulerService],
  exports: [TodosService, TodosStatsService],
})
export class TodosModule {}
