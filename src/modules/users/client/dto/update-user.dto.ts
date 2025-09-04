import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'john_updated', description: '닉네임', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;

  @ApiProperty({ example: false, description: '통계 공개 여부', required: false })
  @IsOptional()
  @IsBoolean()
  isStatsPublic?: boolean;
}
