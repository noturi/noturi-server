import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
  @ApiProperty({ description: '총 사용자 수', example: 1234 })
  totalUsers: number;

  @ApiProperty({ description: '총 메모 수', example: 5678 })
  totalMemos: number;

  @ApiProperty({ description: '월간 활성 사용자 수 (최근 30일 앱 접속 기준)', example: 890 })
  activeUsers: number;

  @ApiProperty({ description: '신규가입 MoM 증가율 (%)', example: 12 })
  userGrowthRate: number;
}