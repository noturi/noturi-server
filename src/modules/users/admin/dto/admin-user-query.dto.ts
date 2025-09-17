import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { UserRole } from '../../../../common/enums/permissions.enum';

export class SortDto {
  @IsString()
  id: string;

  @IsOptional()
  desc?: boolean;
}

export class AdminUserQueryDto {
  @ApiProperty({
    example: 'john@example.com',
    description: '이메일로 검색',
    required: false,
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({
    example: 'john',
    description: '이름, 닉네임, 이메일로 검색',
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

  @ApiProperty({
    example: '[{"id":"createdAt","desc":false}]',
    description: '정렬 조건 배열',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return value || [];
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SortDto)
  sort?: SortDto[] = [];

  @ApiProperty({
    example: '1756738800000,1756825200000',
    description: '생성일 범위 필터 (시작날짜,종료날짜 타임스탬프)',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string' && value.includes(',')) {
      const [start, end] = value.split(',');
      return {
        start: start ? new Date(parseInt(start)) : undefined,
        end: end ? new Date(parseInt(end)) : undefined,
      };
    }
    return undefined;
  })
  createdAt?: { start?: Date; end?: Date };
}
