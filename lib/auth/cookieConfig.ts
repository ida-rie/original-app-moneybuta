export const ACCESS_TOKEN_COOKIE_NAME = 'mb_access_token';
export const REFRESH_TOKEN_COOKIE_NAME = 'mb_refresh_token';
export const CSRF_TOKEN_COOKIE_NAME = 'mb_csrf_token';
export const SESSION_META_COOKIE_NAME = 'mb_session_meta';

export const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 60; // 1 hour
export const REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days
export const CSRF_TOKEN_MAX_AGE_SECONDS = REFRESH_TOKEN_MAX_AGE_SECONDS;
export const SESSION_META_MAX_AGE_SECONDS = REFRESH_TOKEN_MAX_AGE_SECONDS;

export const IDLE_TIMEOUT_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
export const ABSOLUTE_TIMEOUT_MS = 1000 * 60 * 60 * 24 * 90; // 90 days

export const getAuthCookieSecure = () => process.env.NODE_ENV === 'production';
