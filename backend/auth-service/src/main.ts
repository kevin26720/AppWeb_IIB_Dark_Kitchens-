import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  // Este servicio concentra identidad, login, recuperacion de acceso y verificacion de correo.
  const app = await NestFactory.create(AppModule);

  // Valida los DTOs de autenticacion antes de entrar al dominio.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  const port = process.env.PORT || 4001;
  await app.listen(port);
  console.log(`🔐 Auth-service running on port ${port}`);
}
bootstrap();
