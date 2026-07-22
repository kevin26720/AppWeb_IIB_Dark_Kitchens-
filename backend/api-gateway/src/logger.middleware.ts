import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, originalUrl } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    response.on('finish', () => {
      const { statusCode } = response;
      const responseTime = Date.now() - startTime;
      this.logger.log(`[HTTP] ${method} ${originalUrl} ${statusCode} - ${responseTime}ms - IP: ${ip} - UA: ${userAgent}`);
    });

    next();
  }
}
