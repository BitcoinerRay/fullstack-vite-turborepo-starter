/* eslint-disable promise/valid-params, promise/prefer-await-to-then --
   filter.catch() is the synchronous NestJS ExceptionFilter contract, not
   Promise.catch — the lint rules misfire on the bare method name. */
import {ArgumentsHost, HttpStatus} from '@nestjs/common';
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientRustPanicError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from '@next-nest-turbo-auth-boilerplate/db';
import {type Request, type Response} from 'express';
import {PrismaExceptionFilter} from './prisma-exception.filter';

type ResponseStubs = {
  status: jest.Mock;
  json: jest.Mock;
};

type HostBuilderResult = {host: ArgumentsHost; res: ResponseStubs};

function buildHost(reqOverrides: Partial<Request> = {}): HostBuilderResult {
  const json = jest.fn();
  const status = jest.fn(() => ({json}));
  const res: ResponseStubs = {status, json};
  const responseStub: unknown = {status};
  const requestStub: unknown = {
    url: '/api/v1/users',
    method: 'POST',
    id: 'req-prisma-1',
    ...reqOverrides,
  };
  const switchToHttp = (): {getResponse: () => Response; getRequest: () => Request} => ({
    getResponse: (): Response => responseStub as Response,
    getRequest: (): Request => requestStub as Request,
  });
  const hostStub: unknown = {switchToHttp};
  return {host: hostStub as ArgumentsHost, res};
}

function buildKnownRequestError(code: string): PrismaClientKnownRequestError {
  // PrismaClientKnownRequestError's constructor signature varies across Prisma
  // versions; constructing through Object.create + property assignment avoids
  // pinning the runtime shape from these unit tests.
  const error = Object.create(PrismaClientKnownRequestError.prototype) as PrismaClientKnownRequestError & {
    code: string;
    message: string;
    stack?: string;
  };
  error.code = code;
  error.message = `Prisma error ${code}`;
  error.stack = 'stack-trace';
  return error;
}

describe('PrismaExceptionFilter', () => {
  const filter = new PrismaExceptionFilter();

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ['P2002', HttpStatus.CONFLICT, 'Unique constraint violation'],
    ['P2003', HttpStatus.BAD_REQUEST, 'Foreign key constraint violation'],
    ['P2025', HttpStatus.NOT_FOUND, 'Record not found'],
    ['P1001', HttpStatus.SERVICE_UNAVAILABLE, "Can't reach database server"],
    ['P2034', HttpStatus.CONFLICT, 'Transaction conflict - please retry'],
  ])('maps known request error %s to %s with message %s', (code, expectedStatus, expectedMessage) => {
    const {host, res} = buildHost();

    filter.catch(buildKnownRequestError(code), host);

    expect(res.status).toHaveBeenCalledWith(expectedStatus);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: expectedStatus,
        message: expectedMessage,
        path: '/api/v1/users',
        requestId: 'req-prisma-1',
      }),
    );
  });

  it('falls back to 500 with a generic message for unmapped Prisma error codes', () => {
    const {host, res} = buildHost();

    filter.catch(buildKnownRequestError('P9999'), host);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An unexpected database error occurred',
      }),
    );
  });

  it('returns 400 for validation errors', () => {
    const {host, res} = buildHost();
    const error = Object.create(PrismaClientValidationError.prototype) as PrismaClientValidationError;
    Object.assign(error, {message: 'bad query', stack: 'stack'});

    filter.catch(error, host);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({statusCode: HttpStatus.BAD_REQUEST, message: 'Validation error in database query'}),
    );
  });

  it('returns 503 for initialization errors', () => {
    const {host, res} = buildHost();
    const error = Object.create(PrismaClientInitializationError.prototype) as PrismaClientInitializationError;
    Object.assign(error, {message: 'cannot connect', stack: 'stack'});

    filter.catch(error, host);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
  });

  it('returns 500 for rust panic errors', () => {
    const {host, res} = buildHost();
    const error = Object.create(PrismaClientRustPanicError.prototype) as PrismaClientRustPanicError;
    Object.assign(error, {message: 'panic', stack: 'stack'});

    filter.catch(error, host);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({message: 'Database engine error'}));
  });

  it('returns 500 for unknown request errors', () => {
    const {host, res} = buildHost();
    const error = Object.create(PrismaClientUnknownRequestError.prototype) as PrismaClientUnknownRequestError;
    Object.assign(error, {message: 'unknown', stack: 'stack'});

    filter.catch(error, host);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({message: 'Unknown database error'}));
  });

  it('includes requestId in the response when middleware set req.id', () => {
    const {host, res} = buildHost({id: 'trace-99'});

    filter.catch(buildKnownRequestError('P2002'), host);

    const body = res.json.mock.calls[0]?.[0] as {requestId?: string};
    expect(body.requestId).toBe('trace-99');
  });
});
