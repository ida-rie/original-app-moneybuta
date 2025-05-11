'use client';

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectItem,
	SelectValue,
} from '@/components/ui/select';

type ChartHeaderProps = {
	selectedMonth: string;
	onMonthChange: (month: string) => void;
	months: string[];
};

// チャートの月選択コンポーネント
export const ChartHeader = ({ selectedMonth, onMonthChange, months }: ChartHeaderProps) => {
	return (
		<div className="mt-2">
			<Select value={selectedMonth} onValueChange={onMonthChange}>
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
	);
};
