import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
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
import { createCsrfToken } from '@/lib/auth/csrf';
import { decodeSessionMeta, encodeSessionMeta, isSessionExpired, touchSessionMeta } from '@/lib/auth/sessionMeta';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
	try {
		const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;
		const rawMeta = req.cookies.get(SESSION_META_COOKIE_NAME)?.value;
		if (!refreshToken) {
			return NextResponse.json({ error: 'refresh token がありません' }, { status: 401 });
		}
		const meta = decodeSessionMeta(rawMeta);
		if (!meta || isSessionExpired(meta)) {
			const denied = NextResponse.json({ error: 'セッション有効期限が切れています' }, { status: 401 });
			denied.cookies.delete(ACCESS_TOKEN_COOKIE_NAME);
			denied.cookies.delete(REFRESH_TOKEN_COOKIE_NAME);
			denied.cookies.delete(CSRF_TOKEN_COOKIE_NAME);
			denied.cookies.delete(SESSION_META_COOKIE_NAME);
			return denied;
		}

		const supabase = createClient(supabaseUrl, supabaseAnonKey, {
			auth: { persistSession: false, autoRefreshToken: false },
		});
		const {
			data: { session },
			error,
		} = await supabase.auth.refreshSession({ refresh_token: refreshToken });

		if (error || !session?.access_token || !session.refresh_token) {
			const denied = NextResponse.json({ error: 'セッション更新に失敗しました' }, { status: 401 });
			denied.cookies.delete(ACCESS_TOKEN_COOKIE_NAME);
			denied.cookies.delete(REFRESH_TOKEN_COOKIE_NAME);
			denied.cookies.delete(CSRF_TOKEN_COOKIE_NAME);
			denied.cookies.delete(SESSION_META_COOKIE_NAME);
			return denied;
		}

		const res = NextResponse.json({ ok: true }, { status: 200 });
		const secure = getAuthCookieSecure();
		const csrfToken = req.cookies.get(CSRF_TOKEN_COOKIE_NAME)?.value ?? createCsrfToken();
		const nextMeta = encodeSessionMeta(touchSessionMeta(meta));
		res.cookies.set({
			name: ACCESS_TOKEN_COOKIE_NAME,
			value: session.access_token,
			httpOnly: true,
			secure,
			sameSite: 'lax',
			path: '/',
			maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
		});
		res.cookies.set({
			name: REFRESH_TOKEN_COOKIE_NAME,
			value: session.refresh_token,
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
			value: nextMeta,
			httpOnly: true,
			secure,
			sameSite: 'lax',
			path: '/',
			maxAge: SESSION_META_MAX_AGE_SECONDS,
		});
		return res;
	} catch (error) {
		console.error('セッションリフレッシュエラー:', error);
		return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
	}
}
