import {Injectable, NestMiddleware} from '@nestjs/common';
import {Request, Response} from 'express';
import {Logger} from './logger.service';

const sensitiveHeaders = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'proxy-authorization',
  'x-api-key',
  'x-auth-token',
]);

const sensitiveFields = new Set([
  'password',
  'confirmpassword',
  'currentpassword',
  'newpassword',
  'passwordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'apikey',
  'secret',
  'authorization',
  'creditcard',
  'cardnumber',
  'cvv',
  'ssn',
]);

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

  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    redacted[key] = sensitiveFields.has(key.toLowerCase()) ? '[REDACTED]' : value;
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
    const requestId = req.id ?? '-';

    response.on('finish', () => {
      const duration = Date.now() - startTime;
      const summary = `[${method}] ${originalUrl} - Status: ${response.statusCode} - IP: ${ip} - ${duration}ms - ReqId: ${requestId}`;

      if (response.statusCode >= 200 && response.statusCode < 400) {
        this.logger.log(summary);
      } else if (response.statusCode >= 400 && response.statusCode < 500) {
        this.logger.warn(summary);
        this.logger.warn(`Request Header: ${JSON.stringify(redactHeaders(req.headers))}`);
        this.logger.warn(`Request Body: ${JSON.stringify(redactBody(req.body))}`);
      } else if (response.statusCode >= 500) {
        this.logger.error(summary);
        this.logger.error(`Request Header: ${JSON.stringify(redactHeaders(req.headers))}`);
        this.logger.error(`Request Body: ${JSON.stringify(redactBody(req.body))}`);
      }
    });

    response.on('error', (err) => {
      const duration = Date.now() - startTime;
      this.logger.error(`[${method}] ${originalUrl} - IP: ${ip} - ${duration}ms - ReqId: ${requestId} - Error: ${err.message}`);
    });

    next();
  }
}
