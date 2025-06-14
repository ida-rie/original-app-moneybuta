'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/lib/zustand/authStore';

export const CurrentAmount = () => {
	const { user, selectedChild } = useAuthStore();
	const [amount, setAmount] = useState<number | null>(null);
	const [diff, setDiff] = useState<number>(0);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchAmount = async () => {
			// 子ユーザーなら自分のIDを使う
			const childId = user?.role === 'child' ? user.id : selectedChild?.id;

			if (!childId) return;

			try {
				const res = await fetch(`/api/amount/today?childId=${childId}`, {
					headers: {
						Authorization: `Bearer ${sessionStorage.getItem('access_token')}`,
					},
				});

				if (!res.ok) {
					const errorData = await res.json();
					if (res.status === 404) {
						// basicAmount未設定 → 金額ゼロとして扱う
						setAmount(0);
						setDiff(0);
						setLoading(false);
						return;
					}
					throw new Error(errorData.error || 'APIエラー');
				}

				const data = await res.json();
				console.log('APIレスポンス', data);
				setAmount(data.todayAmount);
				setDiff(data.diff);
			} catch (error) {
				console.error('金額取得エラー:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchAmount();
	}, [user, selectedChild]);

	if (loading) {
		return <p className="text-center mt-4">よみこみ中…</p>;
	}

	return (
		<div className="flex justify-center items-center gap-6 flex-wrap w-full mx-auto mb-6">
			<Image src="/piggy_bank.png" alt="豚の貯金箱" width={180} height={180} />
			<div>
				<p className="mb-4">おこづかいの金がく</p>
				<p className="text-5xl mb-2 quicksand">¥{amount}</p>
				<p>
					きのうより{' '}
					<span className="quicksand">
						{diff >= 0 ? '+' : ''}
						{diff}
					</span>
					円
				</p>
			</div>
		</div>
	);
};
