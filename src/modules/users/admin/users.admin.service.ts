import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AdminUserQueryDto } from './dto';
import { UserRole } from '../../../common/enums/permissions.enum';
import { ERROR_MESSAGES } from '../../../common/constants/error-messages';

@Injectable()
export class UsersAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllUsers(queryDto: AdminUserQueryDto) {
    const { email, role, page = 1, limit = 20, sort = [], createdAt, notificationEnabled } = queryDto;

    const where: any = {
      ...(email && {
        email: { contains: email, mode: 'insensitive' },
      }),
      ...(role && { role: Array.isArray(role) ? { in: role } : role }),
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
        settings: {
          select: {
            theme: true,
            language: true,
            notification: true,
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
            color: true,
            sortOrder: true,
            fields: { select: { id: true, name: true } },
            _count: { select: { memos: true } },
            createdAt: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        memos: {
          select: {
            id: true,
            title: true,
            content: true,
            rating: true,
            experienceDate: true,
            category: { select: { name: true } },
            customFields: {
              select: {
                value: true,
                categoryField: { select: { name: true } },
              },
            },
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        calendarMemos: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            isAllDay: true,
            hasNotification: true,
            notifyBefore: true,
            notificationSent: true,
            createdAt: true,
          },
          orderBy: { startDate: 'desc' },
          take: 50,
        },
        devices: {
          select: {
            id: true,
            expoPushToken: true,
            deviceName: true,
            platform: true,
            isActive: true,
            createdAt: true,
            lastActiveAt: true,
          },
        },
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

    const { categories, memos, _count, ...userData } = user;

    return {
      ...userData,
      memoCount: _count.memos,
      categoryCount: _count.categories,
      categories: categories.map(({ _count: catCount, ...cat }) => ({
        ...cat,
        memoCount: catCount.memos,
      })),
      memos: memos.map(({ category, customFields, ...memo }) => ({
        ...memo,
        categoryName: category?.name,
        customFields: customFields.map((cf) => ({
          fieldName: cf.categoryField.name,
          value: cf.value,
        })),
      })),
    };
  }

  async deleteUserByAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
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
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
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