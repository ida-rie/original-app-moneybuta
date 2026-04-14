'use client';

import { CurrentAmount } from '@/components/amount/CurrentAmount';
import { IncomeChart } from '@/components/chart/IncomeChart';
import { useAuthStore } from '@/lib/zustand/authStore';
import { useCallback, useState } from 'react';

const Home = () => {
	// 必要な state のみを取得
	const user = useAuthStore((state) => state.user);
	const isInitialized = useAuthStore((state) => state.isInitialized);
	const selectedChild = useAuthStore((state) => state.selectedChild);

	const [amountLoaded, setAmountLoaded] = useState(false);
	const [chartLoaded, setChartLoaded] = useState(false);

	const isAllLoaded = amountLoaded && chartLoaded;

	// インライン関数の都度生成を防ぎ、useEffect の無限ループを回避する
	const handleAmountLoaded = useCallback(() => setAmountLoaded(true), []);
	const handleChartLoaded = useCallback(() => setChartLoaded(true), []);

	// 復元中、リダイレクト処理中は何も描かない
	if (!isInitialized || !user) return null;

	// 子アカウント未選択
	if (user?.role === 'parent' && !selectedChild) {
		return <p className="mt-8 text-center text-base">子どもアカウントを選択してください</p>;
	}

	return (
		<>
			<CurrentAmount onLoaded={handleAmountLoaded} />
			<IncomeChart onLoaded={handleChartLoaded} />

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
