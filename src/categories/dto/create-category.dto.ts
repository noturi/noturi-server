import { IsHexColor, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MinLength(1, { message: '카테고리 이름은 최소 1글자 이상이어야 합니다' })
  @MaxLength(50, { message: '카테고리 이름은 50글자를 초과할 수 없습니다' })
  name: string;

  @IsOptional()
  @IsHexColor({ message: '올바른 색상 코드를 입력해주세요 (예: #FF5733)' })
  color?: string;
}
