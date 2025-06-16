import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { format, startOfDay } from 'date-fns';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
	process.env.SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY! // server only
);

// ✅ 金額履歴作成API（手動・cron両対応）
export async function GET(req: NextRequest) {
	try {
		const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '');

		let targetParents: { id: string }[] = [];

		// ✅ 認証あり（手動呼び出し）なら対象親はその1人だけ
		if (accessToken) {
			const {
				data: { user },
				error,
			} = await supabase.auth.getUser(accessToken);

			if (error || !user) {
				return NextResponse.json({ error: '認証エラー' }, { status: 401 });
			}

			targetParents = [{ id: user.id }];
		} else {
			console.log('🚀 金額の履歴自動生成 cron 開始:', new Date().toISOString());
			// ✅ cron実行時：全親ユーザー対象
			targetParents = await prisma.user.findMany({
				where: { role: 'parent' },
				select: { id: true },
			});
		}

		const today = format(new Date(), 'yyyy-MM-dd');

		for (const parent of targetParents) {
			const children = await prisma.user.findMany({
				where: {
					parentId: parent.id,
					role: 'child',
				},
				select: { id: true },
			});

			for (const child of children) {
				// ✅ 基本金額取得（なければ0円扱い）
				const basicAmount = await prisma.basicAmount.findFirst({
					where: { userId: child.id },
					orderBy: { createdAt: 'desc' },
				});
				const base = basicAmount?.basicAmount ?? 0;

				// ✅ 今日承認されたクエスト報酬
				const todayApproved = await prisma.questHistory.findMany({
					where: {
						childUserId: child.id,
						approved: true,
						approvedAt: {
							gte: new Date(`${today}T00:00:00.000Z`),
							lte: new Date(`${today}T23:59:59.999Z`),
						},
					},
				});
				const rewardTotal = todayApproved.reduce((sum, q) => sum + q.reward, 0);

				// ✅ 既存の履歴があるか確認
				const existing = await prisma.amountHistory.findFirst({
					where: {
						userId: parent.id,
						date: startOfDay(today),
					},
				});

				if (existing) {
					await prisma.amountHistory.update({
						where: { id: existing.id },
						data: {
							totalAmount: base + rewardTotal,
							childUserId: child.id,
							basicAmountId: basicAmount!.id,
						},
					});
				} else {
					await prisma.amountHistory.create({
						data: {
							userId: parent.id,
							childUserId: child.id,
							basicAmountId: basicAmount!.id,
							totalAmount: base + rewardTotal,
							date: startOfDay(today),
						},
					});
				}
			}
		}

		return NextResponse.json({ message: '金額履歴を作成しました' });
	} catch (e) {
		console.error('金額履歴の作成エラー:', e);
		return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
	}
}
