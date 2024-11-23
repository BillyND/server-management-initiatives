import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // If ALLOWED_ORIGINS is not set, default to your Vercel frontend URL
  const allowedOrigins = configService.get('ALLOWED_ORIGINS')?.split(',');

  // Enable CORS with more specific configuration
  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Origin,X-Requested-With,Content-Type,Accept,Authorization',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Global pipes for validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Start server
  await app.listen(configService.get('PORT'));
}
bootstrap();
