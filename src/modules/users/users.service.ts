import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateUserDto } from './client/dto';
import { AdminUserQueryDto } from './admin/dto';
import { UserRole } from '../../common/enums/permissions.enum';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // 클라이언트용 메서드들
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
      throw new NotFoundException('사용자를 찾을 수 없습니다');
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
      throw new NotFoundException('사용자를 찾을 수 없습니다');
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
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    // 관련 데이터 삭제 (Cascade가 설정되어 있다면 자동으로 삭제됨)
    await this.prisma.user.delete({
      where: { id: userId },
    });
  }

  // 어드민용 메서드들
  async getAllUsers(queryDto: AdminUserQueryDto) {
    const { keyword, role, page = 1, limit = 20 } = queryDto;

    const where: any = {
      ...(keyword && {
        OR: [
          { nickname: { contains: keyword, mode: 'insensitive' } },
          { email: { contains: keyword, mode: 'insensitive' } },
          { name: { contains: keyword, mode: 'insensitive' } },
        ],
      }),
      ...(role && { role }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          nickname: true,
          email: true,
          name: true,
          avatarUrl: true,
          provider: true,
          isStatsPublic: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              memos: true,
              categories: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    const data = users.map((user) => ({
      ...user,
      memoCount: user._count.memos,
      categoryCount: user._count.categories,
    }));

    return {
      data,
      page,
      limit,
      total,
      totalPages,
    };
  }

  async getUserByIdForAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        email: true,
        name: true,
        avatarUrl: true,
        provider: true,
        isStatsPublic: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            memos: true,
            categories: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    return {
      ...user,
      memoCount: user._count.memos,
      categoryCount: user._count.categories,
    };
  }

  async deleteUserByAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      throw new ConflictException('슈퍼어드민 계정은 삭제할 수 없습니다');
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });
  }

  async updateUserRole(userId: string, newRole: UserRole) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: {
        id: true,
        nickname: true,
        email: true,
        role: true,
      },
    });
  }
}
