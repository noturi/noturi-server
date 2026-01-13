import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { AppVersionService } from './app-version.service';
import { AppVersionResponseDto } from './dto';

@ApiTags('App Version')
@Controller('app-version')
export class AppVersionController {
  constructor(private readonly appVersionService: AppVersionService) {}

  @Get()
  @ApiOperation({ summary: '앱 버전 정보 조회' })
  @ApiResponse({ status: 200, description: '조회 성공', type: AppVersionResponseDto })
  async getAppVersion() {
    return this.appVersionService.getAppVersion();
  }
}
