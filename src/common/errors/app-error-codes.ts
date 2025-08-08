// 애플리케이션 전용 상세 에러 코드 (4자리)
// 규칙 예시
//  - 400x: 잘못된 요청/검증/제약 위반
//  - 401x: 인증 관련
//  - 403x: 권한 관련
//  - 404x: 리소스 없음
//  - 409x: 충돌/무결성 충돌
//  - 500x: 서버 오류

export enum AppErrorCode {
  // 400x
  VALIDATION_ERROR = 4001,
  INVALID_ID = 4002,
  FK_CONSTRAINT_VIOLATION = 4003,

  // 401x
  UNAUTHORIZED = 4011,

  // 403x
  FORBIDDEN = 4031,

  // 404x
  CATEGORY_NOT_FOUND = 4041,
  MEMO_NOT_FOUND = 4042,
  USER_NOT_FOUND = 4043,

  // 409x
  DUPLICATE_RESOURCE = 4091,
  CATEGORY_HAS_MEMOS = 4092,

  // 500x
  INTERNAL_SERVER_ERROR = 5001,
}

export type AppErrorPayload = {
  code: AppErrorCode;
  message: string;
  details?: unknown;
};
