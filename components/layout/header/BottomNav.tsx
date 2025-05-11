import React from 'react';
import Link from 'next/link';
import { Home, ClipboardList, User, Settings, Smile } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export const BottomNav = () => {
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
					<Link href="/chores" className="flex flex-col items-center text-xs">
						<ClipboardList size={20} />
						おてつだい
					</Link>
				</li>
				<li>
					<Link href="/mypage" className="flex flex-col items-center text-xs">
						<User size={20} />
						マイページ
					</Link>
				</li>
				<li>
					<Link href="/settings" className="flex flex-col items-center text-xs">
						<Settings size={20} />
						設定
					</Link>
				</li>
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
								{/* 自由に選択肢を構成 */}
								<button className="mx-4 px-4 py-3 text-center text-base font-bold rounded-lg bg-[var(--color-brand)] text-white transition">
									太郎
								</button>
								<button className="mx-4 px-4 py-3 text-center text-base font-bold rounded-lg bg-[var(--color-brand)] text-white transition">
									花子
								</button>
							</div>
						</SheetContent>
					</Sheet>
				</li>
			</ul>
		</nav>
	);
};
