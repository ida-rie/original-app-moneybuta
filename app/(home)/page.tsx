'use client';

import { CurrentAmount } from '@/components/amount/CurrentAmount';
import { IncomeChart } from '@/components/chart/IncomeChart';
import { useAuthStore } from '@/lib/zustand/authStore';

const Home = () => {
	const user = useAuthStore((state) => state.user);
	const isInitialized = useAuthStore((state) => state.isInitialized);
	const selectedChild = useAuthStore((state) => state.selectedChild);

	// 復元中、リダイレクト処理中は何も描かない
	if (!isInitialized || !user) return null;

	// 子アカウント未選択
	if (user?.role === 'parent' && !selectedChild) {
		return <p className="mt-8 text-center text-base">子どもアカウントを選択してください</p>;
	}

	// 各コンポーネントが個別にローディング状態を管理するため、
	// ページ全体のオーバーレイは不要（Progressive Loading）
	return (
		<>
			<CurrentAmount />
			<IncomeChart />
		</>
	);
};

export default Home;
