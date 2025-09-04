import { Module } from '@nestjs/common';
import { CategoriesClientController } from './client/categories.client.controller';
import { CategoriesAdminController } from './admin/categories.admin.controller';
import { CategoriesService } from './categories.service';
import { AdminService } from './admin/admin.service';

@Module({
  controllers: [CategoriesClientController, CategoriesAdminController],
  providers: [CategoriesService, AdminService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
