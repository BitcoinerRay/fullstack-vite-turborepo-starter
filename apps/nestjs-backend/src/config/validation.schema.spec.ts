/* eslint-disable @typescript-eslint/naming-convention -- env-var keys are
   UPPER_SNAKE_CASE by convention; this fixture mirrors process.env. */
import validationSchema from './validation.schema';

const baseEnv = {
  NODE_ENV: 'development',
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  REDIS_URL: 'redis://localhost:6379',
  JWT_SECRET: 'a'.repeat(32),
  REFRESH_TOKEN_SECRET: 'b'.repeat(32),
};

describe('validationSchema', () => {
  it('accepts a fully populated DATABASE_URL configuration', () => {
    const result = validationSchema.validate(baseEnv);

    expect(result.error).toBeUndefined();
  });

  it('accepts the POSTGRES_* tuple as an alternative to DATABASE_URL', () => {
    const env = {
      ...baseEnv,
      DATABASE_URL: undefined,
      POSTGRES_HOST: 'db',
      POSTGRES_USER: 'postgres',
      POSTGRES_PASSWORD: 'pass',
      POSTGRES_DB_NAME: 'app',
    };

    const result = validationSchema.validate(env);

    expect(result.error).toBeUndefined();
  });

  it('rejects when neither DATABASE_URL nor POSTGRES_HOST is set', () => {
    const env = {...baseEnv, DATABASE_URL: undefined};

    const result = validationSchema.validate(env);

    expect(result.error?.message).toMatch(/must contain at least one of/u);
  });

  it('rejects when POSTGRES_HOST is set but USER / PASSWORD / DB_NAME is missing', () => {
    const env = {
      ...baseEnv,
      DATABASE_URL: undefined,
      POSTGRES_HOST: 'db',
      POSTGRES_USER: 'postgres',
      // POSTGRES_PASSWORD intentionally missing
      POSTGRES_DB_NAME: 'app',
    };

    const result = validationSchema.validate(env);

    expect(result.error?.message).toMatch(/missing required peer/u);
  });

  it('rejects when JWT_SECRET equals REFRESH_TOKEN_SECRET (a leak of one would mint both)', () => {
    const sharedSecret = 'c'.repeat(32);
    const env = {...baseEnv, JWT_SECRET: sharedSecret, REFRESH_TOKEN_SECRET: sharedSecret};

    const result = validationSchema.validate(env);

    expect(result.error).toBeDefined();
  });

  it('rejects JWT_SECRET shorter than 32 characters', () => {
    const env = {...baseEnv, JWT_SECRET: 'short'};

    const result = validationSchema.validate(env);

    expect(result.error?.message).toMatch(/length must be at least 32/u);
  });
});
