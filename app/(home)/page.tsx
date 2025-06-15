'use client';

import { CurrentAmount } from '@/components/amount/CurrentAmount';
import { IncomeChart } from '@/components/chart/IncomeChart';
import { useAuthStore } from '@/lib/zustand/authStore';

const Home = () => {
	const { user, isInitialized } = useAuthStore();

	// 復元中は何も描かない
	if (!isInitialized) return null;

	// リダイレクト処理中は仮に何も描かない
	if (!user) return null;

	return (
		<>
			<CurrentAmount />
			<IncomeChart />
		</>
	);
};

export default Home;
