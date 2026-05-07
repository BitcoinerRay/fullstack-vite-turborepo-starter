import {Global, Logger, MiddlewareConsumer, Module, NestModule} from '@nestjs/common';
import {LoggerMiddleware} from './logger/logger.middleware';
import {LoggerModule} from './logger/logger.module';
import {RequestIdMiddleware} from './middleware/request-id.middleware';

@Global()
@Module({
  imports: [LoggerModule],
  providers: [Logger],
  exports: [LoggerModule],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Order matters: request id must be set before the logger reads it.
    consumer.apply(RequestIdMiddleware, LoggerMiddleware).forRoutes('*');
  }
}
