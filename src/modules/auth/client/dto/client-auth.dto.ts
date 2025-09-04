import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export class GoogleNativeLoginDto {
  @ApiProperty({
    description: '구글 ID 토큰',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjJkN2VkMzM4YzBmMTQ1N2IyMTRhMjc0YjVlMGU2NjdiNDRhNDJkZGUiLCJ0eXAiOiJKV1QifQ...'
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}

export class AppleLoginDto {
  @ApiProperty({
    description: '애플 ID 토큰',
    example: 'eyJraWQiOiJZdXlYb1kiLCJhbGciOiJSUzI1NiJ9...'
  })
  @IsString()
  @IsNotEmpty()
  identityToken: string;

  @ApiProperty({
    description: '사용자 식별자',
    example: '000123.abc456def789.1234'
  })
  @IsString()
  @IsNotEmpty()
  user: string;

  @ApiProperty({
    description: '사용자 이메일 (첫 로그인시에만)',
    example: 'user@example.com',
    required: false
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: '사용자 이름 (첫 로그인시에만)',
    example: 'John Doe',
    required: false
  })
  @IsOptional()
  @IsString()
  fullName?: string;
}