import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';

@Module({
  imports: [
    PrometheusModule.register(),
    // Configuracion global para leer variables de entorno desde un solo lugar.
    ConfigModule.forRoot({ isGlobal: true }),
    // Limita el trafico del gateway para reducir abuso y errores por exceso de llamadas.
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100, // 100 req per minute globally
    }]),
    // El gateway necesita firmar y verificar JWT antes de reenviar requests.
    JwtModule.register({}),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
