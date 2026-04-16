import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server/requireAuth';
import { getAuthorizedQuestForCompletion } from '@/lib/server/resourceAccess';

export const dynamic = 'force-dynamic';

// クエスト完了API（子が「やったよ」を押す）
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await context.params;

		const { user, errorResponse } = await requireAuth(req, {
			authErrorMessage: 'ユーザー認証に失敗しました',
		});
		if (errorResponse) return errorResponse;

		const { quest, status, error } = await getAuthorizedQuestForCompletion(id, user);
		if (!quest) {
			return NextResponse.json({ error }, { status: status! });
		}

		// クエストを完了状態にする
		const updated = await prisma.questHistory.update({
			where: { id },
			data: {
				completed: true,
				completedAt: new Date(),
				completedBy: user.id,
			},
		});

		return NextResponse.json({ message: 'クエストを完了しました', quest: updated });
	} catch (error) {
		console.error('クエスト完了エラー:', error);
		return NextResponse.json({ error: 'クエストの完了に失敗しました' }, { status: 500 });
	}
}
