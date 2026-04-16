import { NextResponse } from 'next/server';
import { format } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { utcToZonedTime } from 'date-fns-tz';
import { getMonthUtc } from '@/lib/utils/getMonthUtc';
import { requireAuth } from '@/lib/server/requireAuth';

export const dynamic = 'force-dynamic';

type BreakdownItemType = {
	date: string;
	total: number;
	items: { content: string; amount: number }[];
};

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const childId = searchParams.get('childId');
	const month = searchParams.get('month');

	if (!childId || !month) {
		return NextResponse.json({ error: 'childIdとmonthは必須です' }, { status: 400 });
	}

	const { errorResponse } = await requireAuth(req, {
		missingTokenMessage: 'アクセストークンが必要です',
	});
	if (errorResponse) return errorResponse;

	try {
		// 日本時間を明示的に指定してUTCに変換
		const { start, end } = getMonthUtc(month);

		const basicAmount = await prisma.basicAmount.findFirst({
			where: {
				childUserId: childId,
				month: { lte: month }, // 指定月以前
			},
			orderBy: { month: 'desc' },
		});

		const questHistories = await prisma.questHistory.findMany({
			where: {
				childUserId: childId,
				approved: true,
				approvedAt: {
					gte: start,
					lte: end,
				},
			},
			orderBy: {
				approvedAt: 'asc',
			},
		});

		// JST 日付でグループ化
		const groupedByDate: Record<string, typeof questHistories> = {};
		questHistories.forEach((q) => {
			const jstDate = utcToZonedTime(q.approvedAt!, 'Asia/Tokyo');
			const key = format(jstDate, 'yyyy-MM-dd');
			(groupedByDate[key] ??= []).push(q);
		});

		// 月初日（"YYYY-MM-01"）は basicAmount がある限り必ず breakdown に含める
		const monthStart = `${month}-01`;
		const allDates = [
			...new Set([...(basicAmount ? [monthStart] : []), ...Object.keys(groupedByDate)]),
		].sort();

		let runningTotal = 0;

		const breakdown: BreakdownItemType[] = allDates.map((date) => {
			const quests = groupedByDate[date] ?? [];
			const dailySum = quests.reduce((s, q) => s + q.reward, 0);

			// 日別アイテム
			const items = quests.map((q) => ({
				content: q.title,
				amount: q.reward,
			}));

			// 月初に基本金額を加算
			if (date === monthStart && basicAmount) {
				items.unshift({
					content: '基本金額',
					amount: basicAmount.basicAmount,
				});
				runningTotal += basicAmount.basicAmount;
			}

			runningTotal += dailySum;

			return { date, total: runningTotal, items };
		});

		const total = breakdown.length
			? breakdown[breakdown.length - 1].total
			: basicAmount?.basicAmount ?? 0;

		return NextResponse.json({
			month,
			basicAmount: basicAmount?.basicAmount ?? 0,
			rewardSum: questHistories.reduce((sum, q) => sum + q.reward, 0),
			totalAmount: total, // ← これが total = breakdownの最後の値、または basicAmount
			breakdown,
		});
	} catch (error) {
		console.error('月次金額取得エラー:', error);
		return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
	}
}
