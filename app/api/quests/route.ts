import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTodayUtc } from '@/lib/utils/getTodayUtc';
import { requireAuth } from '@/lib/server/requireAuth';
import { canAccessChild } from '@/lib/server/childAccess';
import { logApiPerf } from '@/lib/server/perf';

export const dynamic = 'force-dynamic';

// クエストの履歴を取得
export async function GET(req: NextRequest) {
	const startedAt = Date.now();
	let authAt = startedAt;
	let authzAt = startedAt;
	let dbAt = startedAt;

	try {
		const { searchParams } = new URL(req.url);
		const childId = searchParams.get('childId');

		if (!childId) {
			return NextResponse.json({ error: 'childIdが必要です' }, { status: 400 });
		}

		const { user, errorResponse } = await requireAuth(req);
		authAt = Date.now();
		if (errorResponse) return errorResponse;

		// 日本時間を明示的に指定してUTCに変換
		const { start, end } = getTodayUtc();

		const quests = await prisma.questHistory.findMany({
			where: {
				childUserId: childId,
				childUser: {
					role: 'child',
					OR: [{ id: user.id }, { parentId: user.id }],
				},
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
		authzAt = Date.now();
		dbAt = authzAt;

		// 空結果は「権限なし」か「データなし」か判定が必要
		if (quests.length === 0) {
			const hasAccess = await canAccessChild(user, childId);
			dbAt = Date.now();
			if (!hasAccess) {
				return NextResponse.json({ error: '権限がありません' }, { status: 403 });
			}
			logApiPerf('GET /api/quests', {
				authMs: authAt - startedAt,
				authzMs: authzAt - authAt,
				dbMs: dbAt - authzAt,
				totalMs: dbAt - startedAt,
			});
			return NextResponse.json([]);
		}

		logApiPerf('GET /api/quests', {
			authMs: authAt - startedAt,
			authzMs: authzAt - authAt,
			dbMs: dbAt - authzAt,
			totalMs: dbAt - startedAt,
		});

		return NextResponse.json(quests);
	} catch (error) {
		console.error('クエスト一覧取得エラー:', error);
		return NextResponse.json({ error: 'クエスト一覧の取得に失敗しました' }, { status: 500 });
	}
}
