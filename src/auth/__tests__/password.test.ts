import { describe, expect, it } from 'bun:test';

import { hashPassword, verifyPassword, upgradePasswordHashIfNeeded } from '../password';

describe('password hashing', () => {
  it('hashes and verifies passwords using PBKDF2', async () => {
    const password = 'CorrectHorseBatteryStaple!';
    const hash = await hashPassword(password);

    expect(hash.startsWith('pbkdf2$')).toBe(true);
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword('wrong-password', hash)).toBe(false);
  });

  it('upgrades hashes when parameters are outdated', async () => {
    const password = 'Another$ecret123';
    const legacyHash = 'pbkdf2$1$' + 'a'.repeat(22) + '$' + 'b'.repeat(43);

    const upgraded = await upgradePasswordHashIfNeeded(password, legacyHash);

    expect(upgraded).not.toEqual(legacyHash);
    expect(await verifyPassword(password, upgraded)).toBe(true);
  });
});
