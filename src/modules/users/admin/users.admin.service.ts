import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AdminUserQueryDto } from './dto';
import { UserRole } from '../../../common/enums/permissions.enum';

@Injectable()
export class UsersAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllUsers(queryDto: AdminUserQueryDto) {
    const { email, role, page = 1, limit = 20, sort = [], createdAt, notificationEnabled } = queryDto;

    const where: any = {
      ...(email && {
        email: { contains: email, mode: 'insensitive' },
      }),
      ...(role && { role }),
      ...(createdAt && {
        createdAt: {
          ...(createdAt.start && { gte: createdAt.start }),
          ...(createdAt.end && { lte: createdAt.end }),
        },
      }),
      ...(notificationEnabled !== undefined && {
        settings: {
          notification: notificationEnabled,
        },
      }),
    };

    // sort 파라미터 처리
    const orderBy: any = {};
    if (sort.length > 0) {
      sort.forEach((sortItem) => {
        orderBy[sortItem.id] = sortItem.desc ? 'desc' : 'asc';
      });
    } else {
      orderBy.createdAt = 'desc'; // 기본 정렬
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          nickname: true,
          email: true,
          name: true,
          avatarUrl: true,
          providers: true,
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
        orderBy,
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
        providers: true,
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