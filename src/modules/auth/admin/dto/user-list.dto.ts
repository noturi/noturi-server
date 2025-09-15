import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString } from 'class-validator';
import { UserRole } from '../../../../common/enums/permissions.enum';
import { PaginationQueryDto } from '../../../../common/dto/pagination.dto';

export class UserListQueryDto extends PaginationQueryDto {
  @ApiProperty({ 
    description: '사용자 역할 필터', 
    enum: UserRole,
    required: false 
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ 
    description: '검색 키워드 (닉네임, 이메일, 이름)', 
    required: false 
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ 
    description: '정렬 필드', 
    enum: ['createdAt', 'updatedAt', 'email', 'nickname'],
    required: false,
    default: 'createdAt'
  })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'updatedAt' | 'email' | 'nickname' = 'createdAt';

  @ApiProperty({ 
    description: '정렬 순서', 
    enum: ['asc', 'desc'],
    required: false,
    default: 'desc'
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class UserListItemDto {
  @ApiProperty({ description: '사용자 ID' })
  id: string;

  @ApiProperty({ description: '이메일' })
  email: string;

  @ApiProperty({ description: '이름', nullable: true })
  name: string | null;

  @ApiProperty({ description: '닉네임' })
  nickname: string;

  @ApiProperty({ description: '역할', enum: UserRole })
  role: UserRole;

  @ApiProperty({ description: '프로필 이미지 URL', nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ description: '통계 공개 여부' })
  isStatsPublic: boolean;

  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @ApiProperty({ description: '수정일' })
  updatedAt: Date;
}