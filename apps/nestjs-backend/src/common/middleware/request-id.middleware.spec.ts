import {type Request, type Response} from 'express';
import {RequestIdMiddleware} from './request-id.middleware';

function buildRequest(overrides: Partial<Request> = {}): Request {
  const partial: Partial<Request> = {headers: {}, ...overrides};
  return partial as Request;
}

function buildResponse(): {response: Response; setHeader: jest.Mock} {
  const setHeader = jest.fn();
  return {response: {setHeader} as unknown as Response, setHeader};
}

describe('RequestIdMiddleware', () => {
  const middleware = new RequestIdMiddleware();

  it('preserves a non-empty inbound x-request-id', () => {
    const req = buildRequest({headers: {'x-request-id': 'upstream-id-123'}});
    const {response, setHeader} = buildResponse();
    const next = jest.fn();

    middleware.use(req, response, next);

    expect(req.id).toBe('upstream-id-123');
    expect(setHeader).toHaveBeenCalledWith('x-request-id', 'upstream-id-123');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('generates a uuid when no header is present', () => {
    const req = buildRequest();
    const {response, setHeader} = buildResponse();

    middleware.use(req, response, jest.fn());

    expect(req.id).toMatch(/^[\da-f-]{36}$/iu);
    expect(setHeader).toHaveBeenCalledWith('x-request-id', req.id);
  });

  it('rejects an oversized inbound id and mints a new one', () => {
    const huge = 'a'.repeat(200);
    const req = buildRequest({headers: {'x-request-id': huge}});
    const {response} = buildResponse();

    middleware.use(req, response, jest.fn());

    expect(req.id).not.toBe(huge);
    expect(req.id).toMatch(/^[\da-f-]{36}$/iu);
  });

  it('ignores an empty inbound id and mints a new one', () => {
    const req = buildRequest({headers: {'x-request-id': ''}});
    const {response} = buildResponse();

    middleware.use(req, response, jest.fn());

    expect(req.id).toMatch(/^[\da-f-]{36}$/iu);
  });
});
