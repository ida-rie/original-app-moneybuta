import React from 'react';
import Link from 'next/link';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

const PcHeader = () => {
	return (
		<>
			<div className="flex items-center gap-4">
				<div>icon</div>
				<Select>
					<SelectTrigger className="w-full text-sm focus-visible:ring-offset-0 focus-visible:ring-0">
						<SelectValue placeholder="こどもを選択" />
					</SelectTrigger>
					<SelectContent className="text-sm bg-[var(--color-background)]">
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
						<Link href="/chores">おてつだい</Link>
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
		</>
	);
};

export default PcHeader;
