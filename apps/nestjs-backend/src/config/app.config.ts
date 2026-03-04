import {ConfigKey} from './config-key.enum';

const appConfig = (): Record<ConfigKey, unknown> => ({
  [ConfigKey.NODE_ENV]: process.env.NODE_ENV,
  [ConfigKey.FRONTEND_HOST]: process.env.HOST,
  [ConfigKey.PORT]: process.env.PORT,
  [ConfigKey.ENABLE_SWAGGER]: Boolean(process.env.ENABLE_SWAGGER === 'true'),

  [ConfigKey.DATABASE_URL]: process.env.DATABASE_URL,
  [ConfigKey.POSTGRES_TIMEZONE]: process.env.POSTGRES_TIMEZONE,
  [ConfigKey.POSTGRES_DB_NAME]: process.env.POSTGRES_DB_NAME,
  [ConfigKey.POSTGRES_PASSWORD]: process.env.POSTGRES_PASSWORD,
  [ConfigKey.POSTGRES_PORT]: Number(process.env.POSTGRES_PORT),
  [ConfigKey.POSTGRES_HOST]: process.env.POSTGRES_HOST,
  [ConfigKey.POSTGRES_USER]: process.env.POSTGRES_USER,
  [ConfigKey.POSTGRES_DEBUG_MODE]: Boolean(process.env.POSTGRES_DEBUG_MODE === 'true'),

  [ConfigKey.REDIS_URL]: process.env.REDIS_URL,
  [ConfigKey.REDIS_HOST]: process.env.REDIS_HOST,
  [ConfigKey.REDIS_PORT]: Number(process.env.REDIS_PORT),
  [ConfigKey.REDIS_PASSWORD]: process.env.REDIS_PASSWORD,

  [ConfigKey.JWT_SECRET]: process.env.JWT_SECRET,
  [ConfigKey.JWT_EXPIRES_IN]: process.env.JWT_EXPIRES_IN ?? '7d',
});

export default appConfig;
