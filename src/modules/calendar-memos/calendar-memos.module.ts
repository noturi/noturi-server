import { Module } from '@nestjs/common';
import { CalendarMemosService } from './calendar-memos.service';
import { CalendarMemosClientController } from './client/calendar-memos.client.controller';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CalendarMemosClientController],
  providers: [CalendarMemosService],
  exports: [CalendarMemosService],
})
export class CalendarMemosModule {}