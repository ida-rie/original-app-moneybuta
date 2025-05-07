'use client';

import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ja } from 'date-fns/locale';
import { LineChart, Line, XAxis, CartesianGrid } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectItem,
	SelectValue,
} from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

type ChartDataPoint = {
	date: string;
	amount: number;
};

type ChartConfig = {
	[key: string]: {
		label: string;
		color: string;
	};
};

// 📊 表示用のチャート設定
const chartConfig = {
	amount: {
		label: '金額',
		color: 'hsl(var(--chart-1))',
	},
} satisfies ChartConfig;

// 📅 選択可能な年月リスト
const months = ['2024-01', '2024-02', '2024-03', '2024-04'];

const IncomeChart = () => {
	// 📅 選択中の月
	const [selectedMonth, setSelectedMonth] = useState('2024-04');

	// 📈 選択月に応じたデータを生成（ランダム）
	const chartData: ChartDataPoint[] = useMemo(() => {
		const [year, month] = selectedMonth.split('-').map(Number);
		const start = startOfMonth(new Date(year, month - 1));
		const end = endOfMonth(start);

		return eachDayOfInterval({ start, end }).map((date) => ({
			date: format(date, 'yyyy-MM-dd'),
			amount: Math.floor(Math.random() * 500), // ←実データに置き換え可能
		}));
	}, [selectedMonth]);

	return (
		<Card>
			<CardHeader>
				<CardTitle>日別金額チャート</CardTitle>
				<div className="mt-2">
					<Select value={selectedMonth} onValueChange={setSelectedMonth}>
						<SelectTrigger className="w-[200px]">
							<SelectValue placeholder="月を選択" />
						</SelectTrigger>
						<SelectContent>
							{months.map((month) => (
								<SelectItem key={month} value={month}>
									{format(new Date(month + '-01'), 'yyyy年M月', { locale: ja })}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig}>
					<LineChart data={chartData} margin={{ left: 12, right: 12 }} width={600} height={300}>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="date"
							interval={0} // ← これが重要！
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							tickFormatter={(value) => format(new Date(value), 'd')} // 1, 2, 3...のみに
						/>
						<ChartTooltip content={<ChartTooltipContent hideLabel />} cursor={false} />
						<Line
							type="monotone"
							dataKey="amount"
							stroke="var(--color-accent)"
							strokeWidth={2}
							dot={false}
						/>
					</LineChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
};

export default IncomeChart;
