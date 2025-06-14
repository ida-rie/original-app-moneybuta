import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';
import { startOfDay, endOfDay, subDays } from 'date-fns';

// ここでしか使わないように！
const supabase = createClient(
	process.env.SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY! // server only
);

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const childId = searchParams.get('childId');

		if (!childId) {
			return NextResponse.json({ error: 'childIdが必要です' }, { status: 400 });
		}

		const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '');
		if (!accessToken) {
			return NextResponse.json({ error: 'アクセストークンが必要です' }, { status: 401 });
		}
		const {
			data: { user },
			error: sessionError,
		} = await supabase.auth.getUser(accessToken);

		if (sessionError || !user) {
			return NextResponse.json({ error: '認証エラー' }, { status: 401 });
		}

		// 基本金額の取得（最新1件）
		const basicAmount = await prisma.basicAmount.findFirst({
			where: { childUserId: childId },
			orderBy: { createdAt: 'desc' },
		});
		const base = basicAmount?.basicAmount ?? 0;

		// 日付範囲
		const today = new Date();
		const yesterday = subDays(today, 1);
		const todayStart = startOfDay(today);
		const todayEnd = endOfDay(today);
		const yesterdayStart = startOfDay(yesterday);
		const yesterdayEnd = endOfDay(yesterday);

		// クエスト履歴（今日）
		const todayHistories = await prisma.questHistory.findMany({
			where: {
				approved: true,
				childUserId: childId,
				approvedAt: {
					gte: todayStart,
					lte: todayEnd,
				},
			},
		});
		const todayReward = todayHistories.reduce((sum, q) => sum + q.reward, 0);

		// クエスト履歴（昨日）
		const yesterdayHistories = await prisma.questHistory.findMany({
			where: {
				approved: true,
				childUserId: childId,
				approvedAt: {
					gte: yesterdayStart,
					lte: yesterdayEnd,
				},
			},
		});
		const yesterdayReward = yesterdayHistories.reduce((sum, q) => sum + q.reward, 0);

		// 表示用 todayAmount ロジック
		const todayAmount =
			todayReward > 0 ? base + todayReward : yesterdayReward > 0 ? base + yesterdayReward : base;

		const yesterdayAmount = base + yesterdayReward;
		const diff = todayAmount - yesterdayAmount;

		return NextResponse.json({ todayAmount, yesterdayAmount, diff });
	} catch (error) {
		console.error('金額取得エラー', error);
		return NextResponse.json({ error: '内部サーバーエラー' }, { status: 500 });
	}
}
