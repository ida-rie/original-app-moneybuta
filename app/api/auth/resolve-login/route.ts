import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type ResolveLoginRequest = {
	loginId?: string;
};

export async function POST(req: Request) {
	try {
		const body: ResolveLoginRequest = await req.json();
		const loginId = body.loginId?.trim();

		if (!loginId) {
			return NextResponse.json({ error: 'loginIdが必要です' }, { status: 400 });
		}

		const childUser = await prisma.user.findUnique({
			where: { loginId },
			select: { email: true, role: true },
		});

		if (!childUser || childUser.role !== 'child') {
			return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
		}

		return NextResponse.json({ email: childUser.email }, { status: 200 });
	} catch (error) {
		console.error('loginId解決エラー:', error);
		return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
	}
}
