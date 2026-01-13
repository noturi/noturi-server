import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppVersionService } from './app-version.service';

@ApiTags('App Version')
@Controller('app-version')
export class AppVersionController {
  constructor(private readonly appVersionService: AppVersionService) {}

  @Get()
  @ApiOperation({ summary: '앱 버전 정보 조회' })
  async getAppVersion() {
    return this.appVersionService.getAppVersion();
  }
}
