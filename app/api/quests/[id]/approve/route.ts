import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server/requireAuth';
import { getAuthorizedQuestForApproval } from '@/lib/server/resourceAccess';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await context.params;

		const { user, errorResponse } = await requireAuth(req, {
			authErrorMessage: 'ユーザー認証に失敗しました',
		});
		if (errorResponse) return errorResponse;

		const { quest, status, error } = await getAuthorizedQuestForApproval(id, user);
		if (!quest) {
			return NextResponse.json({ error }, { status: status! });
		}

		// クエストを承認状態にする
		const updated = await prisma.questHistory.update({
			where: { id },
			data: {
				approved: true,
				approvedAt: new Date(),
				approvedBy: user.id,
			},
		});

		return NextResponse.json({ message: 'クエストを承認しました', quest: updated });
	} catch (error) {
		console.error('クエスト承認エラー:', error);
		return NextResponse.json({ error: 'クエストの承認に失敗しました' }, { status: 500 });
	}
}
