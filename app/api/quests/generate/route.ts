import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTodayUtc } from '@/lib/utils/getTodayUtc';

export async function GET(req: NextRequest) {
	console.log('🟢 クエスト履歴作成バッチ開始');

	const cronSecret = process.env.CRON_SECRET;
	if (!cronSecret) {
		console.error('❌ CRON_SECRET が未設定です');
		return NextResponse.json({ error: 'サーバー設定エラー' }, { status: 503 });
	}

	const authHeader = req.headers.get('Authorization');
	if (authHeader !== `Bearer ${cronSecret}`) {
		return new Response('Unauthorized', {
			status: 401,
		});
	}

	try {
		const { start } = getTodayUtc();
		const today = start;

		// 【変更前】親→子→クエストと3段階のネストループで N+1 が発生していた
		// 【変更後】1クエリで親・子・基本クエストを一括取得
		const parents = await prisma.user.findMany({
			where: { role: 'parent' },
			select: {
				id: true,
				children: {
					where: { role: 'child' },
					select: {
						id: true,
						baseQuestsAsChild: {
							select: { id: true, title: true, reward: true },
						},
					},
				},
			},
		});

		// 全upsertをフラットなリストに展開し Promise.all で並列実行
		// ※ Connection Pooler（最大15接続）設定済みのため、小規模データでは問題なし
		const upsertPromises = parents.flatMap((parent) =>
			parent.children.flatMap((child) => {
				if (child.baseQuestsAsChild.length === 0) {
					console.log(`⚠️ スキップ: 基本クエストなし childId=${child.id}`);
					return [];
				}

				return child.baseQuestsAsChild.map((base) =>
					prisma.questHistory.upsert({
						where: {
							baseQuestId_childUserId_questDate: {
								baseQuestId: base.id,
								childUserId: child.id,
								questDate: today,
							},
						},
						create: {
							baseQuestId: base.id,
							childUserId: child.id,
							title: base.title,
							reward: base.reward,
							questDate: today,
						},
						update: {
							title: base.title,
							reward: base.reward,
						},
					})
				);
			})
		);

		const results = await Promise.all(upsertPromises);

		console.log(`✅ クエスト履歴作成バッチ正常終了: ${results.length} 件処理`);
		return NextResponse.json({ message: 'クエスト履歴作成完了', count: results.length });
	} catch (error) {
		console.error('❌ クエスト履歴作成エラー:', error);
		return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
	}
}
