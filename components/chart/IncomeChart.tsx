'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useWindowSize } from '@/hooks/useWindowSize';
import { ChartHeader } from '../chart/ChartHeader';
import { ChartIncomeHistory } from './ChartIncomeHistory';
import { useAuthStore } from '@/lib/zustand/authStore';
import { generateRecentMonths } from '@/lib/utils/generateRecentMonths';
import { onLoadedType } from '@/types/onLoadedType';
import { useMonthlyAmount } from '@/hooks/useMonthlyAmount';

// Recharts（~450KB）をページ初期ロードから分離し、グラフ表示時のみ読み込む
const ChartGraph = dynamic(
	() => import('../chart/ChartGraph').then((mod) => mod.ChartGraph),
	{
		ssr: false, // Recharts はブラウザ API に依存するため SSR 無効
		loading: () => (
			<div className="animate-pulse h-[300px] bg-gray-200 rounded-lg" />
		),
	}
);

export const IncomeChart = ({ onLoaded }: onLoadedType) => {
	const user = useAuthStore((state) => state.user);
	const selectedChild = useAuthStore((state) => state.selectedChild);

	const months = generateRecentMonths(3);
	const [selectedMonth, setSelectedMonth] = useState(months[0]);

	const childId = user?.role === 'child' ? user.id : selectedChild?.id;
	const { width } = useWindowSize();
	const interval = width <= 768 ? 2 : 0;

	// SWR でデータ取得（CurrentAmount が当月を取得済みならキャッシュを共有）
	const { data, isLoading } = useMonthlyAmount(childId, selectedMonth);

	// ローディング完了を親に通知（既存の onLoaded 互換性維持）
	useEffect(() => {
		if (!isLoading) {
			onLoaded?.();
		}
	}, [isLoading, onLoaded]);

	const graphData = data?.breakdown?.map((d) => ({
		date: d.date,
		amount: d.total,
	})) ?? [];

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
