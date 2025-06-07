'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/lib/zustand/authStore';

export const PcHeader = () => {
	const user = useAuthStore((state) => state.user);

	return (
		<div className="w-full">
			<div className="flex items-center justify-between py-4 container mx-auto px-4">
				<div className="flex items-center gap-4">
					<div className="flex justify-center items-center">
						<Image
							src={user?.iconUrl ? user.iconUrl : '/icon/ic_pig.png'}
							alt="ユーザーアイコン"
							width={60}
							height={60}
						/>
					</div>
					<Select>
						<SelectTrigger className="w-full text-sm focus-visible:ring-offset-0 focus-visible:ring-0 bg-white">
							<SelectValue placeholder="こどもを選択" />
						</SelectTrigger>
						<SelectContent className="text-sm bg-white">
							<SelectItem value="light">太郎</SelectItem>
							<SelectItem value="dark">花子</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<nav>
					<ul className="flex items-center text-sm gap-6">
						<li>
							<Link href="/">ホーム</Link>
						</li>
						<li>
							<Link href="/quest">クエスト</Link>
						</li>
						<li>
							<Link href="/mypage">マイページ</Link>
						</li>
						<li>
							<Link href="/settings">設定</Link>
						</li>
						<li>サインアウト</li>
					</ul>
				</nav>
			</div>
		</div>
	);
};
