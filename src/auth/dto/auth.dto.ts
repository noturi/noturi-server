export interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
  picture: string;
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
  };
}

export interface JwtPayload {
  sub: string; // user id
  email: string;
  iat?: number;
  exp?: number;
}

export class RefreshTokenDto {
  refreshToken: string;
}
