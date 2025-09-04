import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum } from 'class-validator';

export enum StatisticsPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export class QueryStatisticsDto {
  @ApiProperty({
    example: '2024-01-01',
    description: '시작 날짜 (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    example: '2024-12-31',
    description: '종료 날짜 (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    example: 'monthly',
    description: '통계 기간',
    enum: StatisticsPeriod,
    required: false,
    default: StatisticsPeriod.MONTHLY,
  })
  @IsOptional()
  @IsEnum(StatisticsPeriod)
  period?: StatisticsPeriod = StatisticsPeriod.MONTHLY;
}
