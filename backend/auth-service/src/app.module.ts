import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register(),
    // Variables de entorno compartidas por auth, correo, Redis y JWT.
    ConfigModule.forRoot({ isGlobal: true }),
    // Prisma conecta con la base de datos del servicio auth.
    PrismaModule,
    // Redis se usa para publicar eventos de auditoria y posibles notificaciones.
    RedisModule,
    // Aqui vive toda la logica de autenticacion y autorizacion.
    AuthModule,
  ],
})
export class AppModule {}
