import './tracing';
import { NestFactory } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { ValidationPipe, UnauthorizedException } from '@nestjs/common';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { AppModule } from './app.module';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  // El gateway es la unica puerta de entrada publica: aqui se centralizan validacion,
  // seguridad, CORS y el enrutamiento hacia los microservicios internos.
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        }),
      ],
    }),
  });

  // Rechaza campos desconocidos y transforma tipos antes de que el request llegue a los servicios.
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

  // Traduce el JWT del cliente a headers internos que entienden los microservicios.
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Solo intercepta rutas del API; evita tocar callbacks y recursos publicos.
    if (req.path.startsWith('/api/')) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const decoded = jwtService.verify(token, { secret: jwtSecret });
          // Inyecta identidad y rol para autorizacion interna entre servicios.
          req.headers['x-user-id'] = decoded.sub.toString();
          if (decoded.role) {
            req.headers['x-user-role'] = decoded.role;
          }
        } catch (e) {
          console.error('JWT Verification failed:', e.message);
          // Token is invalid or expired
          // Don't throw immediately, let the internal service decide if the route is public or private
          // The proxy will forward without the headers
        }
      }
    }
    next();
  });

  // Cada servicio vive aislado y el gateway solo decide a donde enviar cada ruta.
  const authUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:4001';
  const catalogUrl = process.env.CATALOG_SERVICE_URL || 'http://localhost:4002';
  const orderUrl = process.env.ORDER_SERVICE_URL || 'http://localhost:4003';
  const chatUrl = process.env.CHAT_SERVICE_URL || 'http://localhost:4004';
  const chatWsUrl = process.env.CHAT_WS_URL || 'http://localhost:4005';

  // Proxies
  // Auth concentra registro, login, perfil y recuperacion de acceso.
  app.use(
    '/api/auth',
    createProxyMiddleware({
      target: authUrl,
      changeOrigin: true,
      pathRewrite: { '^/': '/auth/' },
    }),
  );

  // Catalogo expone productos y categorias para la UI y para validar pedidos.
  app.use(
    '/api/products',
    createProxyMiddleware({
      target: catalogUrl,
      changeOrigin: true,
      pathRewrite: { '^/': '/products/' },
    }),
  );

  // Orders maneja la creacion y consulta de pedidos.
  app.use(
    '/api/orders',
    createProxyMiddleware({
      target: orderUrl,
      changeOrigin: true,
      pathRewrite: { '^/': '/orders/' },
    }),
  );

  // Chat usa HTTP para historial y socket.io para tiempo real.
  app.use(
    '/api/messages',
    createProxyMiddleware({
      target: chatUrl,
      changeOrigin: true,
      pathRewrite: { '^/': '/messages/' },
    }),
  );
  
  // El websocket se proxya aparte para mantener la conexion persistente de Socket.IO.
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
