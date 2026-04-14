import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/prisma/supabaseCreateClient';

type CreateUserRequest = {
	id?: string; // 親アカウントはクライアントで Auth 作成済みのため id を渡す
	email: string;
	name: string;
	role: string;
	parentId?: string | null;
	iconUrl?: string | null;
	password?: string; // 子アカウントのみ（サーバーサイドで Auth 作成するため必要）
};

// 新しいユーザーをUsersテーブルに登録するAPI
export async function POST(req: Request) {
	try {
		const body: CreateUserRequest = await req.json();

		let userId = body.id;

		// 子アカウントはサーバーサイドで Supabase Auth ユーザーを作成（メール確認不要）
		if (body.role === 'child') {
			if (!body.password) {
				return NextResponse.json({ error: 'パスワードは必須です' }, { status: 400 });
			}

			const { data: authData, error: authError } = await supabase.auth.admin.createUser({
				email: body.email,
				password: body.password,
				email_confirm: true, // 疑似メールなので確認不要
				user_metadata: { name: body.name },
			});

			if (authError || !authData.user) {
				console.error('子アカウント Auth 作成エラー:', authError);
				return NextResponse.json(
					{ error: authError?.message ?? 'Auth ユーザーの作成に失敗しました' },
					{ status: 400 }
				);
			}

			userId = authData.user.id;
		}

		if (!userId) {
			return NextResponse.json({ error: 'ユーザーIDが取得できませんでした' }, { status: 400 });
		}

		const user = await prisma.user.create({
			data: {
				id: userId,
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
