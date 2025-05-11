'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { useWindowSize } from '@/hooks/useWindowSize';
import { generateChartData, months } from '@/lib/utils/chartData';
import { ChartHeader } from '../chart/ChartHeader';
import { ChartDataPoint } from '@/types/chartType';
import { ChartGraph } from '../chart/ChartGraph';
import { ChartTable } from '../chart/ChartTable';
import { ChartCardList } from '../chart/ChartCardList';

export const IncomeChart = () => {
	// 選択中の月
	const [selectedMonth, setSelectedMonth] = useState('2024-04');
	// 表示するデータ（クライアント側で生成）
	const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

	// ウィンドウサイズ取得
	const { width } = useWindowSize();
	const interval = width <= 768 ? 2 : 0;

	// 月が変更されたときにデータを再生成
	useEffect(() => {
		const data = generateChartData(selectedMonth);
		setChartData(data);
	}, [selectedMonth]);

	return (
		<div>
			<Card>
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
					<ChartGraph data={chartData} interval={interval} />

					{/* 金額履歴テーブル（PC用） */}
					<div className="hidden sm:block overflow-x-auto">
						<ChartTable data={chartData} />
					</div>

					{/* 金額履歴カード（モバイル用） */}
					<div className="sm:hidden space-y-4">
						<ChartCardList data={chartData} />
					</div>
				</CardContent>

				<CardFooter className="text-sm text-muted-foreground">
					<div>おてつだいでもらったおこづかいのきろくが見られるよ！</div>
				</CardFooter>
			</Card>
		</div>
	);
};
