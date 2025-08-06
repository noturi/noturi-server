import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
  picture: string;
}

class UserCategory {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  color: string | null;
}

class UserForLoginResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ nullable: true })
  name: string | null;

  @ApiProperty()
  nickname: string;

  @ApiProperty({ required: false, nullable: true })
  avatarUrl?: string | null;

  @ApiProperty({ type: () => [UserCategory] })
  categories: UserCategory[];
}

export class LoginResponse {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty({ type: () => UserForLoginResponse })
  user: UserForLoginResponse;
}

export interface JwtPayload {
  sub: string; // user id
  email: string;
  iat?: number;
  exp?: number;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class LogoutDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  refreshToken?: string;
}
