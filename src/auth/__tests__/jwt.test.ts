import { describe, expect, it } from 'bun:test';

import { signJwt, verifyJwt } from '../jwt';

describe('JWT utilities', () => {
  it('signs and verifies payloads', async () => {
    const secret = 'super-secret';
    const { token, payload } = await signJwt(
      {
        sub: 'usr_test',
        email: 'test@example.com',
        displayName: 'Test User',
      },
      secret,
      60
    );

    expect(typeof token).toBe('string');
    expect(payload.sub).toBe('usr_test');

    const verified = await verifyJwt(token, secret);
    expect(verified.email).toBe('test@example.com');
    expect(verified.displayName).toBe('Test User');
    expect(verified.exp).toBeGreaterThan(verified.iat);
  });

  it('rejects tokens with invalid signature', async () => {
    const secret = 'secret-one';
    const otherSecret = 'secret-two';

    const { token } = await signJwt(
      {
        sub: 'usr_test',
        email: 'test@example.com',
        displayName: null,
      },
      secret,
      60
    );

    await expect(verifyJwt(token, otherSecret)).rejects.toThrow('Invalid token signature');
  });
});
