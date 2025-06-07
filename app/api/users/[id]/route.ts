import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const GET = async (_req: Request, { params }: { params: { id: string } }) => {
	try {
		const user = await prisma.user.findUnique({
			where: { id: params.id },
			include: {
				children: true, // ← 子アカウントを一緒に取得
			},
		});

		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		return NextResponse.json(user, { status: 200 });
	} catch (error) {
		console.error('ユーザー取得エラー:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
};
