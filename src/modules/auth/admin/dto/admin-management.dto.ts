import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, IsEnum } from 'class-validator';
import { UserRole } from '../../../../common/enums/permissions.enum';

export class CreateAdminDto {
  @ApiProperty({ example: 'admin2@noturi.com', description: '어드민 이메일' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Admin User 2', description: '관리자 이름' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: 'admin2', description: '관리자 닉네임' })
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  nickname: string;

  @ApiProperty({ example: 'adminPassword123!', description: '패스워드 (8자 이상)' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    example: 'ADMIN',
    description: '관리자 역할',
    enum: ['ADMIN', 'SUPER_ADMIN'],
  })
  @IsEnum(['ADMIN', 'SUPER_ADMIN'])
  role: 'ADMIN' | 'SUPER_ADMIN';
}
