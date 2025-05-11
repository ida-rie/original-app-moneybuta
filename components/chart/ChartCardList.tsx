'use client';

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CalendarDays, ListChecks, Coins } from 'lucide-react';
import { ChartDataPoint } from '@/types/chartType';

type ChartCardListProps = {
	data: ChartDataPoint[];
};

export const ChartCardList = ({ data }: ChartCardListProps) => {
	return (
		<>
			{data.map((item) => (
				<div key={item.date} className="bg-[var(--color-card-bg)] rounded-md shadow p-4">
					<div className="flex items-center text-sm font-semibold text-gray-700">
						<CalendarDays className="w-4 h-4 mr-2 text-muted-foreground" />
						{format(new Date(item.date), 'yyyy年MM月d日', { locale: ja })}
					</div>
					<div className="flex items-center text-sm text-gray-700 mt-1">
						<ListChecks className="w-4 h-4 mr-2 text-muted-foreground" />
						{item.content} をした！
					</div>
					<div className="flex items-center text-sm text-gray-700 mt-1">
						<Coins className="w-4 h-4 mr-2 text-muted-foreground" />
						{item.amount} 円手に入れた！
					</div>
				</div>
			))}
		</>
	);
};
