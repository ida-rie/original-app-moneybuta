import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { UserRound } from 'lucide-react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

type PcHeaderProps = {
	userIconUrl?: string;
};

export const PcHeader = ({ userIconUrl }: PcHeaderProps) => {
	return (
		<div className="w-full">
			<div className="flex items-center justify-between py-4 container mx-auto px-4">
				<div className="flex items-center gap-4">
					<div className="w-15 h-15 relative flex justify-center items-center">
						{userIconUrl ? (
							<Image src={userIconUrl} alt="Icon" fill className="rounded-full object-cover" />
						) : (
							<div className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow text-gray-500">
								<UserRound size={30} className="rounded-full object-cover" />
							</div>
						)}
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
							<Link href="/chores">クエスト</Link>
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
