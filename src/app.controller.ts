import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Root')
@Controller()
export class AppController {
  @Get()
  healthCheck() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
