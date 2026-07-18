import { NestFactory } from '@nestjs/core';
import { ValidationPipe, UnauthorizedException } from '@nestjs/common';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { AppModule } from './app.module';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Security Headers
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const jwtService = app.get(JwtService);
  const jwtSecret = process.env.JWT_SECRET || 'darkitchen-super-secret-jwt-key-2026';

  // JWT Middleware to parse and inject X-User-Id and X-User-Role
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Only check internal routes, not OAuth callbacks or public assets
    if (req.path.startsWith('/api/')) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const decoded = jwtService.verify(token, { secret: jwtSecret });
          // Inject headers for internal services
          req.headers['x-user-id'] = decoded.sub.toString();
          if (decoded.role) {
            req.headers['x-user-role'] = decoded.role;
          }
        } catch (e) {
          // Token is invalid or expired
          // Don't throw immediately, let the internal service decide if the route is public or private
          // The proxy will forward without the headers
        }
      }
    }
    next();
  });

  // Services URLs
  const authUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:4001';
  const catalogUrl = process.env.CATALOG_SERVICE_URL || 'http://localhost:4002';
  const orderUrl = process.env.ORDER_SERVICE_URL || 'http://localhost:4003';
  const chatUrl = process.env.CHAT_SERVICE_URL || 'http://localhost:4004';
  const chatWsUrl = process.env.CHAT_WS_URL || 'http://localhost:4005';

  // Proxies
  app.use(
    '/api/auth',
    createProxyMiddleware({
      target: authUrl,
      changeOrigin: true,
      pathRewrite: { '^/api/auth': '/auth' },
    }),
  );

  app.use(
    '/api/products',
    createProxyMiddleware({
      target: catalogUrl,
      changeOrigin: true,
      pathRewrite: { '^/api/products': '/products' },
    }),
  );

  app.use(
    '/api/orders',
    createProxyMiddleware({
      target: orderUrl,
      changeOrigin: true,
      pathRewrite: { '^/api/orders': '/orders' },
    }),
  );

  app.use(
    '/api/messages',
    createProxyMiddleware({
      target: chatUrl,
      changeOrigin: true,
      pathRewrite: { '^/api/messages': '/messages' },
    }),
  );
  
  app.use(
    '/socket.io',
    createProxyMiddleware({
      target: chatWsUrl,
      changeOrigin: true,
      ws: true,
    }),
  );

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 API Gateway running on port ${port}`);
}
bootstrap();
