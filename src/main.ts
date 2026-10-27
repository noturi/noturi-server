// src/main.ts
// Sentry는 반드시 가장 먼저 초기화
import './instrument';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { getCorsConfig } from './config/cors.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Railway 프록시 뒤 — X-Forwarded-For의 실제 클라이언트 IP를 req.ip로 사용 (요청 제한이 IP별로 동작하도록)
  app.set('trust proxy', 1);

  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 기본 루트 라우트 추가
  app.setGlobalPrefix('api', { exclude: ['/'] });

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('Noturi API')
    .setDescription('The Noturi API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  app.enableCors(getCorsConfig());
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
