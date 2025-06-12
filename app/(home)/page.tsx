'use client';

import { CurrentAmount } from '@/components/amount/CurrentAmount';
import { IncomeChart } from '@/components/chart/IncomeChart';
import { useAuthStore } from '@/lib/zustand/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const Home = () => {
	const router = useRouter();
	const { user, isInitialized } = useAuthStore();

	useEffect(() => {
		// ① 復元完了まで待つ
		if (!isInitialized) return;

		// ② 未ログインならサインインへリダイレクト
		if (!user) {
			router.push('/signin');
		}
	}, [isInitialized, user, router]);
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
