// import { ValidationPipe } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(8000);

  // const app = await NestFactory.create(AppModule);
  // const configService = app.get(ConfigService);

  // app.enableCors({
  //   origin: ['https://quan-ly-sang-kien.vercel.app'],
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  //   allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
  //   credentials: true,
  //   preflightContinue: false,
  //   optionsSuccessStatus: 204,
  // });

  // // Global pipes for validation
  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     whitelist: true,
  //     transform: true,
  //   }),
  // );

  // // Start server
  // await app.listen(configService.get('PORT'));
}
bootstrap();
