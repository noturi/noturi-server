// Sentry 초기화 — 다른 모듈보다 먼저 import되어야 자동 계측이 적용됨 (main.ts 첫 줄)
// SENTRY_DSN이 없으면 비활성화 (로컬 개발/미설정 환경에서는 아무것도 전송하지 않음)
import * as Sentry from '@sentry/nestjs';

const dsn = process.env.SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
  release: process.env.SENTRY_RELEASE,
  // 성능 트레이스 샘플링 — 클라이언트(앱)의 트레이스와 이어져 요청 단위로 추적
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
});
