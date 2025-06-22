'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/zustand/authStore';
import signOut from '@/lib/auth/signOut';
// import { Smile } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

import { LogOut } from 'lucide-react';

// タブレット・スマホ幅（767px以下）の時に表示するヘッダー
export const MobileHeader = () => {
	const router = useRouter();

	// 必要な state のみを取得
	const user = useAuthStore((state) => state.user);
	const selectedChild = useAuthStore((state) => state.selectedChild);
	const setSelectedChild = useAuthStore((state) => state.setSelectedChild);

	const handleSignOut = async () => {
		const success = await signOut();
		if (success) {
			toast.success('サインアウトしました');
			router.push('/signin');
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

			{/* 👇 中央に子ども名を表示（Sheetで切替も） */}
			{user?.role === 'parent' && selectedChild && (
				<Sheet>
					<SheetTrigger asChild>
						<button className="text-sm font-bold flex items-center gap-1">
							<Image
								src={selectedChild.iconUrl ?? '/icon/ic_pig.png'}
								alt="子どもアイコン"
								width={20}
								height={20}
								className="rounded-full"
							/>
							{selectedChild.name}
						</button>
					</SheetTrigger>
					<SheetContent side="bottom" className="rounded-t-xl border-t bg-white">
						<SheetHeader>
							<SheetTitle>こどもを選択</SheetTitle>
						</SheetHeader>
						<div className="flex flex-col space-y-4 py-4">
							{user.children.map((child) => (
								<button
									key={child.id}
									onClick={() => setSelectedChild(child)}
									className={`mx-4 px-4 py-3 rounded-lg font-bold text-white ${
										selectedChild.id === child.id
											? 'bg-[var(--color-accent)]'
											: 'bg-[var(--color-brand)]'
									}`}
								>
									{child.name}
								</button>
							))}
						</div>
					</SheetContent>
				</Sheet>
			)}

			{/* <div className=""> */}
			<button className="grid place-items-center" onClick={handleSignOut}>
				<LogOut size={20} />
				<span className="text-[10px]">サインアウト</span>
			</button>
			{/* </div> */}
		</div>
	);
};
