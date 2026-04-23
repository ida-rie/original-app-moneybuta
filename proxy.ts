import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ACCESS_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME } from '@/lib/auth/cookieConfig';

export const proxy = (req: NextRequest) => {
	const { pathname } = req.nextUrl;

	// 認証が必要なパス一覧
	const protectedPaths = ['/', '/mypage', '/quest', '/settings'];
	const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

	// 対象外のパスならスルー
	if (!isProtected) return NextResponse.next();

	// cookie から access/refresh token を取得
	const accessToken = req.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
	const refreshToken = req.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

	// トークンがなければサインインへリダイレクト
	if (!accessToken && !refreshToken) {
		const url = req.nextUrl.clone();
		url.pathname = '/signin';
		return NextResponse.redirect(url);
	}

	return NextResponse.next();
};

// proxyを有効にするパス
export const config = {
	matcher: ['/', '/mypage/:path*', '/quest/:path*', '/settings/:path*'],
};
