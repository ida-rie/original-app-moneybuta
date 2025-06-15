import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';
import { parse, startOfMonth, endOfMonth, format } from 'date-fns';
import type { MonthlyAmountType } from '@/types/MonthlyAmountType';

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const childId = searchParams.get('childId');
		const month = searchParams.get('month'); // 形式: "2025-06"

		if (!childId || !month) {
			return NextResponse.json({ error: 'childIdとmonthが必要です' }, { status: 400 });
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

		const parsedMonth = parse(`${month}-01`, 'yyyy-MM-dd', new Date());
		const start = startOfMonth(parsedMonth);
		const end = endOfMonth(parsedMonth);

		// 基本金額（最新）
		const basicAmount = await prisma.basicAmount.findFirst({
			where: { childUserId: childId },
			orderBy: { createdAt: 'desc' },
		});
		const base = basicAmount?.basicAmount ?? 0;

		// クエスト履歴（その月）
		const questHistories = await prisma.questHistory.findMany({
			where: {
				approved: true,
				childUserId: childId,
				approvedAt: {
					gte: start,
					lte: end,
				},
			},
		});

		// 日別でgrouping
		const breakdownMap: Record<
			string,
			{ total: number; items: { content: string; amount: number }[] }
		> = {};

		for (const q of questHistories) {
			const dateKey = format(q.approvedAt!, 'yyyy-MM-dd');
			if (!breakdownMap[dateKey]) {
				breakdownMap[dateKey] = { total: 0, items: [] };
			}
			breakdownMap[dateKey].total += q.reward;
			breakdownMap[dateKey].items.push({
				content: q.title,
				amount: q.reward,
			});
		}

		// breakdown配列化
		const breakdown = Object.entries(breakdownMap)
			.map(([date, value]) => ({
				date,
				total: value.total,
				items: value.items,
			}))
			.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

		const rewardSum = questHistories.reduce((sum, q) => sum + q.reward, 0);
		const totalAmount = base + rewardSum;

		const response: MonthlyAmountType = {
			month,
			basicAmount: base,
			rewardSum,
			totalAmount,
			breakdown,
		};

		return NextResponse.json(response);
	} catch (error) {
		console.error('月別金額取得エラー', error);
		return NextResponse.json({ error: '内部サーバーエラー' }, { status: 500 });
	}
}
