import { NextRequest, NextResponse } from 'next/server';
import { startOfDay, endOfDay, addHours } from 'date-fns';
import { prisma } from '@/lib/prisma';

// クエストを取得
export const GET = async (req: NextRequest) => {
	try {
		const { searchParams } = new URL(req.url);
		const childId = searchParams.get('childId');

		if (!childId) {
			return NextResponse.json({ error: 'childIdが必要です' }, { status: 400 });
		}

		// 現在時刻をJSTで扱うため、9時間進める
		const now = addHours(new Date(), 9);

		// JSTでの当日の始まりと終わり（UTCに戻すため -9時間）
		const jstStart = addHours(startOfDay(now), -9);
		const jstEnd = addHours(endOfDay(now), -9);

		console.log('JST Start (UTC):', jstStart.toISOString());
		console.log('JST End (UTC):', jstEnd.toISOString());

		const quests = await prisma.questHistory.findMany({
			where: {
				childUserId: childId,
				createdAt: {
					gte: jstStart,
					lte: jstEnd,
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

		return NextResponse.json(quests);
	} catch (error) {
		console.error('クエスト一覧取得エラー:', error);
		return NextResponse.json({ error: 'クエスト一覧の取得に失敗しました' }, { status: 500 });
	}
};
