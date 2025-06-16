import React from 'react';

const Loading = () => {
	return (
		<div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
			<p className="text-xl font-semibold">よみこみ中...</p>
		</div>
	);
};

export default Loading;
