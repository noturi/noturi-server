import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export enum ThemeEnum {
  light = 'light',
  dark = 'dark',
  sepia = 'sepia',
  navy = 'navy',
  forest = 'forest',
  lavender = 'lavender',
}

export enum LanguageEnum {
  ko = 'ko',
  en = 'en',
}

export class UpdateUserSettingsDto {
  @ApiPropertyOptional({
    description: '테마',
    enum: ThemeEnum,
    example: 'dark',
  })
  @IsOptional()
  @IsEnum(ThemeEnum)
  theme?: ThemeEnum;

  @ApiPropertyOptional({
    description: '언어',
    enum: LanguageEnum,
    example: 'ko',
  })
  @IsOptional()
  @IsEnum(LanguageEnum)
  language?: LanguageEnum;

  @ApiPropertyOptional({
    description: '알림 활성화 여부',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  notification?: boolean;

  @ApiPropertyOptional({ description: '홈 카테고리 탭에서 "전체"의 위치 (0 = 맨 앞)', example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  allCategoryOrder?: number;
}

export class UserSettingsResponseDto {
  @ApiProperty({
    description: '테마',
    enum: ThemeEnum,
    example: 'light',
  })
  theme: ThemeEnum;

  @ApiProperty({
    description: '언어',
    enum: LanguageEnum,
    example: 'ko',
  })
  language: LanguageEnum;

  @ApiProperty({
    description: '알림 활성화 여부',
    example: true,
  })
  notification: boolean;

  @ApiProperty({ description: '홈 카테고리 탭에서 "전체"의 위치 (0 = 맨 앞)', example: 0 })
  allCategoryOrder: number;
}
