import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Common function to create and configure NestJS app instance
async function createApp() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  return app;
}

// Bootstrap function for local development
async function bootstrap() {
  const app = await createApp();
  const configService = app.get(ConfigService);

  const allowedOrigins = configService.get('ALLOWED_ORIGINS')?.split(',') || [
    'https://quan-ly-sang-kien.vercel.app',
  ];

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  const port = configService.get('PORT') || 3000;
  await app.listen(port);
}

// Handler for Vercel serverless deployment
export const handler = async (event: any, context: any) => {
  const app = await createApp();
  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return expressApp(event, context);
};

// Start application based on environment
const environment = process.env.NODE_ENV;
console.log('Current environment:', environment);

if (environment !== 'production') {
  bootstrap();
}
