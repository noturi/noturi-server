import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsDateString,
  IsOptional,
  IsEnum,
  IsArray,
  IsInt,
  Min,
  Max,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { RecurrenceType } from '../../enums/recurrence-type.enum';

export class CreateTodoDto {
  @ApiProperty({ example: '운동하기', description: '투두 제목' })
  @IsString()
  @MaxLength(100)
  title: string;

  @ApiProperty({ example: '아침 30분 조깅', description: '투두 설명', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    example: '2026-01-22',
    description: '투두 날짜 (일회성) 또는 시작 날짜 (반복)',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    enum: RecurrenceType,
    example: RecurrenceType.NONE,
    description: '반복 유형 (NONE: 일회성, DAILY: 매일, WEEKLY: 매주, MONTHLY: 매월)',
    required: false,
  })
  @IsOptional()
  @IsEnum(RecurrenceType)
  recurrenceType?: RecurrenceType;

  @ApiProperty({
    example: [1, 3, 5],
    description: 'WEEKLY: 요일 (0=일~6=토), MONTHLY: 날짜 (1~31)',
    required: false,
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(31, { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(31)
  recurrenceDays?: number[];

  @ApiProperty({
    example: '2026-12-31',
    description: '반복 종료 날짜 (null = 무기한)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
