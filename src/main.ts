// src/main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
  app.enableCors(); // CORS 활성화
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
