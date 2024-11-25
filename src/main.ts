import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const allowedOrigins = configService.get('ALLOWED_ORIGINS')?.split(',');

  app.enableCors({
    origin: allowedOrigins || ['https://quan-ly-sang-kien.vercel.app'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    credentials: true,
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

  // Listen on port
  const defaultPort = configService.get('PORT') || 8000;
  let currentPort = Number(defaultPort);

  while (true) {
    try {
      await app.listen(currentPort);
      console.log(`Application is running on port ${currentPort}`);
      break;
    } catch (error) {
      if (error.code === 'EADDRINUSE') {
        currentPort++;
        console.log(`Port ${currentPort - 1} is in use, trying ${currentPort}`);
      } else {
        throw error;
      }
    }
  }
}

if (process.env.NODE_ENV === 'development') {
  bootstrap();
}
