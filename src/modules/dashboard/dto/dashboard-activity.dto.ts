import { ApiProperty } from '@nestjs/swagger';

export class DashboardActivityDto {
  @ApiProperty({ description: '활동 유형', example: 'user_registration' })
  type: 'user_registration' | 'category_creation';

  @ApiProperty({ description: '활동 제목', example: '새로운 사용자 등록' })
  title: string;

  @ApiProperty({ description: '활동 설명', example: 'user@example.com' })
  description: string;

  @ApiProperty({ description: '활동 시간', example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;
}

export class DashboardActivitiesResponseDto {
  @ApiProperty({ type: [DashboardActivityDto], description: '최근 활동 목록' })
  activities: DashboardActivityDto[];
}