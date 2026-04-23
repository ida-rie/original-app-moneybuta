import crypto from 'crypto';
import { ABSOLUTE_TIMEOUT_MS, IDLE_TIMEOUT_MS } from '@/lib/auth/cookieConfig';

type SessionMeta = {
	iat: number;
	lat: number;
};

const SESSION_META_SECRET = process.env.SESSION_META_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

const sign = (payload: string) => {
	if (!SESSION_META_SECRET) {
		throw new Error('SESSION_META_SECRET もしくは SUPABASE_SERVICE_ROLE_KEY が必要です');
	}
	return crypto.createHmac('sha256', SESSION_META_SECRET).update(payload).digest('hex');
};

const toBase64Url = (value: string) => Buffer.from(value, 'utf8').toString('base64url');
const fromBase64Url = (value: string) => Buffer.from(value, 'base64url').toString('utf8');

export const encodeSessionMeta = (meta: SessionMeta) => {
	const payload = toBase64Url(JSON.stringify(meta));
	const signature = sign(payload);
	return `${payload}.${signature}`;
};

export const decodeSessionMeta = (raw: string | undefined | null): SessionMeta | null => {
	if (!raw) return null;
	const [payload, signature] = raw.split('.');
	if (!payload || !signature) return null;

	let expected: string;
	try {
		expected = sign(payload);
	} catch {
		return null;
	}
	if (signature.length !== expected.length) return null;
	if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

	try {
		const parsed = JSON.parse(fromBase64Url(payload)) as Partial<SessionMeta>;
		if (typeof parsed.iat !== 'number' || typeof parsed.lat !== 'number') return null;
		return { iat: parsed.iat, lat: parsed.lat };
	} catch {
		return null;
	}
};

export const createInitialSessionMeta = () => {
	const now = Date.now();
	return { iat: now, lat: now };
};

export const touchSessionMeta = (meta: SessionMeta) => ({
	iat: meta.iat,
	lat: Date.now(),
});

export const isSessionExpired = (meta: SessionMeta, now = Date.now()) => {
	const idleExpired = now - meta.lat > IDLE_TIMEOUT_MS;
	const absoluteExpired = now - meta.iat > ABSOLUTE_TIMEOUT_MS;
	return idleExpired || absoluteExpired;
};
