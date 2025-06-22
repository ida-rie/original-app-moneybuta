import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { addDays, isBefore, startOfDay } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { format } from 'date-fns';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

/**
 * テストデータ作成: AmountHistory レコード
 */
type AmountHistoryInsert = {
	userId: string;
	childUserId: string;
	basicAmountId: string;
	totalAmount: number;
	date: Date;
	createdAt: Date;
};

const run = async () => {
	console.log('AmountHistory のテストデータを作成します...');

	// 承認済みのクエスト履歴を取得
	const { data: questHistories, error: qError } = await supabase
		.from('QuestHistory')
		.select('questDate, reward, childUserId, approved')
		.eq('approved', true);

	// 基本金額を取得
	const { data: basicAmounts, error: bError } = await supabase
		.from('BasicAmount')
		.select('id, userId, childUserId, basicAmount');

	if (qError || bError || !questHistories || !basicAmounts) {
		console.error('❌ 必要なデータの取得に失敗しました:', qError ?? bError);
		return;
	}

	// childUserId ごとの基本金額情報マップ
	const amountMap = new Map<string, { userId: string; basicAmountId: string; base: number }>();
	for (const b of basicAmounts) {
		amountMap.set(b.childUserId, {
			userId: b.userId,
			basicAmountId: b.id,
			base: b.basicAmount,
		});
	}

	// テストデータ期間: 2025年5月6日〜2025年6月21日 (JST)
	const startDate = new Date(Date.UTC(2025, 4, 6)); // 5/6 JST 0:00
	const endDate = new Date(Date.UTC(2025, 5, 21)); // 6/21 JST 0:00

	const inserts: AmountHistoryInsert[] = [];

	for (let day = new Date(startDate); !isBefore(endDate, day); day = addDays(day, 1)) {
		// JST の当日0:00 を UTC に変換
		const jstDayMid = utcToZonedTime(day, 'Asia/Tokyo');
		const jstMidnight = startOfDay(jstDayMid);
		const dateUtc = zonedTimeToUtc(jstMidnight, 'Asia/Tokyo');
		const dateStr = format(jstMidnight, 'yyyy-MM-dd');

		// 前日のクエスト合計を日毎に集計
		const dailyMap: Record<string, number> = {};
		for (const q of questHistories) {
			const questJst = utcToZonedTime(new Date(q.questDate), 'Asia/Tokyo');
			const questDateStr = format(startOfDay(questJst), 'yyyy-MM-dd');
			if (questDateStr !== dateStr) continue;
			dailyMap[q.childUserId] = (dailyMap[q.childUserId] || 0) + q.reward;
		}

		// AmountHistory レコード生成
		for (const [childId, rewardSum] of Object.entries(dailyMap)) {
			const info = amountMap.get(childId);
			if (!info) continue;
			inserts.push({
				userId: info.userId,
				childUserId: childId,
				basicAmountId: info.basicAmountId,
				totalAmount: info.base + rewardSum,
				date: dateUtc,
				createdAt: new Date(),
			});
		}
	}

	// 一意キー (userId + date) で重複排除
	const unique = new Map<string, AmountHistoryInsert>();
	for (const item of inserts) {
		const key = `${item.userId}-${item.date.toISOString()}`;
		if (!unique.has(key)) unique.set(key, item);
	}
	const uniqueInserts = Array.from(unique.values());

	if (uniqueInserts.length === 0) {
		console.log('⚠️ 挿入すべきデータがありませんでした。');
		return;
	}

	// upsert で挿入または更新
	const { error: insertError } = await supabase
		.from('AmountHistory')
		.upsert(uniqueInserts, { onConflict: 'userId,date' });

	if (insertError) {
		console.error('❌ AmountHistory の挿入に失敗:', insertError.message);
	} else {
		console.log(`✅ AmountHistory テストデータを ${uniqueInserts.length} 件挿入しました！`);
	}
};

run();
