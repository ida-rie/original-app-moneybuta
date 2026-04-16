import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'exsample.supabase.co',
			},
		], // Supabase プロジェクトの画像ホスト
	},
};

export default nextConfig;
