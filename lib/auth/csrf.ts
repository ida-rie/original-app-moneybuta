import crypto from 'crypto';

export const createCsrfToken = () => crypto.randomBytes(32).toString('hex');

export const isMutationMethod = (method: string) =>
	['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
