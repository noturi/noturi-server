import { IsNotEmpty, IsString } from 'class-validator';

export interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
  picture: string;
}

interface UserCategory {
  id: string;
  name: string;
  color: string | null;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    nickname: string;
    avatarUrl?: string;
    categories: UserCategory[];
  };
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
  @IsString()
  refreshToken: string;
}
