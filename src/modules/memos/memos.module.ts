import { Module } from '@nestjs/common';
import { MemosService } from './memos.service';
import { MemosClientController } from './client/memos.client.controller';

@Module({
  controllers: [MemosClientController],
  providers: [MemosService],
  exports: [MemosService],
})
export class MemosModule {}
