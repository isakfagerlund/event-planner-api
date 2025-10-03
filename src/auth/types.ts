export type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
};

export type AccessTokenPayload = {
  sub: string;
  email: string;
  displayName: string | null;
  iat: number;
  exp: number;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
};
