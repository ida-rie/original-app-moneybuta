import { useState, useEffect } from 'react';

export const useWindowSize = () => {
	const [windowSize, setWindowSize] = useState({
		width: 0,
		height: 0,
	});

	useEffect(() => {
		const handleResize = () => {
			setWindowSize({
				width: window.innerWidth,
				height: window.innerHeight,
			});
		};

		window.addEventListener('resize', handleResize);

		// 初期値設定
		handleResize();

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, []);

	return windowSize;
};
