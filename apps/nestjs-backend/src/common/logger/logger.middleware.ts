import {Injectable, NestMiddleware} from '@nestjs/common';
import {Request, Response} from 'express';
import {Logger} from './logger.service';

const sensitiveHeaders = new Set(['authorization', 'cookie', 'set-cookie']);

function redactHeaders(headers: Record<string, unknown>): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(headers)) {
    redacted[key] = sensitiveHeaders.has(key.toLowerCase()) ? '[REDACTED]' : value;
  }

  return redacted;
}

function redactBody(body: unknown): unknown {
  if (typeof body !== 'object' || body === null) {
    return body;
  }

  const sensitiveFields = new Set(['password', 'confirmPassword', 'passwordHash', 'token', 'secret']);
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    redacted[key] = sensitiveFields.has(key) ? '[REDACTED]' : value;
  }

  return redacted;
}

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: Logger) {
    logger.setContext(LoggerMiddleware.name);
  }

  use(req: Request, response: Response, next: () => void): void {
    const {ip, method, originalUrl} = req;
    const startTime = Date.now();

    response.on('finish', () => {
      const duration = Date.now() - startTime;

      if (response.statusCode >= 200 && response.statusCode < 400) {
        this.logger.log(`[${method}] ${originalUrl} - Status: ${response.statusCode} - IP: ${ip} - ${duration}ms`);
      } else if (response.statusCode >= 400 && response.statusCode < 500) {
        this.logger.warn(`[${method}] ${originalUrl} - Status: ${response.statusCode} - IP: ${ip} - ${duration}ms`);
        this.logger.warn(`Request Header: ${JSON.stringify(redactHeaders(req.headers))}`);
        this.logger.warn(`Request Body: ${JSON.stringify(redactBody(req.body))}`);
      } else if (response.statusCode >= 500) {
        this.logger.error(`[${method}] ${originalUrl} - Status: ${response.statusCode} - IP: ${ip} - ${duration}ms`);
        this.logger.error(`Request Header: ${JSON.stringify(redactHeaders(req.headers))}`);
        this.logger.error(`Request Body: ${JSON.stringify(redactBody(req.body))}`);
      }
    });

    response.on('error', (err) => {
      const duration = Date.now() - startTime;
      this.logger.error(`[${method}] ${originalUrl} - IP: ${ip} - ${duration}ms - Error: ${err.message}`);
    });

    next();
  }
}
