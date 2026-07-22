import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global()
@Module({
  // RedisService tambien se comparte globalmente para eventos y suscripciones.
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
