'use client';

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChartDataPoint } from '@/types/chartType';

type ChartTableProps = {
	data: ChartDataPoint[];
};

// PC向け金額履歴のテーブル
export const ChartTable = ({ data }: ChartTableProps) => {
	return (
		<table className="w-full border-separate border-spacing-0 rounded-lg shadow-md">
			<thead>
				<tr className="bg-[var(--color-secondary)] text-white rounded-t-lg">
					<th className="text-left p-2 font-semibold text-lg">日にち</th>
					<th className="text-left p-2 font-semibold text-lg">ないよう</th>
					<th className="text-left p-2 font-semibold text-lg">金がく</th>
				</tr>
			</thead>
			<tbody>
				{data.map((item) => (
					<tr
						key={item.date}
						className="hover:bg-[var(--color-card-bg)] transition-colors duration-200"
					>
						<td className="p-4 border-b-2 border-[var(--color-border)] text-sm font-medium text-gray-700">
							<span className="quicksand">
								{format(new Date(item.date), 'yyyy年MM月d日', { locale: ja })}
							</span>
						</td>
						<td className="p-4 border-b-2 border-[var(--color-border)] text-sm font-medium text-gray-700">
							{item.content} をした！
						</td>
						<td className="p-4 border-b-2 border-[var(--color-border)] text-sm font-medium text-gray-700">
							<span className="quicksand">{item.amount}</span> 円手に入れた！
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);
};
