import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({ example: 'admin@noturi.com', description: '어드민 이메일' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'adminPassword123!', description: '패스워드' })
  @IsString()
  @MinLength(8)
  password: string;
}

export class AdminRegisterDto {
  @ApiProperty({ example: 'admin@noturi.com', description: '어드민 이메일' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin User', description: '관리자 이름' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: 'admin', description: '관리자 닉네임' })
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  nickname: string;

  @ApiProperty({ example: 'adminPassword123!', description: '패스워드 (8자 이상)' })
  @IsString()
  @MinLength(8)
  password: string;
}

