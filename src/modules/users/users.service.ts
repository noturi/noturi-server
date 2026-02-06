import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateUserDto, UpdateUserSettingsDto } from './client/dto';
import { Theme, Language } from '@prisma/client';
import { ERROR_MESSAGES } from '../../common/constants/error-messages';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        email: true,
        name: true,
        avatarUrl: true,
        isStatsPublic: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return user;
  }

  async getPublicUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        name: true,
        avatarUrl: true,
        isStatsPublic: true,
        createdAt: true,
        _count: {
          select: {
            memos: true,
            categories: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return {
      id: user.id,
      nickname: user.nickname,
      name: user.name,
      avatarUrl: user.avatarUrl,
      isStatsPublic: user.isStatsPublic,
      totalMemos: user._count.memos,
      totalCategories: user._count.categories,
      createdAt: user.createdAt,
    };
  }

  async updateUser(userId: string, updateUserDto: UpdateUserDto) {
    const { nickname, isStatsPublic } = updateUserDto;

    // 닉네임 중복 검사
    if (nickname) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          nickname,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        throw new ConflictException('이미 사용 중인 닉네임입니다');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(nickname !== undefined && { nickname }),
        ...(isStatsPublic !== undefined && { isStatsPublic }),
      },
      select: {
        id: true,
        nickname: true,
        email: true,
        name: true,
        avatarUrl: true,
        isStatsPublic: true,
        createdAt: true,
      },
    });
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });
  }

  // 사용자 설정 메서드들
  async getUserSettings(userId: string) {
    let settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });

    // 설정이 없으면 기본값으로 생성
    if (!settings) {
      settings = await this.prisma.userSettings.create({
        data: {
          userId,
          theme: Theme.light,
          language: Language.ko,
          notification: true,
        },
      });
    }

    return {
      theme: settings.theme,
      language: settings.language,
      notification: settings.notification,
    };
  }

  async updateUserSettings(userId: string, updateDto: UpdateUserSettingsDto) {
    const { theme, language, notification } = updateDto;

    // upsert로 없으면 생성, 있으면 업데이트
    const settings = await this.prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        theme: theme ?? Theme.light,
        language: language ?? Language.ko,
        notification: notification ?? true,
      },
      update: {
        ...(theme !== undefined && { theme }),
        ...(language !== undefined && { language }),
        ...(notification !== undefined && { notification }),
      },
    });

    return {
      theme: settings.theme,
      language: settings.language,
      notification: settings.notification,
    };
  }
}
