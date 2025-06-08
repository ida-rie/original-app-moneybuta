import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type CreateUserRequest = {
	id: string;
	email: string;
	name: string;
	role: string;
	parentId?: string | null;
	iconUrl?: string | null;
};

// 新しいユーザーをUsersテーブルに登録するAPI
export async function POST(req: Request) {
	try {
		const body: CreateUserRequest = await req.json();

		const user = await prisma.user.create({
			data: {
				id: body.id,
				email: body.email,
				name: body.name,
				role: body.role,
				parentId: body.parentId ?? null,
				iconUrl: body.iconUrl ?? null,
			},
		});

		return NextResponse.json(user, { status: 201 });
	} catch (error) {
		console.error('ユーザー作成エラー:', error);
		return NextResponse.json({ error: 'ユーザーの作成に失敗しました' }, { status: 500 });
	}
}
