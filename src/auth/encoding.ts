const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const toBase64 = (input: Uint8Array): string => {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(input).toString('base64');
  }

  let binary = '';
  input.forEach((value) => {
    binary += String.fromCharCode(value);
  });

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - atob is not available in Node typings but exists in edge runtimes
  return btoa(binary);
};

const fromBase64 = (input: string): Uint8Array => {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(input, 'base64'));
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - atob is not available in Node typings but exists in edge runtimes
  const binary = atob(input);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    array[i] = binary.charCodeAt(i);
  }
  return array;
};

export const toBase64Url = (input: Uint8Array) =>
  toBase64(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

export const fromBase64Url = (input: string): Uint8Array => {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(padLength);
  return fromBase64(padded);
};

export const encodeText = (value: string) => textEncoder.encode(value);

export const decodeText = (value: Uint8Array) => textDecoder.decode(value);

export const toArrayBuffer = (value: Uint8Array): ArrayBuffer => {
  if (
    value.byteOffset === 0 &&
    value.byteLength === value.buffer.byteLength &&
    value.buffer instanceof ArrayBuffer
  ) {
    return value.buffer;
  }

  return value.slice().buffer;
};
