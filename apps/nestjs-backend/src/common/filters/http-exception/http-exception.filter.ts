import {ArgumentsHost, Catch, ExceptionFilter, HttpException} from '@nestjs/common';
import {type Request, type Response} from 'express';

type HttpErrorBody = {
  statusCode: number;
  message: string | string[];
  error?: string;
  details?: Record<string, unknown>;
};

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message: string;
    let error: string | undefined;
    let details: Record<string, unknown> | undefined;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else {
      const body = exceptionResponse as Record<string, unknown>;
      const rawMessage = body.message;

      if (Array.isArray(rawMessage)) {
        message = rawMessage.join('; ');
        details = {validationErrors: rawMessage};
      } else if (typeof rawMessage === 'string') {
        message = rawMessage;
      } else {
        message = exception.message;
      }

      error = typeof body.error === 'string' ? body.error : undefined;
    }

    const body: HttpErrorBody = {statusCode, message};
    if (error) body.error = error;
    if (details) body.details = {...details, path: request.url};

    response.status(statusCode).json(body);
  }
}
