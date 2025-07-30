import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';
import { IsValidRating } from 'src/common/validators/validator';

export class CreateMemoDto {
  @ApiProperty({ description: '메모 제목 (선택)', example: '인셉션 감상' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  title?: string;

  @ApiProperty({ description: '메모 본문 (선택)', example: '꿈 속의 꿈, 정말 대단한 영화였다.' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ description: '평점 (0.0 ~ 5.0, 0.5 단위)', example: 4.5 })
  @IsNumber()
  @Min(0.0)
  @Max(5.0)
  @Transform(({ value }) => parseFloat(value))
  rating: number;

  @ApiProperty({ description: '경험 날짜 (YYYY-MM-DD)', example: '2024-07-30', required: false })
  @IsOptional()
  @IsDateString()
  experienceDate?: string;

  @ApiProperty({ description: '카테고리 ID', example: 'a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6' })
  @IsUUID(4)
  @IsNotEmpty()
  categoryId: string;
}
