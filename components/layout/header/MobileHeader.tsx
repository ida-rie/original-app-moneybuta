'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/zustand/authStore';
import signOut from '@/lib/auth/signOut';

import { LogOut } from 'lucide-react';

// タブレット・スマホ幅（767px以下）の時に表示するヘッダー
export const MobileHeader = () => {
	const router = useRouter();

	const user = useAuthStore((state) => state.user);

	const handleSignOut = async () => {
		const success = await signOut();
		if (success) {
			toast.success('サインアウトしました');
			setTimeout(() => {
				router.push('/signin');
			}, 800);
		} else {
			toast.error('サインアウトに失敗しました');
		}
	};

	return (
		<div className="flex items-center justify-between">
			<div className="">
				<Image
					src={user?.iconUrl ? user.iconUrl : '/icon/ic_pig.png'}
					alt="ユーザーアイコン"
					width={40}
					height={40}
				/>
			</div>

			<div className="">
				<button className="grid place-items-center" onClick={handleSignOut}>
					<LogOut size={20} />
					<span className="text-[10px]">サインアウト</span>
				</button>
			</div>
		</div>
	);
};
