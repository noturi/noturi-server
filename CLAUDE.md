# Noturi Server

메모/노트 관리 앱의 백엔드 API 서버.

## Tech Stack

- **Runtime**: Node.js 18, TypeScript 5
- **Framework**: NestJS 10
- **ORM**: Prisma 6 + PostgreSQL
- **Auth**: JWT + Passport (Google OAuth, Apple OAuth, 어드민 로컬 인증)
- **Package Manager**: pnpm 9.6.0

## Project Structure

```
src/
  main.ts                  # 앱 부트스트랩 (port 3000)
  app.module.ts            # 루트 모듈
  common/                  # 공통 유틸 (guards, decorators, dto, enums, errors)
  config/                  # CORS 등 설정
  modules/
    auth/                  # 인증 (client: OAuth, admin: 로컬)
    memos/                 # 메모 CRUD
    categories/            # 카테고리 관리 + 커스텀 필드
    calendar-memos/        # 캘린더 일정 + 알림
    users/                 # 유저 프로필/설정
    statistics/            # 통계/분석
    dashboard/             # 어드민 대시보드
    notifications/         # 푸시 알림 (Expo Push)
    app-version/           # 앱 버전 관리
prisma/
  schema.prisma            # DB 스키마 (13 models)
  seed.ts                  # 시드 스크립트
```

## Architecture Patterns

- **Client/Admin 분리**: 각 모듈이 `client/`와 `admin/` 하위 디렉토리로 분리
- **API Prefix**: 모든 API는 `/api` prefix. Client: `/api/client/*`, Admin: `/api/admin/*`
- **RBAC**: UserRole (USER, ADMIN, SUPER_ADMIN) + Permission 기반 접근제어
- **DTO 패턴**: class-validator로 입력 검증, Swagger 데코레이터로 API 문서 자동 생성

## Commands

```bash
# 개발
pnpm start:dev          # 개발 서버 (watch mode)
pnpm build              # 빌드
pnpm start:prod         # 프로덕션 실행

# DB
pnpm db:generate        # Prisma 클라이언트 생성
pnpm db:push            # 스키마 DB 동기화 (migration 없이)
pnpm db:migrate         # Migration 생성 + 적용
pnpm db:seed            # 시드 데이터 삽입
pnpm db:studio          # Prisma Studio (DB GUI)

# 테스트
pnpm test               # 단위 테스트
pnpm test:e2e           # E2E 테스트
pnpm test:cov           # 커버리지

# 코드 품질
pnpm lint               # ESLint 실행 (--fix)
pnpm format             # Prettier 실행
```

## Code Style

- Prettier: 싱글 쿼트, 세미콜론, trailing comma, 2 spaces, 120자 줄폭
- ESLint: @typescript-eslint + prettier (strict return type, explicit-any 등은 off)
- 한국어 주석 사용

## Key Conventions

- 새 모듈 추가 시 `src/modules/{module-name}/` 하위에 `client/`, `admin/` 분리
- Controller에 `@ApiTags`, `@ApiBearerAuth` Swagger 데코레이터 적용
- DTO는 각 도메인 `dto/` 디렉토리에 위치
- Guard: `JwtAuthGuard` (인증), `RolesGuard` (역할), `PermissionsGuard` (권한)
- DB 스키마 변경 시 `prisma/schema.prisma` 수정 후 `pnpm db:generate` 실행
- Docker: `docker-compose.yml`로 PostgreSQL 실행, `Dockerfile`로 프로덕션 빌드

## Environment Variables

`.env` 파일 필요 (`.env` 참고):
- `DATABASE_URL` - PostgreSQL 연결 문자열
- `JWT_SECRET`, `JWT_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN`
- `GOOGLE_CLIENT_ID`, `GOOGLE_IOS_CLIENT_ID`, `GOOGLE_ANDROID_CLIENT_ID`, `GOOGLE_WEB_CLIENT_ID`
- `APPLE_CLIENT_ID`
- `ALLOWED_ORIGINS` - CORS 허용 도메인
