import { encodeText, toBase64Url, fromBase64Url, decodeText, toArrayBuffer } from './encoding';

const PBKDF2_DIGEST = 'SHA-256';
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEY_LENGTH = 32; // 256 bits
const PBKDF2_SALT_LENGTH = 16; // 128 bits

const arrayBufferToUint8Array = (buffer: ArrayBuffer): Uint8Array =>
  buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

const getCrypto = () => {
  if (typeof crypto !== 'undefined') {
    return crypto;
  }

  throw new Error('Crypto API is not available in this runtime');
};

const deriveKey = async (password: string, salt: Uint8Array, iterations: number) => {
  const cryptoApi = getCrypto();
  const key = await cryptoApi.subtle.importKey(
    'raw',
    encodeText(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const saltBuffer = toArrayBuffer(salt);

  const bits = await cryptoApi.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations,
      hash: PBKDF2_DIGEST,
    },
    key,
    PBKDF2_KEY_LENGTH * 8
  );

  return arrayBufferToUint8Array(bits);
};

export const hashPassword = async (password: string) => {
  const cryptoApi = getCrypto();
  const salt = cryptoApi.getRandomValues(new Uint8Array(PBKDF2_SALT_LENGTH));
  const derived = await deriveKey(password, salt, PBKDF2_ITERATIONS);
  const encodedSalt = toBase64Url(salt);
  const encodedDerived = toBase64Url(derived);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${encodedSalt}$${encodedDerived}`;
};

const timingSafeEqual = (a: Uint8Array, b: Uint8Array) => {
  if (a.length !== b.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i]! ^ b[i]!;
  }
  return diff === 0;
};

export const verifyPassword = async (password: string, storedHash: string) => {
  const [strategy, iterationsRaw, saltBase64, hashBase64] = storedHash.split('$');

  if (strategy !== 'pbkdf2' || !iterationsRaw || !saltBase64 || !hashBase64) {
    return false;
  }

  const iterations = Number.parseInt(iterationsRaw, 10);
  if (!Number.isFinite(iterations) || iterations <= 0) {
    return false;
  }

  const salt = fromBase64Url(saltBase64);
  const expected = fromBase64Url(hashBase64);

  const actual = await deriveKey(password, salt, iterations);

  return timingSafeEqual(actual, expected);
};

export const upgradePasswordHashIfNeeded = async (password: string, storedHash: string) => {
  const [strategy, iterationsRaw] = storedHash.split('$');
  if (strategy !== 'pbkdf2') {
    return hashPassword(password);
  }

  const iterations = Number.parseInt(iterationsRaw ?? '', 10);
  if (!Number.isFinite(iterations) || iterations < PBKDF2_ITERATIONS) {
    return hashPassword(password);
  }

  return storedHash;
};

export const passwordStrengthHint = 'Password must be at least 8 characters long.';

export const redactPassword = (value: string) => decodeText(encodeText('*'.repeat(Math.max(1, value.length))));
