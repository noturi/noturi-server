import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ClientAuthService } from './auth.client.service';
import {
  GoogleNativeLoginDto,
  AppleLoginDto,
  LoginResponseDto,
  LogoutDto,
  RefreshTokenDto,
  RefreshResponseDto,
} from './dto/client-auth.dto';
import { ErrorResponseDto } from '../../../common/dto/error-response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('client - 인증')
@Controller('client/auth')
export class AuthClientController {
  constructor(private readonly clientAuthService: ClientAuthService) {}

  @Post('google/native')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: '구글 네이티브 로그인 (client/auth)' })
  @ApiResponse({ status: 200, description: '로그인 성공', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: '인증 실패', type: ErrorResponseDto })
  async googleNativeLogin(@Body() googleLoginDto: GoogleNativeLoginDto) {
    return this.clientAuthService.googleNativeLogin(googleLoginDto);
  }

  @Post('apple/native')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: '애플 네이티브 로그인 (client/auth)' })
  @ApiResponse({ status: 200, description: '로그인 성공', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: '인증 실패', type: ErrorResponseDto })
  async appleNativeLogin(@Body() appleLoginDto: AppleLoginDto) {
    return this.clientAuthService.appleLogin(appleLoginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @ApiOperation({ summary: '토큰 갱신 (client/auth)' })
  @ApiResponse({ status: 200, description: '토큰 갱신 성공', type: RefreshResponseDto })
  @ApiResponse({ status: 401, description: '리프레시 토큰 만료 또는 유효하지 않음', type: ErrorResponseDto })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.clientAuthService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '로그아웃 (현재 디바이스 정리)' })
  @ApiResponse({ status: 200, description: '로그아웃 성공' })
  @ApiResponse({ status: 401, description: '인증 실패', type: ErrorResponseDto })
  async logout(
    @CurrentUser('id') userId: string,
    @CurrentUser('sessionId') sessionId: string | undefined,
    @Body() dto: LogoutDto,
  ) {
    return this.clientAuthService.logout(userId, dto.expoPushToken, sessionId);
  }

  @Post('widget-session')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiBearerAuth()
  @ApiOperation({
    summary: '위젯 전용 세션 발급',
    description: '앱 세션과 독립적으로 회전하는 위젯용 토큰 쌍을 발급합니다. 같은 앱 세션의 기존 위젯 세션은 폐기됩니다.',
  })
  @ApiResponse({ status: 200, description: '발급 성공', type: RefreshResponseDto })
  @ApiResponse({ status: 401, description: '인증 실패', type: ErrorResponseDto })
  async issueWidgetSession(
    @CurrentUser('id') userId: string,
    @CurrentUser('sessionId') sessionId: string | undefined,
  ) {
    return this.clientAuthService.issueWidgetSession(userId, sessionId);
  }
}
