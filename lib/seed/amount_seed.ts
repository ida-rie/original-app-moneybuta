// amount_seed.ts

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { addDays, isBefore, startOfDay } from 'date-fns';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

type AmountHistoryInsert = {
	userId: string;
	childUserId: string;
	basicAmountId: string;
	totalAmount: number;
	date: Date;
	createdAt: Date;
};

const run = async () => {
	console.log('AmountHistoryのテストデータを作成します...');

	const { data: questHistories, error: qError } = await supabase
		.from('QuestHistory')
		.select('questDate, reward, childUserId, approved')
		.eq('approved', true);

	const { data: basicAmounts, error: bError } = await supabase
		.from('BasicAmount')
		.select('id, userId, childUserId, basicAmount');

	if (!questHistories || !basicAmounts || qError || bError) {
		console.error('❌ 必要なデータの取得に失敗しました。');
		return;
	}

	const amountMap = new Map<string, { userId: string; basicAmountId: string; base: number }>();
	for (const b of basicAmounts) {
		amountMap.set(b.childUserId, {
			userId: b.userId,
			basicAmountId: b.id,
			base: b.basicAmount,
		});
	}

	const JST_OFFSET = 9 * 60 * 60000;
	const start = new Date(Date.UTC(2025, 4, 1)); // 2025-05-01
	const end = new Date(Date.UTC(2025, 5, 14)); // 2025-06-14

	const inserts: AmountHistoryInsert[] = [];

	for (let day = new Date(start); !isBefore(end, day); day = addDays(day, 1)) {
		const jstDay = new Date(day.getTime() + JST_OFFSET);
		const utcDate = startOfDay(jstDay);
		const jstYesterday = new Date(jstDay.getTime() - 24 * 60 * 60000);
		const startOfYesterday = startOfDay(jstYesterday).toISOString();

		const group: Record<string, number> = {};

		for (const q of questHistories) {
			const questDate = new Date(q.questDate);
			const questJST = new Date(questDate.getTime() + JST_OFFSET);
			const questDay = startOfDay(questJST).toISOString();
			if (questDay !== startOfYesterday) continue;

			const key = q.childUserId;
			if (!group[key]) group[key] = 0;
			group[key] += q.reward;
		}

		for (const childId in group) {
			const info = amountMap.get(childId);
			if (!info) continue;

			inserts.push({
				userId: info.userId,
				childUserId: childId,
				basicAmountId: info.basicAmountId,
				totalAmount: info.base + group[childId],
				date: utcDate,
				createdAt: new Date(),
			});
		}
	}

	// 🔍 重複キー除外: userId + date が同じものは一つだけにする
	const insertMap = new Map<string, AmountHistoryInsert>();
	for (const insert of inserts) {
		const key = `${insert.userId}-${insert.date.toISOString()}`;
		if (!insertMap.has(key)) {
			insertMap.set(key, insert);
		}
	}

	const uniqueInserts = Array.from(insertMap.values());

	if (uniqueInserts.length === 0) {
		console.log('⚠️ 挿入すべきデータがありませんでした。');
		return;
	}

	const { error: insertError } = await supabase
		.from('AmountHistory')
		.upsert(uniqueInserts, { onConflict: 'userId,date' });

	if (insertError) {
		console.error('❌ 挿入中にエラーが発生しました:', insertError);
		return;
	}

	console.log(`✅ AmountHistory テストデータを ${uniqueInserts.length} 件挿入しました！`);
};

run();
