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
			const children = await prisma.user.findMany({
				where: {
					parentId: parent.id,
					role: 'child',
				},
				select: { id: true },
			});

			for (const child of children) {
				// 基本金額取得（なければスキップ）
				const basicAmount = await prisma.basicAmount.findFirst({
					where: { childUserId: child.id },
					orderBy: { createdAt: 'desc' },
				});
				if (!basicAmount) {
					console.log(`⚠️ スキップ: 基本金額なし childId=${child.id}`);
					continue;
				}

				const baseAmountValue = basicAmount.basicAmount;

				// 今日承認されたクエスト報酬合計
				const todayApproved = await prisma.questHistory.findMany({
					where: {
						childUserId: child.id,
						approved: true,
						approvedAt: {
							gte: start,
							lte: end,
						},
					},
				});
				const rewardTotal = todayApproved.reduce((sum, q) => sum + q.reward, 0);
				const totalAmount = baseAmountValue + rewardTotal;

				// 既存履歴があれば update、なければ create
				const existing = await prisma.amountHistory.findFirst({
					where: {
						userId: parent.id,
						date: start,
					},
				});

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
