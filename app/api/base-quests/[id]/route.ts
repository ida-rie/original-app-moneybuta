import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server/requireAuth';
import { getAuthorizedBaseQuest } from '@/lib/server/resourceAccess';
import { canManageChildAsParent } from '@/lib/server/childAccess';

export const dynamic = 'force-dynamic';

type UpdateBaseQuestRequest = {
	title?: string;
	reward?: number;
	childUserId?: string;
};

// 基本クエストの更新
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await context.params;
		const body: UpdateBaseQuestRequest = await req.json();

		const { user, errorResponse } = await requireAuth(req);
		if (errorResponse) return errorResponse;

		const { baseQuest: existingQuest, status, error } = await getAuthorizedBaseQuest(id, user);
		if (!existingQuest) {
			return NextResponse.json({ error }, { status: status! });
		}
		if (body.childUserId && body.childUserId !== existingQuest.childUserId) {
			const hasAccessToNewChild = await canManageChildAsParent(user, body.childUserId);
			if (!hasAccessToNewChild) {
				return NextResponse.json({ error: '更新先の子アカウントに対する権限がありません' }, { status: 403 });
			}
		}

		// 更新処理
		const updatedQuest = await prisma.baseQuest.update({
			where: { id },
			data: {
				...(body.title && { title: body.title }),
				...(body.reward !== undefined && { reward: body.reward }),
				...(body.childUserId && { childUserId: body.childUserId }),
			},
		});

		return NextResponse.json(updatedQuest, { status: 200 });
	} catch (error) {
		console.error('基本クエスト更新エラー:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

// 基本クエストの削除
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await context.params;

		// 認証トークン取得
		const { user, errorResponse } = await requireAuth(req);
		if (errorResponse) return errorResponse;

		const { baseQuest, status, error } = await getAuthorizedBaseQuest(id, user);
		if (!baseQuest) {
			return NextResponse.json({ error }, { status: status! });
		}

		// ① 関連履歴を先に削除
		await prisma.questHistory.deleteMany({
			where: { baseQuestId: id },
		});

		// ② 基本クエストを削除
		await prisma.baseQuest.delete({
			where: { id },
		});

		return NextResponse.json({ message: 'クエストを削除しました' }, { status: 200 });
	} catch (error) {
		console.error('基本クエスト削除エラー:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
