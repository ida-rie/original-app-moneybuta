import type { MetadataRoute } from 'next';

const manifest = (): MetadataRoute.Manifest => {
	return {
		name: 'マネぶた おこづかいクエスト',
		short_name: 'マネぶた',
		description: 'クエスト(お手伝い)をクリアしておこづかいを貯めていくアプリです。',
		start_url: '/',
		scope: '/',
		display: 'standalone',
		background_color: '#f9fafb',
		theme_color: '#f9fafb',
		lang: 'ja',
		icons: [
			{
				src: '/pwa/icon-192.jpg',
				sizes: '192x192',
				type: 'image/jpeg',
			},
			{
				src: '/pwa/icon-512.jpg',
				sizes: '512x512',
				type: 'image/jpeg',
			},
			{
				src: '/pwa/icon-512.jpg',
				sizes: '512x512',
				type: 'image/jpeg',
				purpose: 'maskable',
			},
		],
	};
};

export default manifest;
