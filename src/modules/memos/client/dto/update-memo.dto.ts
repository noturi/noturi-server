import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, MaxLength, IsNumber, Min, Max } from 'class-validator';

export class UpdateMemoDto {
  @ApiProperty({ example: '수정된 메모 제목', description: '메모 제목', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @ApiProperty({ example: '수정된 메모 내용', description: '메모 내용', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @ApiProperty({ example: 4.0, description: '평점 (1.0~5.0, 0.5단위)', required: false })
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
