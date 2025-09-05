import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
  @ApiProperty({ description: '총 사용자 수', example: 1234 })
  totalUsers: number;

  @ApiProperty({ description: '총 카테고리 수', example: 56 })
  totalCategories: number;

  @ApiProperty({ description: '활성 사용자 수 (이번 달)', example: 890 })
  activeUsers: number;

  @ApiProperty({ description: '사용자 증가율 (%)', example: 12 })
  userGrowthRate: number;
}