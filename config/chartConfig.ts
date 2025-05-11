type ChartConfig = {
	[key: string]: {
		label: string;
		color: string;
	};
};

// 📊 表示用のチャート設定
export const chartConfig: ChartConfig = {
	amount: {
		label: '金がく',
		color: 'hsl(var(--chart-1))',
	},
};
