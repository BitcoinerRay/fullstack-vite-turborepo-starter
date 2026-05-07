import {Logger, ValidationPipe} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {NestFactory} from '@nestjs/core';
import {DocumentBuilder, OpenAPIObject, SwaggerModule} from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import * as compression from 'compression';
import helmet from 'helmet';
import {ConfigKey} from './config/config-key.enum';
import {AppModule} from './app.module';
import {HttpExceptionFilter} from './common/filters/http-exception/http-exception.filter';
import {PrismaExceptionFilter} from './common/filters/prisma-exception/prisma-exception.filter';
import {Logger as LoggerService} from './common/logger/logger.service';

const headersTimeoutMs = 65_000;
const requestTimeoutMs = 60_000;
const keepAliveTimeoutMs = 60_000;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Wire SIGTERM/SIGINT to NestJS lifecycle hooks so onModuleDestroy runs and
  // existing connections drain before the process exits.
  app.enableShutdownHooks();

  const configService = app.get(ConfigService);
  const frontendHost = configService.get<string>(ConfigKey.FRONTEND_HOST) ?? 'http://localhost:3000';
  const enableSwagger = configService.get<boolean>(ConfigKey.ENABLE_SWAGGER) ?? true;
  const port = configService.get<number>(ConfigKey.PORT) ?? 4000;

  const isProduction = process.env.NODE_ENV === 'production';

  // The API only ever returns JSON (plus the Swagger HTML page when enabled in
  // non-production). In production we keep CSP tight even if someone forgets
  // to set ENABLE_SWAGGER=false — Swagger UI can break, that's the point.
  const allowInlineForSwagger = enableSwagger && !isProduction;
  if (isProduction && enableSwagger) {
    const bootstrapLogger = new Logger('bootstrap', {timestamp: true});
    bootstrapLogger.warn('ENABLE_SWAGGER=true in production: keeping strict CSP, Swagger UI may not render.');
  }

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'default-src': ["'none'"],
          'base-uri': ["'self'"],
          'form-action': ["'self'"],
          'frame-ancestors': ["'none'"],
          'img-src': ["'self'", 'data:'],
          'script-src': allowInlineForSwagger ? ["'self'", "'unsafe-inline'"] : ["'self'"],
          'style-src': allowInlineForSwagger ? ["'self'", "'unsafe-inline'"] : ["'self'"],
          'connect-src': ["'self'", frontendHost],
          'object-src': ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: {policy: 'same-site'},
      referrerPolicy: {policy: 'no-referrer'},
      hsts: isProduction
        ? {maxAge: 31_536_000, includeSubDomains: true, preload: false}
        : false,
    }),
  );
  app.use(compression());

  app.enableCors({
    origin: frontendHost,
    credentials: true,
  });

  app.useLogger(new LoggerService());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.use(cookieParser());

  app.setGlobalPrefix('api/v1');

  app.useGlobalFilters(new HttpExceptionFilter(), new PrismaExceptionFilter());

  if (enableSwagger) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('nest auth boilerplate')
      .setDescription('The nest auth boilerplate API description')
      .setVersion('1.0')
      // Two ways to authenticate against this API: the SPA uses the
      // httpOnly access_token cookie, and Swagger UI / direct API consumers
      // can use a bearer token from /auth/login response.
      .addCookieAuth('access_token', {type: 'apiKey', in: 'cookie', name: 'access_token'})
      .addBearerAuth({type: 'http', scheme: 'bearer', bearerFormat: 'JWT'})
      .build();
    const documentFactory = (): OpenAPIObject => SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, documentFactory);
  }

  const httpServer = app.getHttpServer() as {
    headersTimeout: number;
    requestTimeout: number;
    keepAliveTimeout: number;
  };
  // Slowloris hardening: cap how long a client can hold an idle / partially
  // sent request. Keep-alive is bounded so load balancers can recycle
  // connections after a deploy.
  httpServer.headersTimeout = headersTimeoutMs;
  httpServer.requestTimeout = requestTimeoutMs;
  httpServer.keepAliveTimeout = keepAliveTimeoutMs;

  await app.listen(port);

  if (enableSwagger) {
    const logger = new Logger('bootstrap', {timestamp: true});
    logger.log(`Swagger is running on: ${await app.getUrl()}/api/docs`);
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises, unicorn/prefer-top-level-await
bootstrap();
