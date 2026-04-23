import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server/requireAuth';

export async function GET(req: NextRequest) {
	try {
		const { user: authUser, errorResponse } = await requireAuth(req);
		if (errorResponse) return errorResponse;

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

		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		return NextResponse.json(user, { status: 200 });
	} catch (error) {
		console.error('認証ユーザー取得エラー:', error);
		return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
	}
}
