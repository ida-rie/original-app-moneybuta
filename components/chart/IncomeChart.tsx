'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { useWindowSize } from '@/hooks/useWindowSize';
import { ChartHeader } from '../chart/ChartHeader';
import { ChartGraph } from '../chart/ChartGraph';
import { ChartIncomeHistory } from './ChartIncomeHistory';
import { useAuthStore } from '@/lib/zustand/authStore';
import { generateRecentMonths } from '@/lib/utils/generateRecentMonths';
import { MonthlyAmountType } from '@/types/MonthlyAmountType';

export const IncomeChart = () => {
	const { user, selectedChild } = useAuthStore();

	// 直近6ヶ月の月を取得
	const months = generateRecentMonths(6);
	// 今月が先頭
	const [selectedMonth, setSelectedMonth] = useState(months[0]);
	// 表示するデータ
	const [data, setData] = useState<MonthlyAmountType | null>(null);

	const [loading, setLoading] = useState(true);

	// ウィンドウサイズ取得
	const { width } = useWindowSize();
	const interval = width <= 768 ? 2 : 0;

	// 月が変更されたときにデータを再生成
	// useEffect(() => {
	// 	const data = generateChartData(selectedMonth);
	// 	setChartData(data);
	// }, [selectedMonth]);

	useEffect(() => {
		const fetchMonthlyAmount = async () => {
			setLoading(true);
			const childId = user?.role === 'child' ? user.id : selectedChild?.id;
			if (!childId) return;

			try {
				const res = await fetch(`/api/amount/monthly?childId=${childId}&month=${selectedMonth}`, {
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${sessionStorage.getItem('access_token')}`,
					},
				});

				if (!res.ok) {
					const error = await res.json();
					throw new Error(error.message || 'APIエラー');
				}

				const json: MonthlyAmountType = await res.json();
				console.log(json);
				setData(json);
			} catch (err) {
				console.error('月別データ取得エラー:', err);
			} finally {
				setLoading(false);
			}
		};

		fetchMonthlyAmount();
	}, [selectedMonth, selectedChild, user]);

	if (user?.role === 'parent' && !selectedChild) {
		return <p className="mt-4 text-center">子どもアカウントを選択してください</p>;
	}

	if (loading) {
		return <p className="mt-4 text-center">よみこみ中…</p>;
	}

	// ChartGraph 用データ整形
	const graphData = (() => {
		if (!data) return [];

		let cumulative = data.basicAmount;
		return data.breakdown.map((d) => {
			cumulative += d.total;
			return {
				date: d.date,
				amount: cumulative,
			};
		});
	})();

	return (
		<div>
			<Card className="border-[var(--color-secondary)]">
				<CardHeader>
					<CardTitle>おこづかいのきろく</CardTitle>
					{/* 月を選択 */}
					<ChartHeader
						selectedMonth={selectedMonth}
						onMonthChange={setSelectedMonth}
						months={months}
					/>
				</CardHeader>

				<CardContent className="space-y-6">
					{/* チャート */}
					<ChartGraph data={graphData} interval={interval} />

					{/* 収入履歴 */}
					<ChartIncomeHistory data={data?.breakdown ?? []} userIconUrl="/logo.png" />
				</CardContent>

				<CardFooter className="text-sm text-muted-foreground">
					{/* <div>おてつだいクエストでもらった金がくのきろくが見られるよ！</div> */}
					{`ごうけい: ¥${data?.totalAmount}（クエストぶん: ¥${data?.rewardSum}）`}
				</CardFooter>
			</Card>
		</div>
	);
};
