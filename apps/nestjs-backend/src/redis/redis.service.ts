import {Injectable, OnModuleInit, OnModuleDestroy} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import Redis, {RedisOptions} from 'ioredis';
import {ConfigKey} from 'src/config/config-key.enum';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private publisher: Redis | undefined;
  private subscriber: Redis | undefined;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    // Try REDIS_URL first, fallback to individual config
    const redisUrl = this.configService.get<string>(ConfigKey.REDIS_URL);

    if (redisUrl) {
      // Use connection URL
      const options: RedisOptions = {
        retryStrategy(times: number) {
          return Math.min(times * 50, 2000);
        },
        maxRetriesPerRequest: 3,
      };

      this.publisher = new Redis(redisUrl, options);
      this.subscriber = new Redis(redisUrl, options);
    } else {
      // Use individual config values
      const redisConfig: RedisOptions = {
        host: this.configService.get(ConfigKey.REDIS_HOST),
        port: this.configService.get<number>(ConfigKey.REDIS_PORT),
        password: this.configService.get<string>(ConfigKey.REDIS_PASSWORD),
        retryStrategy(times: number) {
          return Math.min(times * 50, 2000);
        },
        maxRetriesPerRequest: 3,
      };

      if (!redisConfig.host || !redisConfig.port) {
        throw new Error('Redis configuration is incomplete');
      }

      this.publisher = new Redis(redisConfig);
      this.subscriber = new Redis(redisConfig);
    }

    // Add error handlers to prevent unhandled errors
    this.publisher?.on('error', (err: Error) => {
      console.error('Redis Publisher Error:', err.message);
    });

    this.subscriber?.on('error', (err: Error) => {
      console.error('Redis Subscriber Error:', err.message);
    });

    // Log successful connection
    this.publisher?.on('connect', () => {
      console.log('Redis Publisher connected successfully');
    });

    this.subscriber?.on('connect', () => {
      console.log('Redis Subscriber connected successfully');
    });
  }

  async publish<T>(channel: string, message: T): Promise<void> {
    const serialized = JSON.stringify(message);
    if (!this.publisher) {
      throw new Error('Redis publisher is not initialized');
    }

    await this.publisher.publish(channel, serialized);
  }

  async subscribe<T>(channel: string, callback: (message: T) => void): Promise<void> {
    if (!this.subscriber) {
      throw new Error('Redis subscriber is not initialized');
    }

    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', (ch, msg) => {
      if (ch === channel) {
        try {
          const parsed = JSON.parse(msg) as T;
          callback(parsed);
        } catch (error) {
          console.error('Failed to parse message:', error);
          callback(msg as T);
        }
      }
    });
  }

  async unsubscribe(channel: string): Promise<void> {
    if (!this.subscriber) {
      throw new Error('Redis subscriber is not initialized');
    }

    await this.subscriber.unsubscribe(channel);
  }

  async onModuleDestroy(): Promise<void> {
    await this.publisher?.quit();
    await this.subscriber?.quit();
  }
}
