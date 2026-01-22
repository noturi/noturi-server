import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class UpdateTodoDto {
  @ApiProperty({ example: '운동하기', description: '투두 제목', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @ApiProperty({ example: '아침 30분 조깅', description: '투두 설명', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: true, description: '완료 여부', required: false })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}
