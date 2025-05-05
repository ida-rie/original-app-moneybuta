import React from 'react';
import Link from 'next/link';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

const Header = () => {
	return (
		<header className="hidden md:flex items-center justify-between py-4 w-full">
			<div>icon</div>
			<nav>
				<ul className="flex items-center text-sm gap-6">
					<li>
						<Link href="/">ホーム</Link>
					</li>
					<li>
						<Link href="/chores">おてつだい</Link>
					</li>
					<li>
						<Link href="/mypage">マイページ</Link>
					</li>
					<li>
						<Link href="/settings">設定</Link>
					</li>
					<li>
						<Select>
							<SelectTrigger className="w-full text-sm focus-visible:ring-offset-0 focus-visible:ring-0">
								<SelectValue placeholder="こどもを選択" />
							</SelectTrigger>
							<SelectContent className="text-sm">
								<SelectItem value="light">太郎</SelectItem>
								<SelectItem value="dark">花子</SelectItem>
							</SelectContent>
						</Select>
					</li>
				</ul>
			</nav>
		</header>
	);
};

export default Header;
