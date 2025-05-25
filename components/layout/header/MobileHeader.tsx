import React from 'react';
import Image from 'next/image';

type MobileHeaderProps = {
	userIconUrl?: string;
};

export const MobileHeader = ({ userIconUrl }: MobileHeaderProps) => {
	return (
		<>
			<div className="">
				<Image
					src={userIconUrl ? userIconUrl : '/icon/ic_pig.png'}
					alt="ユーザーアイコン"
					width={40}
					height={40}
				/>
			</div>

			<div className="flex items-center gap-4">
				<button className="text-xs">サインアウト</button>
			</div>
		</>
	);
};
