import {ArgumentsHost, Catch, ExceptionFilter, HttpStatus} from '@nestjs/common';
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
  catch(exception: PrismaError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse: ErrorResponse = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Database error occurred',
      timestamp: new Date().toISOString(),
      path: request.url,
      detail: exception.message,
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

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private handleKnownRequestError(exception: PrismaClientKnownRequestError, errorResponse: ErrorResponse): void {
    const {code} = exception;

    switch (code) {
      // Unique constraint violation
      case 'P2002': {
        errorResponse.statusCode = HttpStatus.CONFLICT;
        errorResponse.message = 'Unique constraint violation';
        const meta = exception.meta as {target?: string[]};
        if (meta?.target) {
          errorResponse.detail = `Duplicate value for field(s): ${meta.target.join(', ')}`;
        }

        break;
      }

      // Foreign key constraint violation
      case 'P2003': {
        errorResponse.statusCode = HttpStatus.BAD_REQUEST;
        errorResponse.message = 'Foreign key constraint violation';
        const meta = exception.meta as {field_name?: string};
        if (meta?.field_name) {
          errorResponse.detail = `Invalid reference for field: ${meta.field_name}`;
        }

        break;
      }

      // Required field is missing
      case 'P2011': {
        errorResponse.statusCode = HttpStatus.BAD_REQUEST;
        errorResponse.message = 'Required field is missing';
        break;
      }

      // Record not found
      case 'P2025': {
        errorResponse.statusCode = HttpStatus.NOT_FOUND;
        errorResponse.message = 'Record not found';
        break;
      }

      // Connection error
      case 'P1001': {
        errorResponse.statusCode = HttpStatus.SERVICE_UNAVAILABLE;
        errorResponse.message = "Can't reach database server";
        break;
      }

      // Connection timeout
      case 'P1008': {
        errorResponse.statusCode = HttpStatus.SERVICE_UNAVAILABLE;
        errorResponse.message = 'Database connection timeout';
        break;
      }

      // Database does not exist
      case 'P1003': {
        errorResponse.statusCode = HttpStatus.SERVICE_UNAVAILABLE;
        errorResponse.message = 'Database does not exist';
        break;
      }

      // Too many connections
      case 'P1017': {
        errorResponse.statusCode = HttpStatus.SERVICE_UNAVAILABLE;
        errorResponse.message = 'Too many database connections';
        break;
      }

      // Value too long for column
      case 'P2000': {
        errorResponse.statusCode = HttpStatus.BAD_REQUEST;
        errorResponse.message = 'Value too long for column';
        const meta = exception.meta as {column_name?: string};
        if (meta?.column_name) {
          errorResponse.detail = `Value exceeds maximum length for: ${meta.column_name}`;
        }

        break;
      }

      // Invalid value for column type
      case 'P2007': {
        errorResponse.statusCode = HttpStatus.BAD_REQUEST;
        errorResponse.message = 'Invalid data type';
        break;
      }

      // Query parsing error
      case 'P2008': {
        errorResponse.statusCode = HttpStatus.BAD_REQUEST;
        errorResponse.message = 'Failed to parse query';
        break;
      }

      // Query validation error
      case 'P2009': {
        errorResponse.statusCode = HttpStatus.BAD_REQUEST;
        errorResponse.message = 'Failed to validate query';
        break;
      }

      // Transaction conflict (serialization failure)
      case 'P2034': {
        errorResponse.statusCode = HttpStatus.CONFLICT;
        errorResponse.message = 'Transaction conflict - please retry';
        break;
      }

      default: {
        errorResponse.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        errorResponse.message = 'An unexpected database error occurred';
        errorResponse.detail = `Prisma error code: ${code}`;
      }
    }
  }
}
