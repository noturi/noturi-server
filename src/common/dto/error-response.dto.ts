import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 404, description: 'HTTP 상태 코드' })
  statusCode: number;

  @ApiProperty({ example: 4041, description: '애플리케이션 상세 에러 코드(4자리)', required: false })
  code?: number;

  @ApiProperty({ example: '리소스를 찾을 수 없습니다', description: '에러 메시지' })
  message: string;

  @ApiProperty({ example: {}, description: '추가 상세 정보', required: false })
  details?: unknown;
}
