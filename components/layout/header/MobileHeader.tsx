import React from 'react';
import Image from 'next/image';
import { UserRound } from 'lucide-react';

type MobileHeaderProps = {
	userIconUrl?: string;
};

export const MobileHeader = ({ userIconUrl }: MobileHeaderProps) => {
	return (
		<>
			<div className="w-8 h-8 relative">
				{userIconUrl ? (
					<Image src={userIconUrl} alt="Icon" fill className="rounded-full object-cover" />
				) : (
					<div className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow text-gray-500">
						<UserRound size={20} />
					</div>
				)}
			</div>

			<div className="flex items-center gap-4">
				<button className="text-xs">サインアウト</button>
			</div>
		</>
	);
};
