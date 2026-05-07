import {ConfigService} from '@nestjs/config';
import {RedisService} from './redis.service';

type FakeRedis = {
  get: jest.Mock;
  set: jest.Mock;
  del: jest.Mock;
  getdel: jest.Mock;
  on: jest.Mock;
  ping: jest.Mock;
  quit: jest.Mock;
};

function buildFakeRedis(): FakeRedis {
  return {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getdel: jest.fn(),
    on: jest.fn(),
    ping: jest.fn(async () => 'PONG'),
    quit: jest.fn(async () => 'OK'),
  };
}

function buildService(client: FakeRedis): RedisService {
  const configService = {get: jest.fn(), getOrThrow: jest.fn()} as unknown as ConfigService;
  const service = new RedisService(configService);
  // RedisService.publisher is private; assigning via index signature avoids the
  // need to spin up a real ioredis connection from these unit tests.
  (service as unknown as {publisher: FakeRedis}).publisher = client;
  return service;
}

describe('RedisService cache helpers', () => {
  describe('getJson', () => {
    it('returns parsed JSON when the key exists', async () => {
      const client = buildFakeRedis();
      client.get.mockResolvedValue(JSON.stringify({hello: 'world'}));
      const service = buildService(client);

      await expect(service.getJson('key')).resolves.toEqual({hello: 'world'});
      expect(client.get).toHaveBeenCalledWith('key');
    });

    it('returns undefined on cache miss', async () => {
      const client = buildFakeRedis();
      client.get.mockResolvedValue(null);
      const service = buildService(client);

      await expect(service.getJson('miss')).resolves.toBeUndefined();
    });

    it('swallows transport errors so the request can fall back to source of truth', async () => {
      const client = buildFakeRedis();
      client.get.mockRejectedValue(new Error('boom'));
      const service = buildService(client);

      await expect(service.getJson('key')).resolves.toBeUndefined();
    });
  });

  describe('setJson', () => {
    it('serializes and writes with TTL', async () => {
      const client = buildFakeRedis();
      const service = buildService(client);

      await service.setJson('key', {n: 1}, 60);

      expect(client.set).toHaveBeenCalledWith('key', JSON.stringify({n: 1}), 'EX', 60);
    });

    it('swallows transport errors', async () => {
      const client = buildFakeRedis();
      client.set.mockRejectedValue(new Error('boom'));
      const service = buildService(client);

      await expect(service.setJson('key', {n: 1}, 60)).resolves.toBeUndefined();
    });
  });

  describe('consumeKey', () => {
    it('returns true when getdel finds the key (atomic consume)', async () => {
      const client = buildFakeRedis();
      client.getdel.mockResolvedValue('1');
      const service = buildService(client);

      await expect(service.consumeKey('refresh:jti:abc')).resolves.toBe(true);
      expect(client.getdel).toHaveBeenCalledWith('refresh:jti:abc');
    });

    it('returns false when the key is absent (already consumed or expired)', async () => {
      const client = buildFakeRedis();
      client.getdel.mockResolvedValue(null);
      const service = buildService(client);

      await expect(service.consumeKey('refresh:jti:gone')).resolves.toBe(false);
    });

    it('returns false on transport errors so refresh fails closed', async () => {
      const client = buildFakeRedis();
      client.getdel.mockRejectedValue(new Error('boom'));
      const service = buildService(client);

      await expect(service.consumeKey('refresh:jti:flaky')).resolves.toBe(false);
    });
  });

  describe('recordKey', () => {
    it('writes a placeholder value with the supplied TTL', async () => {
      const client = buildFakeRedis();
      const service = buildService(client);

      await service.recordKey('refresh:jti:new', 604_800);

      expect(client.set).toHaveBeenCalledWith('refresh:jti:new', '1', 'EX', 604_800);
    });

    it('swallows transport errors', async () => {
      const client = buildFakeRedis();
      client.set.mockRejectedValue(new Error('boom'));
      const service = buildService(client);

      await expect(service.recordKey('refresh:jti:new', 60)).resolves.toBeUndefined();
    });
  });

  describe('del', () => {
    it('deletes the supplied keys', async () => {
      const client = buildFakeRedis();
      const service = buildService(client);

      await service.del('a', 'b');

      expect(client.del).toHaveBeenCalledWith('a', 'b');
    });

    it('is a no-op when no keys are supplied', async () => {
      const client = buildFakeRedis();
      const service = buildService(client);

      await service.del();

      expect(client.del).not.toHaveBeenCalled();
    });
  });
});
