import { NextRequest, NextResponse } from 'next/server';
import { startOfDay } from 'date-fns';
// import { startOfDay, endOfDay } from 'date-fns';
// import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
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
		// const start = startOfDay(new Date());
		// const end = endOfDay(new Date());
		const today = startOfDay(new Date());

		// // 日本時間を明示的に指定
		// const JAPAN_TZ = 'Asia/Tokyo';
		// const nowInJapan = utcToZonedTime(new Date(), JAPAN_TZ);

		// // 日本時間での当日の開始・終了時刻を取得
		// const startInJapan = startOfDay(nowInJapan);
		// const endInJapan = endOfDay(nowInJapan);

		// // UTCに変換してデータベース検索に使用
		// const start = zonedTimeToUtc(startInJapan, JAPAN_TZ);
		// const end = zonedTimeToUtc(endInJapan, JAPAN_TZ);

		const quests = await prisma.questHistory.findMany({
			where: {
				childUserId: childId,
				questDate: {
					// gte: start,
					// lte: end,
					gte: new Date(`${today.toISOString().slice(0, 10)}T00:00:00.000Z`),
					lte: new Date(`${today.toISOString().slice(0, 10)}T23:59:59.999Z`),
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
