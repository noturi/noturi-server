import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../../../../common/enums/permissions.enum';

export class AdminUserQueryDto {
  @ApiProperty({
    example: 'john',
    description: '검색 키워드 (닉네임, 이메일, 이름)',
    required: false,
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({
    example: 'USER',
    description: '사용자 역할로 필터링',
    enum: UserRole,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({
    example: 1,
    description: '페이지 번호 (1부터 시작)',
    required: false,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    example: 20,
    description: '페이지당 항목 수',
    required: false,
    default: 20,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
