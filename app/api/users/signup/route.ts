import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type CreateUserRequest = {
	authUserId: string;
	email: string;
	name: string;
	role: string;
	parentId?: string;
	iconUrl?: string;
};

// 新しいユーザーをUsersテーブルに登録するAPI
export const POST = async (req: Request) => {
	try {
		const body: CreateUserRequest = await req.json();

		const user = await prisma.user.create({
			data: {
				authUserId: body.authUserId,
				email: body.email,
				name: body.name,
				role: body.role,
				parentId: body.parentId,
				iconUrl: body.iconUrl,
			},
		});

		return NextResponse.json(user, { status: 201 });
	} catch (error) {
		console.error('ユーザー作成エラー:', error);
		return NextResponse.json({ error: 'ユーザーの作成に失敗しました' }, { status: 500 });
	}
};
