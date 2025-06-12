import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ここでしか使わないように！
const supabase = createClient(
	process.env.SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY! // server only
);

type updateUserRequest = {
	email: string;
	name: string;
	password: string;
	iconUrl: string;
};

// ユーザー情報の取得
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
	try {
		const { id } = params;
		const user = await prisma.user.findUnique({
			where: { id },
			include: {
				children: true, // 子アカウントを一緒に取得
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
}

// ユーザー情報の更新
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
	try {
		const { id } = params;
		const body: updateUserRequest = await req.json();

		// トークンを確認
		const accessToken = req.headers.get('authorization')?.replace('Bearer ', '');
		if (!accessToken) {
			return NextResponse.json({ error: '認証情報がありません' }, { status: 401 });
		}

		// Supabaseのセッションを取得
		const {
			data: { user },
			error: sessionError,
		} = await supabase.auth.getUser(accessToken);

		if (sessionError || !user) {
			return NextResponse.json({ error: '認証エラー' }, { status: 401 });
		}

		// 自分自身 or 子アカウントかをチェック
		const targetUser = await prisma.user.findUnique({ where: { id } });
		if (!targetUser) {
			return NextResponse.json({ error: '対象ユーザーが存在しません' }, { status: 404 });
		}

		const isOwnAccount = user.id === id;
		const isChildOfCurrentUser = targetUser.parentId === user.id;

		if (!isOwnAccount && !isChildOfCurrentUser) {
			return NextResponse.json({ error: '権限がありません' }, { status: 403 });
		}

		// ① Supabase認証情報（email/password）を更新
		if (body.email || body.password) {
			const updateParams: { email?: string; password?: string } = {};
			if (body.email) updateParams.email = body.email;
			if (body.password) updateParams.password = body.password;

			const { error: updateAuthError } = await supabase.auth.admin.updateUserById(id, updateParams);

			if (updateAuthError) {
				console.error('auth更新失敗:', updateAuthError);
				return NextResponse.json({ error: '認証情報の更新に失敗しました' }, { status: 500 });
			}
		}

		// ② アプリ内のユーザー情報（name/email/icon）を更新
		let updatedUser;

		if (isOwnAccount && targetUser.role === 'parent') {
			updatedUser = await prisma.user.update({
				where: { id },
				data: {
					...(body.name && { name: body.name }),
					...(body.iconUrl && { iconUrl: body.iconUrl }),
					...(body.email && { email: body.email }),
				},
				include: {
					children: true,
				},
			});
		} else {
			updatedUser = await prisma.user.update({
				where: { id },
				data: {
					...(body.name && { name: body.name }),
					...(body.iconUrl && { iconUrl: body.iconUrl }),
					...(body.email && { email: body.email }),
				},
				include: {
					children: true, // ← ここを追加
				},
			});
		}

		return NextResponse.json(updatedUser, { status: 200 });
	} catch (error) {
		console.error('ユーザー取得エラー:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

// ユーザー情報の削除
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
	try {
		const { id } = params;

		const accessToken = req.headers.get('authorization')?.replace('Bearer ', '');
		if (!accessToken) {
			return NextResponse.json({ error: '認証情報がありません' }, { status: 401 });
		}

		const {
			data: { user: authUser },
			error: sessionError,
		} = await supabase.auth.getUser(accessToken);

		if (sessionError || !authUser) {
			return NextResponse.json({ error: '認証エラー' }, { status: 401 });
		}

		const requestingUser = await prisma.user.findUnique({ where: { id: authUser.id } });
		if (!requestingUser || requestingUser.role !== 'parent') {
			return NextResponse.json({ error: '親アカウントのみ削除可能です' }, { status: 403 });
		}

		const targetUser = await prisma.user.findUnique({ where: { id } });
		if (!targetUser) {
			return NextResponse.json({ error: '削除対象ユーザーが見つかりません' }, { status: 404 });
		}

		// 自分自身を削除する場合（=親自身）
		if (authUser.id === id) {
			// ① 子ユーザーのIDを先に取得
			const childUsers = await prisma.user.findMany({
				where: { parentId: id },
				select: { id: true },
			});

			// ② 認証情報（Supabase Auth）から削除
			for (const child of childUsers) {
				const { error } = await supabase.auth.admin.deleteUser(child.id);
				if (error) console.error(`子アカウント（${child.id}）の認証削除失敗:`, error);
			}

			// ③ DBから削除（prisma）
			await prisma.user.deleteMany({
				where: { parentId: id },
			});

			// ④ 親アカウントも削除（認証とDB）
			const { error: parentDeleteError } = await supabase.auth.admin.deleteUser(id);
			if (parentDeleteError) {
				console.error('親ユーザー削除エラー:', parentDeleteError);
			}
			await prisma.user.delete({ where: { id } });

			return NextResponse.json(
				{ message: '親アカウントと子アカウントを削除しました' },
				{ status: 200 }
			);
		}

		// 自分の子どもだけを削除する場合
		if (targetUser.parentId !== authUser.id) {
			return NextResponse.json(
				{ error: 'このユーザーを削除する権限がありません' },
				{ status: 403 }
			);
		}

		// Supabaseの認証情報も削除
		const { error: childDeleteAuthError } = await supabase.auth.admin.deleteUser(id);
		if (childDeleteAuthError) {
			console.error('子アカウント認証削除失敗:', childDeleteAuthError);
			return NextResponse.json({ error: '認証情報の削除に失敗しました' }, { status: 500 });
		}

		// DBから削除
		await prisma.user.delete({ where: { id } });

		return NextResponse.json({ message: '子アカウントを削除しました' }, { status: 200 });
	} catch (error) {
		console.error('削除中のエラー:', error);
		return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
	}
}
