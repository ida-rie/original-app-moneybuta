export const ACCESS_TOKEN_COOKIE_NAME = 'mb_access_token';
export const REFRESH_TOKEN_COOKIE_NAME = 'mb_refresh_token';

export const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 60; // 1 hour
export const REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export const getAuthCookieSecure = () => process.env.NODE_ENV === 'production';
