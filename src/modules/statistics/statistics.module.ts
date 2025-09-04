import { Module } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { StatisticsClientController } from './client/statistics.client.controller';

@Module({
  controllers: [StatisticsClientController],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}
