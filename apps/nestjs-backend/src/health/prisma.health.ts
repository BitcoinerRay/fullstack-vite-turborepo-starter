/* eslint-disable @typescript-eslint/no-deprecated */
import {Injectable} from '@nestjs/common';
import {HealthIndicator, HealthIndicatorResult, HealthCheckError} from '@nestjs/terminus';
import {PrismaService} from '@next-nest-turbo-auth-boilerplate/db';

@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async pingCheck(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return this.getStatus(key, true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const status = this.getStatus(key, false, {message});
      throw new HealthCheckError('Prisma ping check failed', status);
    }
  }
}
