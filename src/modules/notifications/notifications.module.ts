import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { DevicesController } from './devices.controller';

@Module({
  controllers: [DevicesController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}

