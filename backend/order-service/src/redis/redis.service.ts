import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private publisher: Redis;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST') || 'localhost';
    const port = this.configService.get<number>('REDIS_PORT') || 6379;
    
    this.publisher = new Redis({
      host,
      port,
    });
  }

  onModuleDestroy() {
    if (this.publisher) {
      this.publisher.disconnect();
    }
  }

  async publish(channel: string, message: any) {
    await this.publisher.publish(channel, JSON.stringify(message));
  }
}
