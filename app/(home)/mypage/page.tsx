'use client';

import React from 'react';
import { HelpCircle, ShieldUser } from 'lucide-react';
import MainTitle from '@/components/layout/header/headline/MainTitle';
import UserProfile from '@/components/mypage/UserProfile';
import ChildAccountList from '@/components/mypage/ChildAccountList';
import { Smile } from 'lucide-react';
import { useAuthStore } from '@/lib/zustand/authStore';
import Link from 'next/link';

const MyPage = () => {
	// 必要な state のみを取得
	const user = useAuthStore((state) => state.user);

	return (
		<>
			{/* 見出し */}
			<MainTitle title="マイページ" icon={ShieldUser} />
			<UserProfile user={user} />

			{user?.role === 'parent' && (
				<div className="mt-10">
					<MainTitle title="子供アカウントの一覧" icon={Smile} />
					<ChildAccountList childrenData={user.children} />
				</div>
			)}

			<div className="mt-12 px-4 flex justify-center">
				<Link href="/guide?from=mypage" className="hover:underline flex items-center gap-1">
					<HelpCircle size={16} />
					アプリの使い方ガイドを見る
				</Link>
			</div>
		</>
	);
};

export default MyPage;
