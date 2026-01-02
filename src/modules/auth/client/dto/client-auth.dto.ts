import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export class LoginResponseDto {
  @ApiProperty({
    description: '사용자 정보',
    example: {
      id: 'user123',
      email: 'user@example.com',
      name: 'John Doe',
      nickname: 'john',
      avatarUrl: 'https://example.com/avatar.jpg'
    }
  })
  user: {
    id: string;
    email: string;
    name: string;
    nickname: string;
    avatarUrl?: string;
  };

  @ApiProperty({
    description: '인증 토큰',
    example: {
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    }
  })
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

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
  idToken: string;

  @ApiProperty({
    description: '사용자 식별자',
    example: '000123.abc456def789.1234'
  })
  @IsString()
  @IsNotEmpty()
  user: string;

  @ApiProperty({
    description: 'Apple ID (프론트엔드에서 전송)',
    example: '000123.abc456def789.1234',
    required: false
  })
  @IsOptional()
  @IsString()
  appleId?: string;

  @ApiProperty({
    description: '사용자 이메일',
    example: 'user@example.com',
    required: false
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: '사용자 이름',
    example: 'John Doe',
    required: false
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: '사용자 이름 (레거시)',
    example: 'John Doe',
    required: false
  })
  @IsOptional()
  @IsString()
  fullName?: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: '리프레시 토큰',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class RefreshResponseDto {
  @ApiProperty({
    description: '인증 토큰',
    example: {
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
  })
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}