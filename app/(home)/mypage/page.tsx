'use client';

import React from 'react';
import { ShieldUser } from 'lucide-react';
import MainTitle from '@/components/layout/header/headline/MainTitle';
import UserProfile from '@/components/mypage/UserProfile';
import ChildAccountList from '@/components/mypage/ChildAccountList';
import { Smile } from 'lucide-react';
import { useAuthStore } from '@/lib/zustand/authStore';

const MyPage = () => {
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
		</>
	);
};

export default MyPage;
