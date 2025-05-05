import React from 'react';

const MobileHeader = () => {
	return (
		<div className="md:hidden fixed top-0 left-0 right-0 p-2 border-b flex justify-between items-center bg-[var(--color-background)]">
			<div>icon</div>

			<div className="flex items-center gap-4">
				<button className="text-sm">サインアウト</button>
			</div>
		</div>
	);
};

export default MobileHeader;
