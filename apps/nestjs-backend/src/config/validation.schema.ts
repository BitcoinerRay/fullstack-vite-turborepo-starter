import * as Joi from 'joi';
import {ConfigKey} from './config-key.enum';

const validationSchemaMap: Record<ConfigKey, Joi.Schema> = {
  [ConfigKey.NODE_ENV]: Joi.string().valid('development', 'staging', 'production').default('development'),
  [ConfigKey.FRONTEND_HOST]: Joi.string().default('http://localhost:3000'),
  [ConfigKey.PORT]: Joi.number().min(0).max(65_535).default(4000),
  [ConfigKey.ENABLE_SWAGGER]: Joi.boolean().optional().default(true),

  [ConfigKey.DATABASE_URL]: Joi.string().optional(),
  [ConfigKey.POSTGRES_TIMEZONE]: Joi.string().default('UTC'),
  [ConfigKey.POSTGRES_DB_NAME]: Joi.string().optional(),
  [ConfigKey.POSTGRES_PASSWORD]: Joi.string().optional(),
  [ConfigKey.POSTGRES_PORT]: Joi.number().min(0).max(65_535).default(5432),
  [ConfigKey.POSTGRES_USER]: Joi.string().optional(),
  [ConfigKey.POSTGRES_HOST]: Joi.string().optional(),
  [ConfigKey.POSTGRES_DEBUG_MODE]: Joi.boolean().optional().default(false),

  [ConfigKey.REDIS_URL]: Joi.string().optional(),
  [ConfigKey.REDIS_HOST]: Joi.string().optional().default('localhost'),
  [ConfigKey.REDIS_PORT]: Joi.number().min(0).max(65_535).default(6379),
  [ConfigKey.REDIS_PASSWORD]: Joi.string().optional().allow('', null),

  [ConfigKey.JWT_SECRET]: Joi.string().min(32).required(),
  [ConfigKey.JWT_EXPIRES_IN]: Joi.string().default('15m'),
  [ConfigKey.REFRESH_TOKEN_SECRET]: Joi.string().min(32).required(),
  [ConfigKey.REFRESH_TOKEN_EXPIRES_IN]: Joi.string().default('7d'),
  [ConfigKey.BCRYPT_SALT_ROUNDS]: Joi.number().integer().min(4).max(15).default(12),
};

// At least one Postgres entrypoint must be configured. If using individual
// fields instead of DATABASE_URL, the host implies the rest must be set too —
// otherwise startup looks fine but Prisma fails at first query.
export default Joi.object(validationSchemaMap)
  .or(ConfigKey.DATABASE_URL, ConfigKey.POSTGRES_HOST)
  .with(ConfigKey.POSTGRES_HOST, [
    ConfigKey.POSTGRES_USER,
    ConfigKey.POSTGRES_PASSWORD,
    ConfigKey.POSTGRES_DB_NAME,
  ]);
