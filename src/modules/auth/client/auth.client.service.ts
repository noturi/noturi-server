import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../../prisma/prisma.service';
import { GoogleNativeLoginDto, AppleLoginDto } from './dto/client-auth.dto';
import { getEnvConfig } from '../../../common/config/env.config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class ClientAuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async googleNativeLogin(googleLoginDto: GoogleNativeLoginDto) {
    try {
      // 네이티브 앱에서 이미 검증된 토큰을 받으므로 디코드만 진행
      const decodedToken = jwt.decode(googleLoginDto.idToken) as any;
      
      if (!decodedToken) {
        throw new UnauthorizedException('유효하지 않은 구글 토큰입니다.');
      }

      const { sub: googleId, email, name, picture } = decodedToken;

      if (!email) {
        throw new UnauthorizedException('이메일 정보를 가져올 수 없습니다.');
      }

      // 사용자 찾기 또는 생성
      let user = await this.prismaService.user.findUnique({
        where: { email },
      });

      if (!user) {
        // 닉네임은 이메일의 @ 앞부분을 기본값으로 사용
        const defaultNickname = email.split('@')[0];
        
        user = await this.prismaService.user.create({
          data: {
            email,
            nickname: defaultNickname,
            name: name || defaultNickname,
            provider: 'GOOGLE',
            providerId: googleId,
            avatarUrl: picture,
          },
        });
      } else if (user.provider !== 'GOOGLE' || user.providerId !== googleId) {
        // 기존 사용자에 Google 정보 추가
        user = await this.prismaService.user.update({
          where: { id: user.id },
          data: { 
            provider: 'GOOGLE',
            providerId: googleId,
            avatarUrl: picture || user.avatarUrl,
          },
        });
      }

      // JWT 토큰 생성
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

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Google 로그인에 실패했습니다.');
    }
  }

  async appleLogin(appleLoginDto: AppleLoginDto) {
    try {
      // Apple ID 토큰 디코드 (검증 없이)
      const decodedToken = jwt.decode(appleLoginDto.identityToken) as any;
      
      if (!decodedToken) {
        throw new UnauthorizedException('유효하지 않은 Apple 토큰입니다.');
      }

      const { sub: appleId, email } = decodedToken;
      
      // 이메일이 토큰에 없으면 DTO에서 가져오기
      const userEmail = email || appleLoginDto.email;
      
      if (!userEmail && !appleId) {
        throw new UnauthorizedException('Apple 사용자 정보를 가져올 수 없습니다.');
      }

      // Apple ID로 사용자 찾기
      let user = await this.prismaService.user.findFirst({
        where: {
          OR: [
            { providerId: appleId },
            { email: userEmail }
          ]
        }
      });

      if (!user && userEmail) {
        // 새 사용자 생성
        const defaultNickname = userEmail.split('@')[0];
        
        user = await this.prismaService.user.create({
          data: {
            email: userEmail,
            nickname: defaultNickname,
            name: appleLoginDto.fullName || defaultNickname,
            provider: 'APPLE',
            providerId: appleId,
          },
        });
      } else if (user && (!user.provider || user.provider !== 'APPLE')) {
        // 기존 사용자에 Apple 정보 추가
        user = await this.prismaService.user.update({
          where: { id: user.id },
          data: { 
            provider: 'APPLE',
            providerId: appleId,
          },
        });
      }

      if (!user) {
        throw new UnauthorizedException('사용자를 찾거나 생성할 수 없습니다.');
      }

      // JWT 토큰 생성
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

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Apple 로그인에 실패했습니다.');
    }
  }
}