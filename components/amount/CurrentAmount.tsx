'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/lib/zustand/authStore';
import { format } from 'date-fns';
import { MonthlyAmountType } from '@/types/MonthlyAmountType';
import { onLoadedType } from '@/types/onLoadedType';

export const CurrentAmount = ({ onLoaded }: onLoadedType) => {
	// 必要な state のみを取得
	const user = useAuthStore((state) => state.user);
	const selectedChild = useAuthStore((state) => state.selectedChild);
	const [amount, setAmount] = useState<number | null>(0);
	const [diff, setDiff] = useState<number | null>(null);

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
			const yesterday = new Date(today);
			yesterday.setDate(today.getDate() - 1);
			const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

			try {
				const token = sessionStorage.getItem('access_token');

				// 金額取得
				const res = await fetch(`/api/amount/monthly?childId=${childId}&month=${month}`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${token}`,
					},
				});

				if (!res.ok) {
					const error = await res.json();
					throw new Error(error.message || 'APIエラー');
				}

				const json: MonthlyAmountType = await res.json();

				if (!json || !Array.isArray(json.breakdown)) {
					setAmount(json.totalAmount ?? 0);
					setDiff(null);
					onLoaded();
					return;
				}

				const todayEntry = json.breakdown?.find((entry) => entry.date === todayStr);
				const yesterdayEntry = json.breakdown?.find((entry) => entry.date === yesterdayStr);
				const todayTotal = todayEntry?.total ?? json.totalAmount ?? 0;
				// 昨日のデータがない場合（月初・初日など）は diff を null にして非表示にする
				const diffAmount =
					todayEntry && yesterdayEntry
						? todayTotal - yesterdayEntry.total
						: null;

				setAmount(todayTotal);
				setDiff(diffAmount);
			} catch (error) {
				console.error('金額取得エラー:', error);
				setAmount(0);
				setDiff(null);
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
