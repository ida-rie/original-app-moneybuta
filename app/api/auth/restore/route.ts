import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/prisma/supabaseCreateClient';
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

const clearAuthCookies = (res: NextResponse) => {
	res.cookies.delete(ACCESS_TOKEN_COOKIE_NAME);
	res.cookies.delete(REFRESH_TOKEN_COOKIE_NAME);
	res.cookies.delete(CSRF_TOKEN_COOKIE_NAME);
	res.cookies.delete(SESSION_META_COOKIE_NAME);
};

const getAppUser = async (accessToken: string) => {
	const {
		data: { user: authUser },
		error,
	} = await supabase.auth.getUser(accessToken);

	if (error || !authUser) return null;

	const user = await prisma.user.findUnique({
		where: { id: authUser.id },
		select: {
			id: true,
			email: true,
			loginId: true,
			name: true,
			role: true,
			iconUrl: true,
			children: {
				select: {
					id: true,
					email: true,
					loginId: true,
					name: true,
					role: true,
					iconUrl: true,
				},
			},
		},
	});

	return user;
};

export async function GET(req: NextRequest) {
	try {
		const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
		const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;
		const csrfToken = req.cookies.get(CSRF_TOKEN_COOKIE_NAME)?.value ?? createCsrfToken();
		const sessionMetaRaw = req.cookies.get(SESSION_META_COOKIE_NAME)?.value;
		const sessionMeta = decodeSessionMeta(sessionMetaRaw);

		if (!sessionMeta || isSessionExpired(sessionMeta)) {
			const denied = NextResponse.json({ error: 'セッション有効期限が切れています' }, { status: 401 });
			clearAuthCookies(denied);
			return denied;
		}

		const secure = getAuthCookieSecure();
		const nextMeta = encodeSessionMeta(touchSessionMeta(sessionMeta));

		if (accessToken) {
			const user = await getAppUser(accessToken);
			if (user) {
				const ok = NextResponse.json(user, { status: 200 });
				ok.cookies.set({
					name: CSRF_TOKEN_COOKIE_NAME,
					value: csrfToken,
					httpOnly: false,
					secure,
					sameSite: 'lax',
					path: '/',
					maxAge: CSRF_TOKEN_MAX_AGE_SECONDS,
				});
				ok.cookies.set({
					name: SESSION_META_COOKIE_NAME,
					value: nextMeta,
					httpOnly: true,
					secure,
					sameSite: 'lax',
					path: '/',
					maxAge: SESSION_META_MAX_AGE_SECONDS,
				});
				return ok;
			}
		}

		if (!refreshToken) {
			const denied = NextResponse.json({ error: '認証情報がありません' }, { status: 401 });
			clearAuthCookies(denied);
			return denied;
		}

		const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
			auth: { persistSession: false, autoRefreshToken: false },
		});
		const {
			data: { session },
			error,
		} = await supabaseAnon.auth.refreshSession({ refresh_token: refreshToken });

		if (error || !session?.access_token || !session.refresh_token) {
			const denied = NextResponse.json({ error: 'セッション更新に失敗しました' }, { status: 401 });
			clearAuthCookies(denied);
			return denied;
		}

		const user = await getAppUser(session.access_token);
		if (!user) {
			const denied = NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 401 });
			clearAuthCookies(denied);
			return denied;
		}

		const ok = NextResponse.json(user, { status: 200 });
		ok.cookies.set({
			name: ACCESS_TOKEN_COOKIE_NAME,
			value: session.access_token,
			httpOnly: true,
			secure,
			sameSite: 'lax',
			path: '/',
			maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
		});
		ok.cookies.set({
			name: REFRESH_TOKEN_COOKIE_NAME,
			value: session.refresh_token,
			httpOnly: true,
			secure,
			sameSite: 'lax',
			path: '/',
			maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
		});
		ok.cookies.set({
			name: CSRF_TOKEN_COOKIE_NAME,
			value: csrfToken,
			httpOnly: false,
			secure,
			sameSite: 'lax',
			path: '/',
			maxAge: CSRF_TOKEN_MAX_AGE_SECONDS,
		});
		ok.cookies.set({
			name: SESSION_META_COOKIE_NAME,
			value: nextMeta,
			httpOnly: true,
			secure,
			sameSite: 'lax',
			path: '/',
			maxAge: SESSION_META_MAX_AGE_SECONDS,
		});
		return ok;
	} catch (error) {
		console.error('セッション復元エラー:', error);
		return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
	}
}
