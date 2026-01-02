import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsBoolean, IsOptional } from 'class-validator';

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
}
