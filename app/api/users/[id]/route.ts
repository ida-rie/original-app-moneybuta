import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/prisma/supabaseCreateClient';
import { deleteRelatedUserDataInTx } from '@/lib/prisma/deleteRelatedUserData';
import { requireAuth } from '@/lib/server/requireAuth';
import { canAccessUser } from '@/lib/server/childAccess';

type updateUserRequest = {
	email: string;
	name: string;
	password: string;
	iconUrl: string;
};

const deleteChildAccount = async (childId: string) => {
	const { error: childDeleteAuthError } = await supabase.auth.admin.deleteUser(childId);
	if (childDeleteAuthError) {
		console.error(`子アカウント認証削除失敗: childId=${childId}`, childDeleteAuthError);
		throw new Error(`child_auth_delete_failed:${childId}`);
	}

	await prisma.$transaction(async (tx) => {
		await deleteRelatedUserDataInTx(tx, childId, 'child');
		await tx.user.delete({ where: { id: childId } });
	});
};

const deleteParentAccount = async (parentId: string) => {
	const childUsers = await prisma.user.findMany({
		where: { parentId },
		select: { id: true },
		orderBy: { createdAt: 'asc' },
	});

	for (const child of childUsers) {
		await deleteChildAccount(child.id);
	}

	const { error: parentDeleteAuthError } = await supabase.auth.admin.deleteUser(parentId);
	if (parentDeleteAuthError) {
		console.error(`親ユーザー認証削除失敗: parentId=${parentId}`, parentDeleteAuthError);
		throw new Error(`parent_auth_delete_failed:${parentId}`);
	}

	await prisma.$transaction(async (tx) => {
		await deleteRelatedUserDataInTx(tx, parentId, 'parent');
		await tx.user.delete({ where: { id: parentId } });
	});
};

// ユーザー情報の取得
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await context.params;
		const { user: authUser, errorResponse } = await requireAuth(_req);
		if (errorResponse) return errorResponse;

		const hasAccess = await canAccessUser(authUser, id);
		if (!hasAccess) {
			return NextResponse.json({ error: '権限がありません' }, { status: 403 });
		}

		const shouldIncludeChildren = authUser.id === id;

		const user = await prisma.user.findUnique({
			where: { id },
			select: {
				id: true,
				email: true,
				name: true,
				role: true,
				iconUrl: true,
				children: shouldIncludeChildren
					? {
							select: {
								id: true,
								email: true,
								name: true,
								role: true,
								iconUrl: true,
							},
					  }
					: false,
			},
		});

		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		return NextResponse.json(user, { status: 200 });
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error('ユーザー取得エラー:', error);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

// ユーザー情報の更新
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await context.params;
		const body: updateUserRequest = await req.json();

		const { user, errorResponse } = await requireAuth(req);
		if (errorResponse) return errorResponse;

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

		// 子アカウント自身は名前・アイコンのみ変更可（ID・パスワード変更は親のみ）
		const requestingUser = await prisma.user.findUnique({ where: { id: user.id } });
		if (requestingUser?.role === 'child' && isOwnAccount) {
			if (body.email || body.password) {
				return NextResponse.json(
					{ error: '子アカウントではユーザーIDとパスワードを変更できません' },
					{ status: 403 }
				);
			}
		}

		// ① Supabase認証情報（email/password）を更新
		if (body.email || body.password) {
			const updateParams: { email?: string; password?: string; email_confirm?: boolean } = {};
			if (body.email) updateParams.email = body.email;
			if (body.password) updateParams.password = body.password;
			if (body.email) updateParams.email_confirm = true;

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
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await context.params;

		const { user: authUser, errorResponse } = await requireAuth(req);
		if (errorResponse) return errorResponse;

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
			await deleteParentAccount(id);

			return NextResponse.json(
				{ message: '親アカウントと子アカウントを削除しました' },
				{ status: 200 }
			);
		}

		// 子どもだけを削除する場合（親が操作）
		if (targetUser.parentId !== authUser.id) {
			return NextResponse.json(
				{ error: 'このユーザーを削除する権限がありません' },
				{ status: 403 }
			);
		}

		await deleteChildAccount(id);

		return NextResponse.json({ message: '子アカウントを削除しました' }, { status: 200 });
	} catch (error) {
		console.error('削除中のエラー:', error);
		return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
	}
}
