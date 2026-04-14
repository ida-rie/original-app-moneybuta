import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTodayUtc } from '@/lib/utils/getTodayUtc';

export async function GET(req: NextRequest) {
	console.log('🟢 金額履歴作成バッチ開始');

	const authHeader = req.headers.get('Authorization');
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return new Response('Unauthorized', {
			status: 401,
		});
	}

	try {
		// --- 今日の UTC 開始／終了 を取得 ---
		const { start, end } = getTodayUtc();

		// --- 全親ユーザーを子・基本金額ごと一括取得（N+1 解消） ---
		const parents = await prisma.user.findMany({
			where: { role: 'parent' },
			select: {
				id: true,
				children: {
					where: { role: 'child' },
					select: {
						id: true,
						basicAmountsAsChild: {
							orderBy: { createdAt: 'desc' },
							take: 1,
							select: { id: true, basicAmount: true, childUserId: true },
						},
					},
				},
			},
		});

		// --- 全子IDを収集 ---
		const allChildIds = parents.flatMap((p) => p.children.map((c) => c.id));

		// --- 当日承認済みクエスト報酬を一括取得 ---
		const todayQuests = await prisma.questHistory.findMany({
			where: {
				childUserId: { in: allChildIds },
				approved: true,
				approvedAt: { gte: start, lte: end },
			},
			select: { childUserId: true, reward: true },
		});

		// 子IDごとの報酬合計 Map
		const rewardMap = new Map<string, number>();
		for (const q of todayQuests) {
			rewardMap.set(q.childUserId, (rewardMap.get(q.childUserId) ?? 0) + q.reward);
		}

		// --- 各子に AmountHistory を upsert ---
		const upsertPromises: Promise<unknown>[] = [];

		for (const parent of parents) {
			for (const child of parent.children) {
				const basic = child.basicAmountsAsChild[0];
				if (!basic) {
					console.log(`⚠️ スキップ: 基本金額なし childId=${child.id}`);
					continue;
				}

				const rewardTotal = rewardMap.get(child.id) ?? 0;
				const totalAmount = basic.basicAmount + rewardTotal;

				upsertPromises.push(
					prisma.amountHistory
						.upsert({
							where: { childUserId_date: { childUserId: child.id, date: start } },
							create: {
								userId: parent.id,
								childUserId: child.id,
								basicAmountId: basic.id,
								totalAmount,
								date: start,
							},
							update: { totalAmount, basicAmountId: basic.id },
						})
						.then(() => {
							console.log(`🔄 upsert: 親 ${parent.id} / 子 ${child.id} total=${totalAmount}`);
						})
				);
			}
		}

		// 全 upsert を並列実行
		await Promise.all(upsertPromises);

		console.log('✅ 金額履歴作成バッチ正常終了');
		return NextResponse.json({ message: '金額履歴作成完了' });
	} catch (error) {
		console.error('❌ 金額履歴作成エラー:', error);
		return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
	}
}
