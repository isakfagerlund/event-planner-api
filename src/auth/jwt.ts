import { encodeText, toBase64Url, fromBase64Url, decodeText, toArrayBuffer } from './encoding';
import type { AccessTokenPayload } from './types';

const getCrypto = () => {
  if (typeof crypto !== 'undefined') {
    return crypto;
  }

  throw new Error('Crypto API is not available in this runtime');
};

const textEncoder = new TextEncoder();

const importHmacKey = async (secret: string) => {
  const cryptoApi = getCrypto();
  return cryptoApi.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
};

const encodeSegment = (value: Record<string, unknown>) =>
  toBase64Url(encodeText(JSON.stringify(value)));

const decodeSegment = (segment: string) => {
  const decoded = decodeText(fromBase64Url(segment));
  return JSON.parse(decoded) as Record<string, unknown>;
};

export const signJwt = async (
  payload: Omit<AccessTokenPayload, 'iat' | 'exp'>,
  secret: string,
  expiresInSeconds: number
) => {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: AccessTokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const headerSegment = encodeSegment({ alg: 'HS256', typ: 'JWT' });
  const payloadSegment = encodeSegment(fullPayload);
  const dataToSign = `${headerSegment}.${payloadSegment}`;

  const key = await importHmacKey(secret);
  const cryptoApi = getCrypto();
  const dataBytes = encodeText(dataToSign);
  const signature = await cryptoApi.subtle.sign('HMAC', key, toArrayBuffer(dataBytes));
  const signatureSegment = toBase64Url(new Uint8Array(signature));

  return {
    token: `${dataToSign}.${signatureSegment}`,
    payload: fullPayload,
  };
};

export const verifyJwt = async (token: string, secret: string): Promise<AccessTokenPayload> => {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }

  const [headerSegment, payloadSegment, signatureSegment] = parts;
  const header = decodeSegment(headerSegment);

  if (header.alg !== 'HS256') {
    throw new Error('Unsupported JWT algorithm');
  }

  const key = await importHmacKey(secret);
  const dataToSign = `${headerSegment}.${payloadSegment}`;
  const signatureBytes = fromBase64Url(signatureSegment);
  const cryptoApi = getCrypto();
  const signatureBuffer = toArrayBuffer(signatureBytes);
  const dataBytes = encodeText(dataToSign);
  const dataBuffer = toArrayBuffer(dataBytes);

  const isValid = await cryptoApi.subtle.verify('HMAC', key, signatureBuffer, dataBuffer);
  if (!isValid) {
    throw new Error('Invalid token signature');
  }

  const payload = decodeSegment(payloadSegment) as Partial<AccessTokenPayload>;

  if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') {
    throw new Error('Invalid token payload');
  }

  if (payload.displayName !== null && typeof payload.displayName !== 'string') {
    throw new Error('Invalid token payload');
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || typeof payload.iat !== 'number' || payload.exp <= now) {
    throw new Error('Token expired');
  }

  return {
    sub: payload.sub,
    email: payload.email,
    displayName: payload.displayName ?? null,
    exp: payload.exp,
    iat: payload.iat,
  };
};
