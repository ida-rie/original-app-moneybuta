import React from 'react';
import Link from 'next/link';
import { Home, ClipboardList, User, Settings } from 'lucide-react';
import BottomChildSwitcher from '../elements/BottomChildSwitcher';

function BottomNav() {
	return (
		<nav className="md:hidden fixed bottom-0 left-0 right-0 border-t shadow z-50">
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
					<BottomChildSwitcher />
				</li>
			</ul>
		</nav>
	);
}

export default BottomNav;
