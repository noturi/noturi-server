import { Module } from '@nestjs/common';
import { AppVersionController } from './app-version.controller';
import { AppVersionAdminController } from './admin/app-version.admin.controller';
import { AppVersionService } from './app-version.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AppVersionController, AppVersionAdminController],
  providers: [AppVersionService],
  exports: [AppVersionService],
})
export class AppVersionModule {}
