import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ChartDataPoint } from '@/types/chartType';

// 選択可能な年月リスト
export const months = ['2024-01', '2024-02', '2024-03', '2024-04'];

// クライアント側でランダムなデータを生成
export const generateChartData = (selectedMonth: string): ChartDataPoint[] => {
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
