import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getEnvConfig } from '../../common/config/env.config';

export interface TokenPayload {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  generateTokens(user: { id: string; email: string }): TokenPair {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      type: 'access',
    });

    const refreshToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        type: 'refresh',
      },
      { expiresIn: getEnvConfig().REFRESH_TOKEN_EXPIRES_IN },
    );

    return { accessToken, refreshToken };
  }

  verifyRefreshToken(token: string): TokenPayload {
    try {
      const payload = this.jwtService.verify<TokenPayload>(token);

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('리프레시 토큰이 만료되었거나 유효하지 않습니다.');
    }
  }
}
