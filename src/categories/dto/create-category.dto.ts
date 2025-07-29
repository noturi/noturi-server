import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ description: '카테고리 이름', example: '새로운 카테고리' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  name: string;

  @ApiProperty({ description: '카테고리 색상 (Hex 코드)', example: '#FFFFFF', required: false })
  @IsOptional()
  @IsString()
  @Length(4, 7)
  color?: string;
}
