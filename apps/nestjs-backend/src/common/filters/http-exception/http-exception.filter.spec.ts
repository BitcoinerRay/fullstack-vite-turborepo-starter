/* eslint-disable promise/valid-params, promise/prefer-await-to-then --
   filter.catch() is the synchronous NestJS ExceptionFilter contract, not
   Promise.catch — the lint rules misfire on the bare method name. */
import {
  ArgumentsHost,
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import {type Request, type Response} from 'express';
import {HttpExceptionFilter} from './http-exception.filter';

type ResponseStubs = {
  status: jest.Mock;
  json: jest.Mock;
};

type HostBuilderResult = {host: ArgumentsHost; res: ResponseStubs};

function buildHost(req: Partial<Request>): HostBuilderResult {
  const json = jest.fn();
  const status = jest.fn(() => ({json}));
  const res: ResponseStubs = {status, json};
  const responseStub: unknown = {status};
  const requestStub: unknown = {url: '/api/v1/test', ...req};
  const switchToHttp = (): {getResponse: () => Response; getRequest: () => Request} => ({
    getResponse: (): Response => responseStub as Response,
    getRequest: (): Request => requestStub as Request,
  });
  const hostStub: unknown = {switchToHttp};
  return {host: hostStub as ArgumentsHost, res};
}

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  it('serializes a string-body HttpException with the carried status code', () => {
    const {host, res} = buildHost({id: 'req-1'});

    filter.catch(new UnauthorizedException('Invalid credentials'), host);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(res.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.UNAUTHORIZED,
      message: 'Invalid credentials',
      error: 'Unauthorized',
      requestId: 'req-1',
    });
  });

  it('flattens validation pipe array messages into a joined string + details', () => {
    const {host, res} = buildHost({id: 'req-2', url: '/api/v1/auth/login'});
    const exception = new BadRequestException({
      statusCode: 400,
      message: ['email must be an email', 'password must be longer than or equal to 8 characters'],
      error: 'Bad Request',
    });

    filter.catch(exception, host);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'email must be an email; password must be longer than or equal to 8 characters',
      error: 'Bad Request',
      requestId: 'req-2',
      details: {
        validationErrors: [
          'email must be an email',
          'password must be longer than or equal to 8 characters',
        ],
        path: '/api/v1/auth/login',
      },
    });
  });

  it('omits requestId when the middleware has not run (e.g. before app.use)', () => {
    const {host, res} = buildHost({});

    filter.catch(new ForbiddenException('Forbidden'), host);

    const body = res.json.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(body).not.toHaveProperty('requestId');
    expect(res.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
  });

  it('falls back to exception.message when the body has no string message', () => {
    const {host, res} = buildHost({id: 'req-3'});
    class CustomException extends HttpException {
      constructor() {
        super({statusCode: 418, error: 'Teapot'}, 418);
      }
    }

    filter.catch(new CustomException(), host);

    expect(res.json).toHaveBeenCalledWith({
      statusCode: 418,
      message: expect.any(String),
      error: 'Teapot',
      requestId: 'req-3',
    });
  });
});
