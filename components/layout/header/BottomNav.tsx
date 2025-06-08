'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Home, Swords, ShieldUser, Settings, Smile } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuthStore } from '@/lib/zustand/authStore';

// タブレット幅〜（767px以下）の時に表示するナビ
export const BottomNav = () => {
	const { user, selectedChild, setSelectedChild } = useAuthStore();

	// 初期表示時に自動で0番目の子を選択
	useEffect(() => {
		if (user?.role === 'parent' && user.children.length > 0 && selectedChild === null) {
			setSelectedChild(user.children[0]);
		}
	}, [user, selectedChild, setSelectedChild]);

	return (
		<nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-brand)] text-white">
			<ul className="flex justify-around items-center py-2">
				<li>
					<Link href="/" className="flex flex-col items-center text-xs">
						<Home size={20} />
						ホーム
					</Link>
				</li>
				<li>
					<Link href="/quest" className="flex flex-col items-center text-xs">
						<Swords size={20} />
						クエスト
					</Link>
				</li>
				<li>
					<Link href="/mypage" className="flex flex-col items-center text-xs">
						<ShieldUser size={20} />
						マイページ
					</Link>
				</li>
				<li>
					<Link href="/settings" className="flex flex-col items-center text-xs">
						<Settings size={20} />
						設定
					</Link>
				</li>
				{/* 親ユーザーのみ子どもを選択を表示する */}
				{user?.role === 'parent' && (
					<li>
						<Sheet>
							<SheetTrigger asChild>
								<button className="flex flex-col items-center text-xs">
									<Smile size={20} />
									こども
								</button>
							</SheetTrigger>
							<SheetContent
								side="bottom"
								className="bg-[var(--color-background)] border-t border-gray-200 rounded-t-xl"
							>
								<SheetHeader>
									<SheetTitle>こどもを選択</SheetTitle>
								</SheetHeader>
								<div className="flex flex-col space-y-4 py-4">
									{user.children.length > 0 ? (
										user.children.map((child) => (
											<button
												key={child.id}
												onClick={() => setSelectedChild(child)}
												className={`mx-4 px-4 py-3 text-center text-base font-bold rounded-lg transition ${
													selectedChild?.id === child.id
														? 'bg-[var(--color-accent)] text-white'
														: 'bg-[var(--color-brand)] text-white'
												}`}
											>
												{child.name}
											</button>
										))
									) : (
										<p className="text-center text-sm text-gray-500">
											子どもアカウントがありません
										</p>
									)}
								</div>
							</SheetContent>
						</Sheet>
					</li>
				)}
			</ul>
		</nav>
	);
};
