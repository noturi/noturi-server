import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class QueryCalendarMemoDto {
  @ApiProperty({ example: '회의', description: '제목으로 검색', required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({
    example: 2024,
    description: '조회할 년도 (기본값: 현재 년도)',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2099)
  year?: number;

  @ApiProperty({
    example: 12,
    description: '조회할 월 (1-12, 기본값: 현재 월)',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiProperty({ example: true, description: '알림 설정된 일정만 조회', required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  hasNotification?: boolean;
}