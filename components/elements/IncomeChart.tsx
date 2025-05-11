'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ja } from 'date-fns/locale';
import { LineChart, Line, XAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectItem,
	SelectValue,
} from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useWindowSize } from '@/hooks/useWindowSize';
import { CalendarDays, ListChecks, Coins } from 'lucide-react';

type ChartDataPoint = {
	date: string;
	content: string;
	amount: number;
};

type ChartConfig = {
	[key: string]: {
		label: string;
		color: string;
	};
};

// 📊 表示用のチャート設定
const chartConfig: ChartConfig = {
	amount: {
		label: '金額',
		color: 'hsl(var(--chart-1))',
	},
};

// 📅 選択可能な年月リスト
const months = ['2024-01', '2024-02', '2024-03', '2024-04'];

// 🧮 クライアント側でランダムなデータを生成
const generateChartData = (selectedMonth: string): ChartDataPoint[] => {
	const [year, month] = selectedMonth.split('-').map(Number);
	const start = startOfMonth(new Date(year, month - 1));
	const end = endOfMonth(start);

	const tasks = ['そうじ', 'お皿洗い', '買い物', '宿題', '掃除機かけ'];

	return eachDayOfInterval({ start, end }).map((date) => ({
		date: format(date, 'yyyy-MM-dd'),
		amount: Math.floor(Math.random() * 500),
		content: tasks[Math.floor(Math.random() * tasks.length)],
	}));
};

const IncomeChart = () => {
	// 📅 選択中の月
	const [selectedMonth, setSelectedMonth] = useState('2024-04');
	// 📈 表示するデータ（クライアント側で生成）
	const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

	// 📐 ウィンドウサイズ取得
	const { width } = useWindowSize();
	const interval = width <= 768 ? 2 : 0;

	// 🔁 月が変更されたときにデータを再生成
	useEffect(() => {
		const data = generateChartData(selectedMonth);
		setChartData(data);
	}, [selectedMonth]);

	return (
		<Card>
			<CardHeader>
				<CardTitle>おこづかいのきろく</CardTitle>
				<div className="mt-2">
					<Select value={selectedMonth} onValueChange={setSelectedMonth}>
						<SelectTrigger className="w-[200px] bg-white">
							<SelectValue placeholder="月をえらぶ" />
						</SelectTrigger>
						<SelectContent className="bg-white">
							{months.map((month) => (
								<SelectItem key={month} value={month}>
									<span className="quicksand">
										{format(new Date(month + '-01'), 'yyyy年M月', { locale: ja })}
									</span>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</CardHeader>

			<CardContent className="space-y-6">
				{/* チャート */}
				<div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-4 overflow-x-auto">
					<ChartContainer config={chartConfig}>
						<ResponsiveContainer width="100%" height={300}>
							<LineChart data={chartData} margin={{ left: 12, right: 12 }}>
								<CartesianGrid vertical={false} />
								<XAxis
									dataKey="date"
									interval={interval}
									tickLine={false}
									axisLine={false}
									tickMargin={8}
									tickFormatter={(value) => format(new Date(value), 'd')}
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
						</ResponsiveContainer>
					</ChartContainer>
				</div>

				{/* テーブル（PC用） */}
				<div className="hidden sm:block overflow-x-auto">
					<table className="w-full border-separate border-spacing-0 rounded-lg shadow-md">
						<thead>
							<tr className="bg-[var(--color-secondary)] text-white rounded-t-lg">
								<th className="text-left p-2 font-semibold text-lg">日にち</th>
								<th className="text-left p-2 font-semibold text-lg">ないよう</th>
								<th className="text-left p-2 font-semibold text-lg">金がく</th>
							</tr>
						</thead>
						<tbody>
							{chartData.map((data) => (
								<tr
									key={data.date}
									className="hover:bg-[var(--color-card-bg)] transition-colors duration-200"
								>
									<td className="p-4 border-b-2 border-[var(--color-border)] text-sm font-medium text-gray-700">
										<span className="quicksand">
											{format(new Date(data.date), 'yyyy年MM月d日', { locale: ja })}
										</span>
									</td>
									<td className="p-4 border-b-2 border-[var(--color-border)] text-sm font-medium text-gray-700">
										{data.content} をした！
									</td>
									<td className="p-4 border-b-2 border-[var(--color-border)] text-sm font-medium text-gray-700">
										<span className="quicksand">{data.amount}</span> 円手に入れた！
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* カード型（モバイル用） */}
				<div className="sm:hidden space-y-4">
					{chartData.map((data) => (
						<div key={data.date} className="bg-[var(--color-card-bg)] rounded-md shadow p-4">
							<div className="flex items-center text-sm font-semibold text-gray-700">
								<CalendarDays className="w-4 h-4 mr-2 text-muted-foreground" />
								{format(new Date(data.date), 'yyyy年MM月d日', { locale: ja })}
							</div>
							<div className="flex items-center text-sm text-gray-700 mt-1">
								<ListChecks className="w-4 h-4 mr-2 text-muted-foreground" />
								{data.content} をした！
							</div>
							<div className="flex items-center text-sm text-gray-700 mt-1">
								<Coins className="w-4 h-4 mr-2 text-muted-foreground" />
								{data.amount} 円手に入れた！
							</div>
						</div>
					))}
				</div>
			</CardContent>

			<CardFooter className="text-sm text-muted-foreground">
				<div>おてつだいでもらったおこづかいのきろくが見られるよ！</div>
			</CardFooter>
		</Card>
	);
};

export default IncomeChart;
