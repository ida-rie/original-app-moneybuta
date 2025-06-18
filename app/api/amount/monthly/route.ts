import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const childId = searchParams.get('childId');
	const month = searchParams.get('month');

	if (!childId || !month) {
		return NextResponse.json({ error: 'childIdとmonthは必須です' }, { status: 400 });
	}

	const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '');

	if (!accessToken) {
		return NextResponse.json({ error: 'アクセストークンが必要です' }, { status: 401 });
	}

	const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

	const {
		data: { user },
		error: sessionError,
	} = await supabase.auth.getUser(accessToken);

	if (sessionError || !user) {
		return NextResponse.json({ error: '認証エラー' }, { status: 401 });
	}

	try {
		const basicAmount = await prisma.basicAmount.findFirst({
			where: {
				childUserId: childId,
				month,
			},
		});

		const questHistories = await prisma.questHistory.findMany({
			where: {
				childUserId: childId,
				approved: true,
				approvedAt: {
					gte: new Date(`${month}-01T00:00:00.000Z`),
					lte: new Date(`${month}-31T23:59:59.999Z`),
				},
			},
			orderBy: {
				approvedAt: 'asc',
			},
		});

		const groupedByDate: Record<string, typeof questHistories> = {};
		questHistories.forEach((q) => {
			const date = format(new Date(q.approvedAt!), 'yyyy-MM-dd');
			if (!groupedByDate[date]) groupedByDate[date] = [];
			groupedByDate[date].push(q);
		});

		let runningTotal = 0;

		const breakdown = Object.entries(groupedByDate)
			.sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
			.map(([date, quests], index) => {
				const dailyTotal = quests.reduce((sum, q) => sum + q.reward, 0);

				const items = quests.map((q) => ({
					content: q.title,
					amount: q.reward,
				}));

				// ✅ 初日のみ基本金額を加算
				if (index === 0 && basicAmount?.basicAmount) {
					items.unshift({
						content: '基本金額',
						amount: basicAmount.basicAmount,
					});
					runningTotal += basicAmount.basicAmount;
				}

				runningTotal += dailyTotal;

				return {
					date,
					total: runningTotal,
					items,
				};
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
