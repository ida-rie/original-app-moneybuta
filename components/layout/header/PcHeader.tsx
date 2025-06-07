'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/lib/zustand/authStore';
import signOut from '@/lib/auth/signOut';
import { Button } from '@/components/ui/button';

// PC幅（768px以上）の時に表示するヘッダー
export const PcHeader = () => {
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
					{/* 親ユーザーのみ子どもを選択を表示する */}
					{user?.role === 'parent' && (
						<Select>
							<SelectTrigger className="w-full text-sm focus-visible:ring-offset-0 focus-visible:ring-0 bg-white">
								<SelectValue placeholder="こどもを選択" />
							</SelectTrigger>
							<SelectContent className="text-sm bg-white">
								{user.children.map((child) => (
									<SelectItem key={child.id} value={child.id}>
										{child.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}
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
						<li>
							<Button variant="delete" onClick={handleSignOut}>
								サインアウト
							</Button>
						</li>
					</ul>
				</nav>
			</div>
		</div>
	);
};
