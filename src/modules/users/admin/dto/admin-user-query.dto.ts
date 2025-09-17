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
}
