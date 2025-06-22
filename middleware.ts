// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const middleware = (req: NextRequest) => {
	const { pathname } = req.nextUrl;

	// 認証が必要なパス一覧
	const protectedPaths = ['/', '/mypage', '/quests', '/settings'];
	const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

	// 対象外のパスならスルー
	if (!isProtected) return NextResponse.next();

	// cookie から access_token を取得
	const token = req.cookies.get('access_token')?.value;

	// トークンがなければサインインへリダイレクト
	if (!token) {
		const url = req.nextUrl.clone();
		url.pathname = '/signin';
		return NextResponse.redirect(url);
	}

	return NextResponse.next();
};

// middlewareを有効にするパス
export const config = {
	matcher: ['/', '/mypage/:path*', '/quests/:path*', '/settings/:path*'], // 調整可能
};
