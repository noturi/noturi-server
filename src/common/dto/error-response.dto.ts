import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 409, description: 'HTTP 상태 코드' })
  statusCode: number;

  @ApiProperty({ example: 4092, description: '애플리케이션 상세 에러 코드(4자리)', required: false })
  code?: number;

  @ApiProperty({ example: '메모가 있는 카테고리는 삭제할 수 없습니다', description: '에러 메시지' })
  message: string;

  @ApiProperty({ example: { memoCount: 3 }, description: '추가 상세 정보', required: false })
  details?: unknown;
}
