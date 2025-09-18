/**
 * Utility types for common patterns
 */

/**
 * Make specific properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Extract keys of a type that are of a specific type
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * Create a type with only the specified keys
 */
export type PickByType<T, U> = Pick<T, KeysOfType<T, U>>;

/**
 * Omit keys that are of a specific type
 */
export type OmitByType<T, U> = Omit<T, KeysOfType<T, U>>;

/**
 * Deep partial type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Non-nullable type
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * Promise return type
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T;

/**
 * Function parameters type
 */
export type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;

/**
 * Function return type
 */
export type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;