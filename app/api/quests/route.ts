import { NextRequest, NextResponse } from 'next/server';
import { startOfDay, endOfDay } from 'date-fns';
// import { format } from 'date-fns';
import { prisma } from '@/lib/prisma';

// クエストの履歴を取得
export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const childId = searchParams.get('childId');

		if (!childId) {
			return NextResponse.json({ error: 'childIdが必要です' }, { status: 400 });
		}

		// 当日の始まりと終わり
		const start = startOfDay(new Date());
		const end = endOfDay(new Date());

		const quests = await prisma.questHistory.findMany({
			where: {
				childUserId: childId,
				questDate: {
					gte: start,
					lte: end,
				},
			},
			// orderBy: { createdAt: 'desc' },
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
