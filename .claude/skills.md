# Skills

## NestJS 모듈 생성

새 기능 모듈을 추가할 때 따르는 패턴:

1. `src/modules/{module-name}/` 디렉토리 생성
2. 하위 구조:
   ```
   {module-name}/
     {module-name}.module.ts      # NestJS 모듈
     {module-name}.service.ts     # 공통 서비스 로직
     client/
       {module-name}.client.controller.ts
       dto/
     admin/
       {module-name}.admin.controller.ts
       admin.service.ts           # 어드민 전용 로직 있을 경우
       dto/
   ```
3. `app.module.ts`에 import 추가
4. Controller에 Swagger 데코레이터 적용:
   - `@ApiTags('{tag-name}')`
   - `@ApiBearerAuth()`
   - `@UseGuards(JwtAuthGuard)` (인증 필요 시)
5. Client 라우트: `@Controller('client/{resource}')`, Admin 라우트: `@Controller('admin/{resource}')`

## Prisma 스키마 수정

DB 모델 추가/수정 워크플로우:

1. `prisma/schema.prisma` 수정
2. `pnpm db:generate` 실행 (Prisma Client 재생성)
3. `pnpm db:push` 또는 `pnpm db:migrate` 실행 (DB 동기화)
4. 새 모델은 `@@map("snake_case_table_name")` 규칙 적용
5. 관계 설정 시 `onDelete: Cascade` 적절히 사용
6. 인덱스는 자주 조회되는 필드 조합에 `@@index` 추가

## DTO 작성

요청/응답 DTO 작성 규칙:

1. class-validator 데코레이터로 입력 검증: `@IsString()`, `@IsOptional()`, `@IsEnum()` 등
2. class-transformer의 `@Type()` 으로 타입 변환
3. Swagger 데코레이터: `@ApiProperty()`, `@ApiPropertyOptional()`
4. 파일 위치: `src/modules/{module}/client/dto/` 또는 `src/modules/{module}/admin/dto/`
5. 응답 DTO도 별도 정의하여 API 문서에 반영

## 인증/인가 적용

Guard 적용 패턴:

- **인증만 필요**: `@UseGuards(JwtAuthGuard)` + `@CurrentUser()` 데코레이터
- **역할 기반**: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.ADMIN)`
- **권한 기반**: `@UseGuards(JwtAuthGuard, PermissionsGuard)` + `@RequirePermissions(Permission.XXX)`
- 공개 API: Guard 없이 구현

권한 종류 (`src/common/enums/permissions.enum.ts`):
- ADMIN: 기본 카테고리 관리, 유저 조회, 분석, 대시보드
- SUPER_ADMIN: 유저 관리, 시스템 관리, 알림 관리, 어드민 관리

## API 엔드포인트 추가

새 엔드포인트 추가 체크리스트:

1. DTO 작성 (request + response)
2. Service에 비즈니스 로직 구현
3. Controller에 라우트 핸들러 추가
4. Swagger 데코레이터 적용 (`@ApiOperation`, `@ApiResponse`)
5. 필요 시 Guard 적용
6. PrismaService를 통한 DB 접근 (`prisma/prisma.service.ts`)

## 테스트 작성

- 단위 테스트: `*.spec.ts` 파일, Jest + ts-jest
- E2E 테스트: `test/*.e2e-spec.ts`, supertest 사용
- `@nestjs/testing`의 `Test.createTestingModule` 사용

## Docker 배포

```bash
# 로컬 PostgreSQL 실행
docker-compose up -d

# 프로덕션 빌드 + 실행
docker build -t noturi-server .
docker run -p 3000:3000 --env-file .env noturi-server
```
