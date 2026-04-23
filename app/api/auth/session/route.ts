import { NextResponse } from 'next/server';
import {
	ACCESS_TOKEN_COOKIE_NAME,
	ACCESS_TOKEN_MAX_AGE_SECONDS,
	CSRF_TOKEN_COOKIE_NAME,
	CSRF_TOKEN_MAX_AGE_SECONDS,
	REFRESH_TOKEN_COOKIE_NAME,
	REFRESH_TOKEN_MAX_AGE_SECONDS,
	SESSION_META_COOKIE_NAME,
	SESSION_META_MAX_AGE_SECONDS,
	getAuthCookieSecure,
} from '@/lib/auth/cookieConfig';
import { supabase } from '@/lib/prisma/supabaseCreateClient';
import { createCsrfToken } from '@/lib/auth/csrf';
import { createInitialSessionMeta, encodeSessionMeta } from '@/lib/auth/sessionMeta';

type SessionPayload = {
	accessToken?: string;
	refreshToken?: string;
};

export async function POST(req: Request) {
	try {
		const body: SessionPayload = await req.json();
		const accessToken = body.accessToken?.trim();
		const refreshToken = body.refreshToken?.trim();

		if (!accessToken || !refreshToken) {
			return NextResponse.json(
				{ error: 'accessToken と refreshToken が必要です' },
				{ status: 400 }
			);
		}

		const {
			data: { user },
			error,
		} = await supabase.auth.getUser(accessToken);
		if (error || !user) {
			return NextResponse.json({ error: '無効な認証情報です' }, { status: 401 });
		}

		const res = NextResponse.json({ ok: true }, { status: 200 });
		const secure = getAuthCookieSecure();
		const csrfToken = createCsrfToken();
		const sessionMeta = encodeSessionMeta(createInitialSessionMeta());

		res.cookies.set({
			name: ACCESS_TOKEN_COOKIE_NAME,
			value: accessToken,
			httpOnly: true,
			secure,
			sameSite: 'lax',
			path: '/',
			maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
		});
		res.cookies.set({
			name: REFRESH_TOKEN_COOKIE_NAME,
			value: refreshToken,
			httpOnly: true,
			secure,
			sameSite: 'lax',
			path: '/',
			maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
		});
		res.cookies.set({
			name: CSRF_TOKEN_COOKIE_NAME,
			value: csrfToken,
			httpOnly: false,
			secure,
			sameSite: 'lax',
			path: '/',
			maxAge: CSRF_TOKEN_MAX_AGE_SECONDS,
		});
		res.cookies.set({
			name: SESSION_META_COOKIE_NAME,
			value: sessionMeta,
			httpOnly: true,
			secure,
			sameSite: 'lax',
			path: '/',
			maxAge: SESSION_META_MAX_AGE_SECONDS,
		});

		return res;
	} catch (error) {
		console.error('セッションCookie設定エラー:', error);
		return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
	}
}
