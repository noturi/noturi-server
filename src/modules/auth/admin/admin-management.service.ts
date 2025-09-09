import { Injectable, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateAdminDto } from './dto/admin-management.dto';
import { UserListQueryDto } from './dto/user-list.dto';
import { PaginationMetaDto } from '../../../common/dto/pagination.dto';

@Injectable()
export class AdminManagementService {
  constructor(private prisma: PrismaService) {}

  async createAdmin(data: CreateAdminDto) {
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
        role: data.role,

        providers: [],
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
      message: `${data.role} 계정이 생성되었습니다`,
      admin,
    };
  }

  async getUsers(query: UserListQueryDto) {
    const { page, limit, role, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    // 검색 조건 구성
    const where: any = {};
    
    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { nickname: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 전체 항목 수 조회
    const totalItems = await this.prisma.user.count({ where });

    // 데이터 조회
    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        role: true,
        avatarUrl: true,
        isStatsPublic: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        [sortBy as string]: sortOrder,
      },
      skip,
      take: limit,
    });

    // 페이지네이션 메타 정보 계산
    const totalPages = Math.ceil(totalItems / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const meta: PaginationMetaDto = {
      page,
      limit,
      totalItems,
      totalPages,
      hasNext,
      hasPrev,
    };

    return {
      data: users,
      meta,
    };
  }

  async getAllAdmins() {
    return this.prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] },
      },
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async deleteAdmin(id: string) {
    const admin = await this.prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });

    if (!admin) {
      throw new NotFoundException('관리자를 찾을 수 없습니다');
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(admin.role)) {
      throw new ForbiddenException('관리자 계정만 삭제할 수 있습니다');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: '관리자 계정이 삭제되었습니다' };
  }
}
