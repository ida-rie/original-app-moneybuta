import React from 'react';
import Image from 'next/image';

export const CurrentAmount = () => {
	return (
		<div className="flex justify-center items-center gap-6 flex-wrap w-full mx-auto mb-6">
			<Image src="/piggy_bank.png" alt="豚の貯金箱" width={180} height={180} />
			<div>
				<p className="mb-4">おこづかいの金がく</p>
				<p className="text-5xl mb-2 quicksand">¥500</p>
				<p>
					きのうより <span className="quicksand">+50</span>円
				</p>
			</div>
		</div>
	);
};
