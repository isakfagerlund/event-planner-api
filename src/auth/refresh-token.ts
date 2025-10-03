import { encodeText, toBase64Url } from './encoding';

const getCrypto = () => {
  if (typeof crypto !== 'undefined') {
    return crypto;
  }

  throw new Error('Crypto API is not available in this runtime');
};

export const createRefreshToken = async (ttlSeconds: number) => {
  const cryptoApi = getCrypto();
  const randomBytes = cryptoApi.getRandomValues(new Uint8Array(48));
  const token = toBase64Url(randomBytes);
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  const hashBuffer = await cryptoApi.subtle.digest('SHA-256', encodeText(token));
  const hashedToken = toBase64Url(new Uint8Array(hashBuffer));

  return { token, hashedToken, expiresAt } as const;
};

export const hashRefreshToken = async (token: string) => {
  const cryptoApi = getCrypto();
  const hashBuffer = await cryptoApi.subtle.digest('SHA-256', encodeText(token));
  return toBase64Url(new Uint8Array(hashBuffer));
};
