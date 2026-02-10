import { ApiProperty } from '@nestjs/swagger';
import { RecurrenceType } from '../../enums/recurrence-type.enum';

export class ResponseTodoDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: '투두 ID' })
  id: string;

  @ApiProperty({ example: '운동하기', description: '투두 제목' })
  title: string;

  @ApiProperty({ example: '아침 30분 조깅', description: '투두 설명', nullable: true })
  description: string | null;

  @ApiProperty({ example: '2026-01-22T00:00:00.000Z', description: '투두 날짜' })
  date: Date;

  @ApiProperty({ example: false, description: '완료 여부' })
  isCompleted: boolean;

  @ApiProperty({ example: '2026-01-22T10:30:00.000Z', description: '완료 시간', nullable: true })
  completedAt: Date | null;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: '템플릿 ID (일회성이면 null)', nullable: true })
  templateId: string | null;

  @ApiProperty({ example: 0, description: '이월 횟수 (0=원본)' })
  carryOverCount: number;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z', description: '생성 시간' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z', description: '수정 시간' })
  updatedAt: Date;
}

export class ResponseTemplateDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: '템플릿 ID' })
  id: string;

  @ApiProperty({ example: '운동하기', description: '투두 제목' })
  title: string;

  @ApiProperty({ example: '아침 30분 조깅', description: '투두 설명', nullable: true })
  description: string | null;

  @ApiProperty({
    enum: RecurrenceType,
    example: RecurrenceType.WEEKLY,
    description: '반복 유형',
  })
  recurrenceType: RecurrenceType;

  @ApiProperty({ example: [1, 3, 5], description: '반복 요일/날짜', type: [Number] })
  recurrenceDays: number[];

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z', description: '시작 날짜' })
  startDate: Date;

  @ApiProperty({ example: '2026-12-31T00:00:00.000Z', description: '종료 날짜', nullable: true })
  endDate: Date | null;

  @ApiProperty({ example: true, description: '활성화 여부' })
  isActive: boolean;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z', description: '생성 시간' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z', description: '수정 시간' })
  updatedAt: Date;
}

export class TodoListResponseDto {
  @ApiProperty({ example: '2026-01-22', description: '조회 날짜 (날짜별 조회 시)', nullable: true })
  date: string | null;

  @ApiProperty({ example: 2026, description: '년도 (월별 조회 시)', nullable: true })
  year: number | null;

  @ApiProperty({ example: 1, description: '월 (월별 조회 시)', nullable: true })
  month: number | null;

  @ApiProperty({ type: [ResponseTodoDto], description: '투두 목록' })
  data: ResponseTodoDto[];

  @ApiProperty({ example: 10, description: '총 개수' })
  total: number;

  @ApiProperty({ example: 7, description: '완료한 투두 수' })
  completed: number;

  @ApiProperty({ example: 70, description: '달성률 (%)' })
  rate: number;
}

export class DailyRateDto {
  @ApiProperty({ example: 5, description: '해당 날짜 전체 투두 수' })
  total: number;

  @ApiProperty({ example: 3, description: '해당 날짜 완료한 투두 수' })
  completed: number;

  @ApiProperty({ example: 60, description: '해당 날짜 달성률 (%)' })
  rate: number;
}

export class ToggleTodoResponseDto extends ResponseTodoDto {
  @ApiProperty({ type: DailyRateDto, description: '해당 날짜의 달성률' })
  dailyStats: DailyRateDto;
}

export class TemplateListResponseDto {
  @ApiProperty({ type: [ResponseTemplateDto], description: '템플릿 목록' })
  data: ResponseTemplateDto[];

  @ApiProperty({ example: 5, description: '총 개수' })
  total: number;
}
