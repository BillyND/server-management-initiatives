import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PermissionsService } from './modules/permissions/permissions.service';
import { RolesService } from './modules/roles/roles.service';

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

  // Start server
  await app.listen(configService.get('PORT') || 3000);

  const shouldSeed =
    configService.get<string>('SEED_PERMISSIONS') === 'true' ||
    configService.get<string>('NODE_ENV') === 'development';

  console.log('shouldSeed', shouldSeed);

  // if (shouldSeed) {
  const permissionsService = app.get(PermissionsService);
  await permissionsService.seedDefaultPermissions();

  const rolesService = app.get(RolesService);
  await rolesService.seedDefaultRoles();
  // }
}
bootstrap();
