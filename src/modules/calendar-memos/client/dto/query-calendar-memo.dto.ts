import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsBoolean, IsNumberString } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryCalendarMemoDto {
  @ApiProperty({ example: '회의', description: '제목으로 검색', required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({
    example: '2024-12-01T00:00:00.000Z',
    description: '조회 시작 날짜 (이 날짜 이후)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    example: '2024-12-31T23:59:59.999Z',
    description: '조회 끝 날짜 (이 날짜 이전)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ example: true, description: '알림 설정된 일정만 조회', required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  hasNotification?: boolean;

  @ApiProperty({ example: '1', description: '페이지 번호 (기본값: 1)', required: false })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiProperty({ example: '20', description: '페이지당 개수 (기본값: 20)', required: false })
  @IsOptional()
  @IsNumberString()
  limit?: string;
}