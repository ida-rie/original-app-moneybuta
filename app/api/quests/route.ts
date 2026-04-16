import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTodayUtc } from '@/lib/utils/getTodayUtc';
import { requireAuth } from '@/lib/server/requireAuth';
import { canAccessChild } from '@/lib/server/childAccess';

export const dynamic = 'force-dynamic';

// クエストの履歴を取得
export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const childId = searchParams.get('childId');

		if (!childId) {
			return NextResponse.json({ error: 'childIdが必要です' }, { status: 400 });
		}

		const { user, errorResponse } = await requireAuth(req);
		if (errorResponse) return errorResponse;

		const hasAccess = await canAccessChild(user, childId);
		if (!hasAccess) {
			return NextResponse.json({ error: '権限がありません' }, { status: 403 });
		}

		// 日本時間を明示的に指定してUTCに変換
		const { start, end } = getTodayUtc();

		const quests = await prisma.questHistory.findMany({
			where: {
				childUserId: childId,
				questDate: {
					gte: start,
					lte: end,
				},
			},
			orderBy: { createdAt: 'desc' },
			select: {
				id: true,
				title: true,
				reward: true,
				completed: true,
				completedAt: true,
				approved: true,
				approvedAt: true,
			},
		});

		if (!quests) {
			return NextResponse.json({ message: 'データが見つかりません', data: null }, { status: 200 });
		}

		return NextResponse.json(quests);
	} catch (error) {
		console.error('クエスト一覧取得エラー:', error);
		return NextResponse.json({ error: 'クエスト一覧の取得に失敗しました' }, { status: 500 });
	}
}
