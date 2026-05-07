import {parseRefreshTtlSeconds} from './auth.service';

describe('parseRefreshTtlSeconds', () => {
  const sevenDaysInSeconds = 7 * 24 * 60 * 60;

  it.each([
    ['7d', sevenDaysInSeconds],
    ['1d', 24 * 60 * 60],
    ['15m', 15 * 60],
    ['1h', 60 * 60],
    ['90s', 90],
    ['3600', 3600],
  ])('parses %s into %s seconds', (input, expected) => {
    expect(parseRefreshTtlSeconds(input)).toBe(expected);
  });

  it('passes through positive numeric values', () => {
    expect(parseRefreshTtlSeconds(120)).toBe(120);
  });

  it.each<string | number | undefined>([undefined, '', 'forever', '7y', '-1d', Number.NaN])(
    'falls back to 7 days for %p',
    (input) => {
      expect(parseRefreshTtlSeconds(input)).toBe(sevenDaysInSeconds);
    },
  );
});
