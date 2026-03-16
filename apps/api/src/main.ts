import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

function parseAllowedOrigins(configService: ConfigService) {
  const envOrigins = configService
    .get<string>('ALLOWED_ORIGINS', '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const webUrl = configService.get<string>('WEB_URL', 'http://localhost:3000');

  return new Set([webUrl, ...envOrigins]);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  const allowedOrigins = parseAllowedOrigins(configService);

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS origin not allowed'), false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With'],
    maxAge: 60 * 60 * 24,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('SafeDeliver API')
    .setDescription('배달음식점 행정처분 알리미 REST API')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addTag('restaurants', '음식점 정보')
    .addTag('sanctions', '행정처분 정보')
    .addTag('search', '통합 검색')
    .addTag('auth', '인증')
    .addTag('bookmarks', '즐겨찾기')
    .addTag('alerts', '알림')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  console.log(`SafeDeliver API running on http://localhost:${port}/api/v1`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
