import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';
import { startOfDay, endOfDay, subDays } from 'date-fns';

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

		const supabase = createClient(
			process.env.SUPABASE_URL!,
			process.env.SUPABASE_SERVICE_ROLE_KEY!
		);
		const {
			data: { user },
			error: sessionError,
		} = await supabase.auth.getUser(accessToken);

		if (sessionError || !user) {
			return NextResponse.json({ error: '認証エラー' }, { status: 401 });
		}

		const basicAmount = await prisma.basicAmount.findFirst({
			where: { childUserId: childId },
			orderBy: { createdAt: 'desc' },
		});
		const base = basicAmount?.basicAmount ?? 0;

		const today = new Date();
		const yesterday = subDays(today, 1);
		const todayStart = startOfDay(today);
		const todayEnd = endOfDay(today);
		const yesterdayStart = startOfDay(yesterday);
		const yesterdayEnd = endOfDay(yesterday);

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

		const todayAmount =
			todayReward > 0 ? base + todayReward : yesterdayReward > 0 ? base + yesterdayReward : base;

		const yesterdayAmount = base + yesterdayReward;
		const diff = todayAmount - yesterdayAmount;

		// ✅ 毎日0時台にAmountHistoryに保存（日本時間基準）
		// const now = new Date();
		// const jstHour = (now.getUTCHours() + 9) % 24;

		// if (jstHour === 0 && basicAmount) {
		if (basicAmount) {
			await prisma.amountHistory.upsert({
				where: {
					userId_date: {
						userId: user.id,
						date: startOfDay(today),
					},
				},
				update: {
					totalAmount: base + todayReward,
					childUserId: childId,
					basicAmountId: basicAmount.id,
				},
				create: {
					userId: user.id,
					childUserId: childId,
					basicAmountId: basicAmount.id,
					totalAmount: base + todayReward,
					date: startOfDay(today),
				},
			});
		}

		return NextResponse.json({ todayAmount, yesterdayAmount, diff });
	} catch (error) {
		console.error('金額取得エラー', error);
		return NextResponse.json({ error: '内部サーバーエラー' }, { status: 500 });
	}
}
