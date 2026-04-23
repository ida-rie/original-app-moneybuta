import { NextRequest, NextResponse } from 'next/server';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/prisma/supabaseCreateClient';
import { ACCESS_TOKEN_COOKIE_NAME, CSRF_TOKEN_COOKIE_NAME, SESSION_META_COOKIE_NAME } from '@/lib/auth/cookieConfig';
import { isMutationMethod } from '@/lib/auth/csrf';
import { decodeSessionMeta, isSessionExpired } from '@/lib/auth/sessionMeta';

type AuthResult =
	| {
			user: User;
			errorResponse: null;
	  }
	| {
			user: null;
			errorResponse: NextResponse;
	  };

export const requireAuth = async (
	req: Request | NextRequest,
	options?: {
		missingTokenMessage?: string;
		authErrorMessage?: string;
	}
): Promise<AuthResult> => {
	const bearerToken = req.headers.get('Authorization')?.replace('Bearer ', '');
	const cookieHeader = req.headers.get('cookie') ?? '';
	const cookies = Object.fromEntries(
		cookieHeader
			.split(';')
			.map((part) => part.trim())
			.filter(Boolean)
			.map((part) => {
				const idx = part.indexOf('=');
				if (idx === -1) return [part, ''];
				return [part.slice(0, idx), part.slice(idx + 1)];
			})
	);
	const cookieToken = cookies[ACCESS_TOKEN_COOKIE_NAME];
	const accessToken = cookieToken || bearerToken;
	const usingCookieAuth = Boolean(cookieToken);
	const method = req.method.toUpperCase();

	if (usingCookieAuth && isMutationMethod(method)) {
		const csrfCookie = cookies[CSRF_TOKEN_COOKIE_NAME];
		const csrfHeader = req.headers.get('x-csrf-token');
		if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
			return {
				user: null,
				errorResponse: NextResponse.json({ error: 'CSRFトークンが不正です' }, { status: 403 }),
			};
		}
	}

	if (usingCookieAuth) {
		const sessionMeta = decodeSessionMeta(cookies[SESSION_META_COOKIE_NAME]);
		if (!sessionMeta || isSessionExpired(sessionMeta)) {
			return {
				user: null,
				errorResponse: NextResponse.json({ error: 'セッション有効期限が切れています' }, { status: 401 }),
			};
		}
	}

	if (!accessToken) {
		return {
			user: null,
			errorResponse: NextResponse.json(
				{ error: options?.missingTokenMessage ?? '認証情報がありません' },
				{ status: 401 }
			),
		};
	}

	const {
		data: { user },
		error,
	} = await supabase.auth.getUser(accessToken);

	if (error || !user) {
		return {
			user: null,
			errorResponse: NextResponse.json(
				{ error: options?.authErrorMessage ?? '認証エラー' },
				{ status: 401 }
			),
		};
	}

	return {
		user,
		errorResponse: null,
	};
};
