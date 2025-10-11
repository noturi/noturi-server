import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class CreateMemoDto {
  @ApiProperty({ example: '오늘의 회의 내용', description: '메모 제목' })
  @IsString()
  @MaxLength(100)
  title: string;

  @ApiProperty({ example: '프로젝트 진행 상황에 대해 논의했다.', description: '메모 내용', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @ApiProperty({ example: 4.5, description: '평점 (1.0~5.0, 0.5단위)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1.0)
  @Max(5.0)
  rating?: number;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: '카테고리 ID',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
