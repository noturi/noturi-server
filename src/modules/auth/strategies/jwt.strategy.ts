import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../../prisma/prisma.service';
import { USER_PROFILE_SELECT } from '../../../common/constants/prisma-selects';
import { ERROR_MESSAGES } from '../../../common/constants/error-messages';

export interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
  type?: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: JwtPayload) {
    // refresh 토큰은 같은 secret으로 서명되므로 type으로 구분해 API 인증에서 거부 (type 없는 어드민 토큰은 허용)
    if (payload.type === 'refresh') {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { ...USER_PROFILE_SELECT, lastActiveAt: true },
    });

    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // 하루에 한 번만 lastActiveAt 갱신
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!user.lastActiveAt || user.lastActiveAt < today) {
      this.prisma.user.update({
        where: { id: payload.sub },
        data: { lastActiveAt: new Date() },
      }).catch(() => {});
    }

    return user;
  }
}
