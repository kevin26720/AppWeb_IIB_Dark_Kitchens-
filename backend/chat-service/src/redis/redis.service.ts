import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private subClient: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);

    this.client = new Redis({ host, port });
    this.subClient = new Redis({ host, port });
  }

  onModuleDestroy() {
    this.client.disconnect();
    this.subClient.disconnect();
  }

  getClient(): Redis {
    return this.client;
  }

  getSubClient(): Redis {
    return this.subClient;
  }

  async subscribe(channel: string, callback: (message: string) => void) {
    await this.subClient.subscribe(channel);
    this.subClient.on('message', (chan, message) => {
      if (chan === channel) {
        callback(message);
      }
    });
  }
}
