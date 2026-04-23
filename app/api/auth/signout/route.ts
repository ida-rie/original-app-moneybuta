import { NextResponse } from 'next/server';
import {
	ACCESS_TOKEN_COOKIE_NAME,
	CSRF_TOKEN_COOKIE_NAME,
	REFRESH_TOKEN_COOKIE_NAME,
	SESSION_META_COOKIE_NAME,
} from '@/lib/auth/cookieConfig';

export async function POST() {
	const res = NextResponse.json({ ok: true }, { status: 200 });
	res.cookies.delete(ACCESS_TOKEN_COOKIE_NAME);
	res.cookies.delete(REFRESH_TOKEN_COOKIE_NAME);
	res.cookies.delete(CSRF_TOKEN_COOKIE_NAME);
	res.cookies.delete(SESSION_META_COOKIE_NAME);
	return res;
}
