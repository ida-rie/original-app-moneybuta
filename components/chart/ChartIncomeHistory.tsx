'use client';

import Image from 'next/image';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { UserRound, Bot } from 'lucide-react';
import { ChartDataPoint } from '@/types/chartType';

type ChartIncomeHistoryProps = {
	data: ChartDataPoint[];
	userIconUrl?: string;
};

const groupByDate = (data: ChartDataPoint[]) => {
	return data.reduce<Record<string, ChartDataPoint[]>>((acc, item) => {
		const dateKey = format(new Date(item.date), 'yyyy-MM-dd');
		if (!acc[dateKey]) acc[dateKey] = [];
		acc[dateKey].push(item);
		return acc;
	}, {});
};

// 収入履歴
export const ChartIncomeHistory = ({ data, userIconUrl }: ChartIncomeHistoryProps) => {
	const grouped = groupByDate(data);

	return (
		<div className="flex flex-col gap-6 px-4 pb-8">
			{Object.entries(grouped)
				.sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime()) // ← ★ ここがポイント
				.map(([dateKey, items]) => {
					const formattedDate = format(new Date(dateKey), 'yyyy年MM月d日', { locale: ja });
					const total = items.reduce((sum, item) => sum + item.amount, 0);

					return (
						<div key={dateKey} className="md:w-2/3 md:mx-auto mt-8">
							<p className="text-xs md:text-sm text-gray-500 mb-2 quicksand text-center">
								{formattedDate}
							</p>
							<div className="flex flex-col gap-3 py-2">
								{items.map((item, index) => (
									<div key={index} className="flex items-start gap-2 md:max-w-full">
										{/* ユーザーアイコン */}
										<div className="w-8 h-8 relative">
											{userIconUrl ? (
												<Image
													src={userIconUrl}
													alt="Icon"
													fill
													className="rounded-full object-cover"
												/>
											) : (
												<div className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow text-gray-500">
													<UserRound size={20} />
												</div>
											)}
										</div>
										{/* 吹き出し */}
										<div className="bg-[var(--color-card-bg)] p-4 rounded-2xl shadow-md">
											<p className="text-sm leading-relaxed">
												クエスト「{item.content}」をクリア！
												<br />
												<span className="quicksand font-semibold">{item.amount}</span> 円てにいれた
											</p>
										</div>
									</div>
								))}

								{/* 合計金額（右寄せ吹き出し＋Botアイコン） */}
								<div className="flex flex-row-reverse items-start gap-2 md:max-w-full">
									{/* Bot アイコン */}
									<div className="w-8 h-8 mt-1 flex items-center justify-center bg-white rounded-full shadow text-[var(--color-primary)]">
										<Bot size={20} />
									</div>
									{/* 吹き出し */}
									<div className="bg-[var(--color-card-bg)] p-4 rounded-2xl shadow-md max-w-[85%]">
										<p className="text-sm font-bold text-[var(--color-primary)]">
											きょうのごうけい <span className="quicksand">{total}</span> 円！
										</p>
									</div>
								</div>
							</div>
						</div>
					);
				})}
		</div>
	);
};
