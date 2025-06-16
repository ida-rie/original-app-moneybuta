'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/lib/zustand/authStore';
import { format, subDays } from 'date-fns';
import { MonthlyAmountType } from '@/types/MonthlyAmountType';
import { onLoadedType } from '@/types/onLoadedType';

export const CurrentAmount = ({ onLoaded }: onLoadedType) => {
	const { user, selectedChild } = useAuthStore();
	const [amount, setAmount] = useState<number | null>(0);
	const [diff, setDiff] = useState<number>(0);

	useEffect(() => {
		const fetchAmount = async () => {
			// 子ユーザーなら自分のIDを使う
			const childId = user?.role === 'child' ? user.id : selectedChild?.id;

			if (!childId) {
				onLoaded();
				return;
			}

			const today = new Date();
			const month = format(today, 'yyyy-MM');
			const todayStr = format(today, 'yyyy-MM-dd');
			const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');

			try {
				const token = sessionStorage.getItem('access_token');
				const res = await fetch(`/api/amount/monthly?childId=${childId}&month=${month}`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`,
					},
				});
				const json: MonthlyAmountType = await res.json();

				if (!json || !Array.isArray(json.breakdown)) {
					console.warn('breakdownが存在しないため、今日の金額はtotalAmountで代用');
					setAmount(json.totalAmount ?? 0);
					setDiff(0);
					onLoaded();
					return;
				}

				const todayEntry = json.breakdown.find((entry) => entry.date === todayStr);
				const yesterdayEntry = json.breakdown.find((entry) => entry.date === yesterdayStr);

				const todayTotal = todayEntry?.total ?? json.totalAmount ?? 0;
				const yesterdayTotal = yesterdayEntry?.total ?? 0;

				setAmount(todayTotal);
				setDiff(todayTotal - yesterdayTotal);
			} catch (error) {
				console.error('金額取得エラー:', error);
				setAmount(0);
				setDiff(0);
			} finally {
				onLoaded();
			}
		};

		fetchAmount();
	}, [user, selectedChild, onLoaded]);

	return (
		<div className="flex justify-center items-center gap-6 flex-wrap w-full mx-auto mb-6">
			<Image src="/piggy_bank.png" alt="豚の貯金箱" width={180} height={180} />
			<div>
				<p className="mb-4">おこづかいの金がく</p>
				<p className="text-5xl mb-2 quicksand">¥{amount}</p>
				<p>
					きのうより{' '}
					<span className="quicksand">
						{diff >= 0 ? '＋' : ''}
						{Math.abs(diff)}
					</span>
					円
				</p>
			</div>
		</div>
	);
};
