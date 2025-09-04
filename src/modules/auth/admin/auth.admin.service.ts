import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AdminLoginDto, AdminRegisterDto } from './dto';

@Injectable()
export class AdminAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async registerAdmin(data: AdminRegisterDto) {
    // 이메일 중복 체크
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('이미 존재하는 이메일입니다');
    }

    // 닉네임 중복 체크
    const existingNickname = await this.prisma.user.findUnique({
      where: { nickname: data.nickname },
    });

    if (existingNickname) {
      throw new ConflictException('이미 존재하는 닉네임입니다');
    }

    // 패스워드 해시
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // 어드민 계정 생성
    const admin = await this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        nickname: data.nickname,
        password: hashedPassword,
        role: 'ADMIN',
        // OAuth 필드는 null로 남겨둠
        provider: null,
        providerId: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        role: true,
        createdAt: true,
      },
    });

    return {
      message: '어드민 계정이 생성되었습니다',
      admin,
    };
  }

  async loginAdmin(data: AdminLoginDto) {
    // 이메일로 사용자 찾기 (로컬 인증 계정만)
    const user = await this.prisma.user.findFirst({
      where: {
        email: data.email,
        password: { not: null }, // 패스워드가 있는 계정만
        role: 'ADMIN',
      },
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        password: true,
        role: true,
        avatarUrl: true,
        isStatsPublic: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('이메일 또는 패스워드가 올바르지 않습니다');
    }

    // 패스워드 검증
    const isPasswordValid = await bcrypt.compare(data.password, user.password!);
    if (!isPasswordValid) {
      throw new UnauthorizedException('이메일 또는 패스워드가 올바르지 않습니다');
    }

    // JWT 토큰 생성
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        nickname: user.nickname,
        role: user.role,
        avatarUrl: user.avatarUrl,
        isStatsPublic: user.isStatsPublic,
      },
    };
  }
}

