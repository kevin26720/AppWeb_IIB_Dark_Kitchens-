const fs = require('fs');
const path = require('path');

const services = ['auth-service', 'catalog-service', 'order-service', 'chat-service', 'api-gateway'];

const middlewareCode = `import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
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
      this.logger.log(\`[HTTP] \${method} \${originalUrl} \${statusCode} - \${responseTime}ms - IP: \${ip} - UA: \${userAgent}\`);
    });

    next();
  }
}
`;

services.forEach(service => {
  const srcPath = path.join(__dirname, 'backend', service, 'src');
  if (!fs.existsSync(srcPath)) return;

  // 1. Create logger.middleware.ts
  const middlewarePath = path.join(srcPath, 'logger.middleware.ts');
  fs.writeFileSync(middlewarePath, middlewareCode);
  console.log(`Created middleware in ${service}`);

  // 2. Update app.module.ts
  const appModulePath = path.join(srcPath, 'app.module.ts');
  if (fs.existsSync(appModulePath)) {
    let content = fs.readFileSync(appModulePath, 'utf8');

    // Add imports if not present
    if (!content.includes('LoggerMiddleware')) {
      // Import NestModule, MiddlewareConsumer if not present
      if (!content.includes('MiddlewareConsumer')) {
        content = content.replace(
          "import { Module }",
          "import { Module, NestModule, MiddlewareConsumer }"
        );
      }
      content = `import { LoggerMiddleware } from './logger.middleware';\n` + content;

      // Implement NestModule in AppModule
      content = content.replace(
        "export class AppModule {}",
        "export class AppModule implements NestModule {\n  configure(consumer: MiddlewareConsumer) {\n    consumer.apply(LoggerMiddleware).forRoutes('*');\n  }\n}"
      );

      fs.writeFileSync(appModulePath, content);
      console.log(`Updated app.module.ts in ${service}`);
    }
  }
});

console.log('Finished updating all services.');
