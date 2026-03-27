import {ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger} from '@nestjs/common';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientUnknownRequestError,
} from '@next-nest-turbo-auth-boilerplate/db';
import {Request, Response} from 'express';
import {ErrorResponse} from './types/error-response.type';

type PrismaError =
  | PrismaClientKnownRequestError
  | PrismaClientValidationError
  | PrismaClientRustPanicError
  | PrismaClientInitializationError
  | PrismaClientUnknownRequestError;

@Catch(
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientUnknownRequestError,
)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: PrismaError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse: ErrorResponse = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Database error occurred',
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (exception instanceof PrismaClientKnownRequestError) {
      this.handleKnownRequestError(exception, errorResponse);
    } else if (exception instanceof PrismaClientValidationError) {
      errorResponse.statusCode = HttpStatus.BAD_REQUEST;
      errorResponse.message = 'Validation error in database query';
    } else if (exception instanceof PrismaClientInitializationError) {
      errorResponse.statusCode = HttpStatus.SERVICE_UNAVAILABLE;
      errorResponse.message = 'Database connection error';
    } else if (exception instanceof PrismaClientRustPanicError) {
      errorResponse.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      errorResponse.message = 'Database engine error';
    } else if (exception instanceof PrismaClientUnknownRequestError) {
      errorResponse.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      errorResponse.message = 'Unknown database error';
    }

    this.logger.error(`Prisma error on ${request.method} ${request.url}: ${exception.message}`, exception.stack);

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private handleKnownRequestError(exception: PrismaClientKnownRequestError, errorResponse: ErrorResponse): void {
    const {code} = exception;

    switch (code) {
      case 'P2002': {
        errorResponse.statusCode = HttpStatus.CONFLICT;
        errorResponse.message = 'Unique constraint violation';
        break;
      }

      case 'P2003': {
        errorResponse.statusCode = HttpStatus.BAD_REQUEST;
        errorResponse.message = 'Foreign key constraint violation';
        break;
      }

      case 'P2011': {
        errorResponse.statusCode = HttpStatus.BAD_REQUEST;
        errorResponse.message = 'Required field is missing';
        break;
      }

      case 'P2025': {
        errorResponse.statusCode = HttpStatus.NOT_FOUND;
        errorResponse.message = 'Record not found';
        break;
      }

      case 'P1001': {
        errorResponse.statusCode = HttpStatus.SERVICE_UNAVAILABLE;
        errorResponse.message = "Can't reach database server";
        break;
      }

      case 'P1008': {
        errorResponse.statusCode = HttpStatus.SERVICE_UNAVAILABLE;
        errorResponse.message = 'Database connection timeout';
        break;
      }

      case 'P1003': {
        errorResponse.statusCode = HttpStatus.SERVICE_UNAVAILABLE;
        errorResponse.message = 'Database does not exist';
        break;
      }

      case 'P1017': {
        errorResponse.statusCode = HttpStatus.SERVICE_UNAVAILABLE;
        errorResponse.message = 'Too many database connections';
        break;
      }

      case 'P2000': {
        errorResponse.statusCode = HttpStatus.BAD_REQUEST;
        errorResponse.message = 'Value too long for column';
        break;
      }

      case 'P2007': {
        errorResponse.statusCode = HttpStatus.BAD_REQUEST;
        errorResponse.message = 'Invalid data type';
        break;
      }

      case 'P2008': {
        errorResponse.statusCode = HttpStatus.BAD_REQUEST;
        errorResponse.message = 'Failed to parse query';
        break;
      }

      case 'P2009': {
        errorResponse.statusCode = HttpStatus.BAD_REQUEST;
        errorResponse.message = 'Failed to validate query';
        break;
      }

      case 'P2034': {
        errorResponse.statusCode = HttpStatus.CONFLICT;
        errorResponse.message = 'Transaction conflict - please retry';
        break;
      }

      default: {
        errorResponse.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        errorResponse.message = 'An unexpected database error occurred';
      }
    }
  }
}
