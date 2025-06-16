'use client';

import { CurrentAmount } from '@/components/amount/CurrentAmount';
import { IncomeChart } from '@/components/chart/IncomeChart';
import { useAuthStore } from '@/lib/zustand/authStore';
import { useState } from 'react';

const Home = () => {
	const { user, isInitialized, selectedChild } = useAuthStore();
	const [amountLoaded, setAmountLoaded] = useState(false);
	const [chartLoaded, setChartLoaded] = useState(false);

	const isAllLoaded = amountLoaded && chartLoaded;

	// 復元中、リダイレクト処理中は何も描かない
	if (!isInitialized || !user) return null;

	// 子アカウント未選択
	if (user?.role === 'parent' && !selectedChild) {
		return <p className="mt-8 text-center text-base">子どもアカウントを選択してください</p>;
	}

	return (
		<>
			<CurrentAmount onLoaded={() => setAmountLoaded(true)} />
			<IncomeChart onLoaded={() => setChartLoaded(true)} />

			{/* ✅ ローディング中ならオーバーレイ表示 */}
			{!isAllLoaded && (
				<div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
					<p className="text-xl font-semibold">よみこみ中...</p>
				</div>
			)}
		</>
	);
};

export default Home;
