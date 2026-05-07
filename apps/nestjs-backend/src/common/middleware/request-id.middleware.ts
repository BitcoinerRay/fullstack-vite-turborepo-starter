import {randomUUID} from 'node:crypto';
import {Injectable, NestMiddleware} from '@nestjs/common';
import {type Request, type Response} from 'express';

const requestIdHeader = 'x-request-id';
const maxIncomingIdLength = 128;

declare module 'express-serve-static-core' {
  // Augment the express Request type so middleware/handlers can read req.id.
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Request {
    id?: string;
  }
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  // Trust an inbound x-request-id (from a load balancer or upstream gateway)
  // when present, otherwise mint one. Echo it back on the response so logs
  // and clients can correlate retries.
  use(req: Request, res: Response, next: () => void): void {
    const incoming = req.headers[requestIdHeader];
    const id =
      typeof incoming === 'string' && incoming.length > 0 && incoming.length <= maxIncomingIdLength
        ? incoming
        : randomUUID();
    req.id = id;
    res.setHeader(requestIdHeader, id);
    next();
  }
}
