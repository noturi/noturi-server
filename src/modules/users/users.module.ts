import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersClientController } from './client/users.client.controller';
import { UsersAdminController } from './admin/users.admin.controller';

@Module({
  controllers: [UsersClientController, UsersAdminController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
