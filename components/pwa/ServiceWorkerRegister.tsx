'use client';

import { useEffect } from 'react';

export const ServiceWorkerRegister = () => {
	useEffect(() => {
		if (!('serviceWorker' in navigator)) return;

		const registerServiceWorker = async () => {
			try {
				await navigator.serviceWorker.register('/sw.js', {
					scope: '/',
				});
			} catch (error) {
				console.error('Service Worker registration failed:', error);
			}
		};

		window.addEventListener('load', registerServiceWorker);

		return () => {
			window.removeEventListener('load', registerServiceWorker);
		};
	}, []);

	return null;
};
