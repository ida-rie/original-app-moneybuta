import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/prisma/supabaseCreateClient';
import { requireAuth } from '@/lib/server/requireAuth';

type CreateUserRequest = {
	id?: string; // 親アカウントはクライアントで Auth 作成済みのため id を渡す
	email?: string;
	loginId?: string;
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
		let createdChildAuthUserId: string | null = null;
		let childAuthEmail: string | null = null;
		let childLoginId: string | null = null;

		// 子アカウントはサーバーサイドで Supabase Auth ユーザーを作成（メール確認不要）
		if (body.role === 'child') {
			const { user, errorResponse } = await requireAuth(req);
			if (errorResponse) return errorResponse;

			const requestingUser = await prisma.user.findUnique({
				where: { id: user.id },
				select: { id: true, role: true },
			});

			if (!requestingUser || requestingUser.role !== 'parent') {
				return NextResponse.json(
					{ error: '親アカウントのみ子アカウントを作成できます' },
					{ status: 403 }
				);
			}

			if (!body.parentId || body.parentId !== user.id) {
				return NextResponse.json({ error: 'parentId が不正です' }, { status: 403 });
			}

			if (!body.password) {
				return NextResponse.json({ error: 'パスワードは必須です' }, { status: 400 });
			}

			const normalizedLoginId = body.loginId?.trim() ?? body.email?.split('@')[0]?.trim();
			if (!normalizedLoginId) {
				return NextResponse.json({ error: '子アカウントのユーザーIDは必須です' }, { status: 400 });
			}

			childLoginId = normalizedLoginId;
			const authLocalPart = normalizedLoginId
				.toLowerCase()
				.replace(/[^a-z0-9._-]/g, '-')
				.slice(0, 30);
			childAuthEmail = `${authLocalPart || 'child'}.${crypto.randomUUID()}@child.moneybuta.local`;

			const { data: authData, error: authError } = await supabase.auth.admin.createUser({
				email: childAuthEmail,
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
			createdChildAuthUserId = authData.user.id;
		}

		if (!userId) {
			return NextResponse.json({ error: 'ユーザーIDが取得できませんでした' }, { status: 400 });
		}

		if (body.role === 'parent' && !body.email) {
			return NextResponse.json({ error: 'メールアドレスは必須です' }, { status: 400 });
		}

		try {
			const user = await prisma.user.create({
				data: {
					id: userId,
					email: body.role === 'child' ? childAuthEmail! : body.email!,
					loginId: body.role === 'child' ? childLoginId : null,
					name: body.name,
					role: body.role,
					parentId: body.parentId ?? null,
					iconUrl: body.iconUrl ?? null,
				},
			});

			return NextResponse.json(user, { status: 201 });
		} catch (dbError) {
			if (createdChildAuthUserId) {
				const { error: rollbackError } = await supabase.auth.admin.deleteUser(createdChildAuthUserId);

				if (rollbackError) {
					console.error('子アカウント Auth ロールバック失敗:', rollbackError);
				}
			}

			throw dbError;
		}
	} catch (error) {
		console.error('ユーザー作成エラー:', error);
		return NextResponse.json({ error: 'ユーザーの作成に失敗しました' }, { status: 500 });
	}
}
