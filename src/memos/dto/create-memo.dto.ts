import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min, Validate } from 'class-validator';
import { IsValidRating } from 'src/common/validators/validator';

export class CreateMemoDto {
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: '제목은 255자를 초과할 수 없습니다' })
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: '내용은 5000자를 초과할 수 없습니다' })
  content?: string;

  @IsNumber({ maxDecimalPlaces: 1 }, { message: '별점은 소수점 첫째 자리까지만 입력 가능합니다' })
  @Min(1.0, { message: '별점은 최소 1.0점이어야 합니다' })
  @Max(5.0, { message: '별점은 최대 5.0점이어야 합니다' })
  @Transform(({ value }) => parseFloat(value))
  @Validate(IsValidRating)
  rating: number;

  @IsUUID(4, { message: '올바른 카테고리 ID를 입력해주세요' })
  categoryId: string;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  experienceDate?: Date;
}
