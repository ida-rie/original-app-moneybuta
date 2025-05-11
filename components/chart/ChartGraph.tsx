'use client';

import { format } from 'date-fns';
import { ResponsiveContainer, LineChart, Line, XAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ChartDataPoint } from '@/types/chartType';
import { chartConfig } from '@/config/chartConfig';

type ChartGraphProps = {
	data: ChartDataPoint[];
	interval: number;
};

// rechartsを使った折れ線グラフコンポーネント
export const ChartGraph = ({ data, interval }: ChartGraphProps) => {
	return (
		<div className="bg-[var(--color-card-bg)] rounded-lg shadow-md p-4 overflow-x-auto">
			<ChartContainer config={chartConfig}>
				<ResponsiveContainer width="100%" height={300}>
					<LineChart data={data} margin={{ left: 12, right: 12 }}>
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
	);
};
