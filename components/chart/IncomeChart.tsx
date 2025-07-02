'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useWindowSize } from '@/hooks/useWindowSize';
import { ChartHeader } from '../chart/ChartHeader';
import { ChartGraph } from '../chart/ChartGraph';
import { ChartIncomeHistory } from './ChartIncomeHistory';
import { useAuthStore } from '@/lib/zustand/authStore';
import { generateRecentMonths } from '@/lib/utils/generateRecentMonths';
import { MonthlyAmountType } from '@/types/MonthlyAmountType';
import { onLoadedType } from '@/types/onLoadedType';
import Image from 'next/image';

export const IncomeChart = ({ onLoaded }: onLoadedType) => {
	// 必要な state のみを取得
	const user = useAuthStore((state) => state.user);
	const selectedChild = useAuthStore((state) => state.selectedChild);

	// 直近6ヶ月の月を取得
	const months = generateRecentMonths(3);
	// 今月が先頭
	const [selectedMonth, setSelectedMonth] = useState(months[0]);
	// 表示するデータ
	const [data, setData] = useState<MonthlyAmountType | null>(null);

	// ウィンドウサイズ取得
	const { width } = useWindowSize();
	const interval = width <= 768 ? 2 : 0;

	// 月が変更されたときにデータを再生成
	useEffect(() => {
		const fetchMonthlyAmount = async () => {
			const childId = user?.role === 'child' ? user.id : selectedChild?.id;

			if (!childId) {
				onLoaded();
				return;
			}

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
				setData(json);
			} catch (err) {
				console.error('月別データ取得エラー:', err);
			} finally {
				onLoaded();
			}
		};

		fetchMonthlyAmount();
	}, [selectedMonth, selectedChild, user, onLoaded]);

	// ChartGraph 用データ整形
	const graphData = (() => {
		if (!data) return [];

		// breakdown.total は既に累積されているので、そのまま使えばOK
		return data.breakdown.map((d) => ({
			date: d.date,
			amount: d.total,
		}));
	})();

	return (
		<div>
			<Card className="border-[var(--color-secondary)]">
				<CardHeader>
					<CardTitle>おこづかいのきろく</CardTitle>
					{/* 月初基本金額をヘッダーに表示 */}
					{data && (
						<div className="mt-2 flex items-center gap-2">
							<p className="text-sm">
								きほん金がく: <span className="quicksand font-semibold">{data.basicAmount}</span>円
							</p>
						</div>
					)}
					{/* 月を選択 */}
					<ChartHeader
						selectedMonth={selectedMonth}
						onMonthChange={setSelectedMonth}
						months={months}
					/>
				</CardHeader>

				<CardContent className="space-y-6">
					{graphData.length === 0 ? (
						<div className="text-center text-muted-foreground py-10">
							<Image
								src="/lamp_genie.png"
								alt="豚の貯金箱"
								width={150}
								height={150}
								className="mx-auto mb-4"
							/>
							<p className="text-base">まだきろくがありません。</p>
							<p className="text-sm">
								おてつだいクエストをクリアすると、ここにきろくがふえていくよ！
							</p>
						</div>
					) : (
						<>
							{/* チャート */}
							<ChartGraph data={graphData} interval={interval} />

							{/* 収入履歴 */}
							<ChartIncomeHistory data={data?.breakdown ?? []} userIconUrl="/logo.png" />
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
};
