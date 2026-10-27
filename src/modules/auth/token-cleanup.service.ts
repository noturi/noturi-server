import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TokenService } from './token.service';

/** 만료된 리프레시 토큰 행 정리 (매일 04:00) */
@Injectable()
export class TokenCleanupService {
  private readonly logger = new Logger(TokenCleanupService.name);

  constructor(private readonly tokenService: TokenService) {}

  @Cron('0 4 * * *', { name: 'refresh-token-cleanup' })
  async cleanup() {
    const count = await this.tokenService.deleteExpired();
    if (count > 0) {
      this.logger.log(`만료된 리프레시 토큰 ${count}개 삭제`);
    }
  }
}
