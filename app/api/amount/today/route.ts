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
		// 日本時間を明示的に指定してUTCに変換
		const { start, end } = getTodayUtc();

		// 全親ユーザーを取得
		const parents = await prisma.user.findMany({
			where: { role: 'parent' },
			select: { id: true },
		});

		for (const parent of parents) {
			// 子ユーザーを取得
			const children = await prisma.user.findMany({
				where: {
					parentId: parent.id,
					role: 'child',
				},
				select: { id: true },
			});
			const childIds = children.map((c) => c.id);

			// 子ごとの最新基本金額をまとめて取得
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

			// 本日承認されたクエスト報酬をまとめて取得
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

			// 親ごとの既存履歴をまとめてチェック（一件だけ）
			const existing = await prisma.amountHistory.findFirst({
				where: { userId: parent.id, date: start },
			});

			for (const child of children) {
				// 最新基本金額がなければスキップ
				const basicAmount = latestBasicMap.get(child.id);
				if (!basicAmount) {
					console.log(`⚠️ スキップ: 基本金額なし childId=${child.id}`);
					continue;
				}

				const baseAmountValue = basicAmount.basicAmount;
				const rewardTotal = rewardMap.get(child.id) ?? 0;
				const totalAmount = baseAmountValue + rewardTotal;

				if (existing) {
					await prisma.amountHistory.update({
						where: { id: existing.id },
						data: {
							totalAmount,
							childUserId: child.id,
							basicAmountId: basicAmount.id,
						},
					});
					console.log(`🔄 更新: 親 ${parent.id} / 子 ${child.id} total=${totalAmount}`);
				} else {
					await prisma.amountHistory.create({
						data: {
							userId: parent.id,
							childUserId: child.id,
							basicAmountId: basicAmount.id,
							totalAmount,
							date: start,
						},
					});
					console.log(`✅ 作成: 親 ${parent.id} / 子 ${child.id} total=${totalAmount}`);
				}
			}
		}

		console.log('✅ 金額履歴作成バッチ正常終了');
		return NextResponse.json({ message: '金額履歴作成完了' });
	} catch (error) {
		console.error('❌ 金額履歴作成エラー:', error);
		return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
	}
}
