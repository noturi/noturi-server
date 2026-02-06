import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { AdminNotificationsController } from './admin/admin-notifications.controller';
import { AdminNotificationsService } from './admin/admin-notifications.service';

@Module({
  controllers: [DevicesController, AdminNotificationsController],
  providers: [NotificationsService, DevicesService, AdminNotificationsService],
  exports: [NotificationsService, DevicesService, AdminNotificationsService],
})
export class NotificationsModule {}
