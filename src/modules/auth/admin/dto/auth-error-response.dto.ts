import { ApiProperty } from '@nestjs/swagger';

export class AuthErrorResponseDto {
  @ApiProperty({ example: 401, description: 'HTTP 상태 코드' })
  statusCode: number;

  @ApiProperty({ example: 'Unauthorized', description: '에러 타입' })
  error: string;

  @ApiProperty({ example: '이메일 또는 패스워드가 올바르지 않습니다', description: '에러 메시지' })
  message: string;
}