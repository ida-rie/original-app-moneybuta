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
	const user = useAuthStore((state) => state.user);
	const selectedChild = useAuthStore((state) => state.selectedChild);

	const months = generateRecentMonths(3);
	const [selectedMonth, setSelectedMonth] = useState(months[0]);
	const [data, setData] = useState<MonthlyAmountType | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const { width } = useWindowSize();
	const interval = width <= 768 ? 2 : 0;

	useEffect(() => {
		const fetchMonthlyAmount = async () => {
			setIsLoading(true);
			const childId = user?.role === 'child' ? user.id : selectedChild?.id;

			if (!childId) {
				setIsLoading(false);
				onLoaded?.();
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
				setIsLoading(false);
				onLoaded?.();
			}
		};

		fetchMonthlyAmount();
	}, [selectedMonth, selectedChild, user, onLoaded]);

	const graphData = (() => {
		if (!data) return [];
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
					{data && (
						<div className="mt-2 flex items-center gap-2">
							<p className="text-sm">
								きほん金がく: <span className="quicksand font-semibold">{data.basicAmount}</span>円
							</p>
						</div>
					)}
					<ChartHeader
						selectedMonth={selectedMonth}
						onMonthChange={setSelectedMonth}
						months={months}
					/>
				</CardHeader>

				<CardContent className="space-y-6">
					{isLoading ? (
						<div className="animate-pulse space-y-4">
							<div className="h-4 w-32 bg-gray-200 rounded" />
							<div className="h-40 bg-gray-200 rounded" />
							<div className="space-y-2">
								{[...Array(3)].map((_, i) => (
									<div key={i} className="h-4 bg-gray-200 rounded" />
								))}
							</div>
						</div>
					) : graphData.length === 0 ? (
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
							<ChartGraph data={graphData} interval={interval} />
							<ChartIncomeHistory data={data?.breakdown ?? []} userIconUrl="/logo.png" />
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
};
