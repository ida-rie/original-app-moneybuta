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

		// --- 全親ユーザーを取得 ---
		const parents = await prisma.user.findMany({
			where: { role: 'parent' },
			select: { id: true },
		});

		for (const parent of parents) {
			// --- 子ユーザー一覧を取得 ---
			const children = await prisma.user.findMany({
				where: {
					parentId: parent.id,
					role: 'child',
				},
				select: { id: true },
			});
			const childIds = children.map((c) => c.id);

			// --- 基本金額を一括取得 & 最新のみ Map 化 ---
			const allBasics = await prisma.basicAmount.findMany({
				where: { childUserId: { in: childIds } },
				orderBy: { createdAt: 'desc' },
			});
			const latestBasicMap = new Map<string, (typeof allBasics)[0]>();
			for (const b of allBasics) {
				if (!latestBasicMap.has(b.childUserId)) {
					latestBasicMap.set(b.childUserId, b);
				}
			}

			// --- 当日承認済みクエスト報酬を一括取得 & 合計 Map 化 ---
			const todayQuests = await prisma.questHistory.findMany({
				where: {
					childUserId: { in: childIds },
					approved: true,
					approvedAt: { gte: start, lte: end },
				},
				select: { childUserId: true, reward: true },
			});
			const rewardMap = new Map<string, number>();
			for (const q of todayQuests) {
				rewardMap.set(q.childUserId, (rewardMap.get(q.childUserId) ?? 0) + q.reward);
			}

			// --- 子ループ：upsert で重複なく create/update ---
			for (const child of children) {
				const basic = latestBasicMap.get(child.id);
				if (!basic) {
					console.log(`⚠️ スキップ: 基本金額なし childId=${child.id}`);
					continue;
				}
				const rewardTotal = rewardMap.get(child.id) ?? 0;
				const totalAmount = basic.basicAmount + rewardTotal;

				await prisma.amountHistory.upsert({
					where: {
						userId_date: {
							userId: parent.id,
							date: start,
						},
					},
					create: {
						userId: parent.id,
						childUserId: child.id,
						basicAmountId: basic.id,
						totalAmount,
						date: start,
					},
					update: {
						totalAmount,
						childUserId: child.id,
						basicAmountId: basic.id,
					},
				});

				console.log(`🔄 upsert: 親 ${parent.id} / 子 ${child.id} total=${totalAmount}`);
			}
		}

		console.log('✅ 金額履歴作成バッチ正常終了');
		return NextResponse.json({ message: '金額履歴作成完了' });
	} catch (error) {
		console.error('❌ 金額履歴作成エラー:', error);
		return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
	}
}
