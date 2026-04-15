'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/lib/zustand/authStore';
import { format } from 'date-fns';
import { onLoadedType } from '@/types/onLoadedType';
import { useMonthlyAmount } from '@/hooks/useMonthlyAmount';

export const CurrentAmount = ({ onLoaded }: onLoadedType) => {
	const user = useAuthStore((state) => state.user);
	const selectedChild = useAuthStore((state) => state.selectedChild);

	const childId = user?.role === 'child' ? user.id : selectedChild?.id;
	const today = new Date();
	const month = format(today, 'yyyy-MM');
	const todayStr = format(today, 'yyyy-MM-dd');
	const yesterday = new Date(today);
	yesterday.setDate(today.getDate() - 1);
	const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

	// SWR でデータ取得（IncomeChart と同じキーなら1回のリクエストを共有）
	const { data, isLoading } = useMonthlyAmount(childId, month);

	// ローディング完了を親に通知（既存の onLoaded 互換性維持）
	useEffect(() => {
		if (!isLoading) {
			onLoaded?.();
		}
	}, [isLoading, onLoaded]);

	// breakdown から今日・昨日の金額を導出
	const todayEntry = data?.breakdown?.find((entry) => entry.date === todayStr);
	const yesterdayEntry = data?.breakdown?.find((entry) => entry.date === yesterdayStr);
	const amount = todayEntry?.total ?? data?.totalAmount ?? 0;
	const diff =
		todayEntry && yesterdayEntry ? todayEntry.total - yesterdayEntry.total : null;

	if (isLoading || !childId) {
		return (
			<div className="flex justify-center items-center gap-6 flex-wrap w-full mx-auto mb-6 animate-pulse">
				<div className="w-[180px] h-[180px] rounded-full bg-gray-200" />
				<div className="space-y-3">
					<div className="h-4 w-40 bg-gray-200 rounded" />
					<div className="h-10 w-32 bg-gray-200 rounded" />
					<div className="h-4 w-28 bg-gray-200 rounded" />
				</div>
			</div>
		);
	}

	return (
		<div className="flex justify-center items-center gap-6 flex-wrap w-full mx-auto mb-6">
			<Image src="/piggy_bank.png" alt="豚の貯金箱" width={180} height={180} />
			<div>
				<p className="mb-4">こん月のおこづかいの金がく</p>
				<p className="text-5xl mb-2 quicksand">¥{amount}</p>
				{diff !== null && (
					<p>
						きのうより <span className="quicksand">＋{diff}</span>円
					</p>
				)}
			</div>
		</div>
	);
};
