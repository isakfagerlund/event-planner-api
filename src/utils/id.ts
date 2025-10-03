export const createId = (prefix: string) => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${random}`;
};
