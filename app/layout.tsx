import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { Toaster } from 'sonner';
import { InstallPromptBanner } from '@/components/pwa/InstallPromptBanner';
import { IosInstallGuideModal } from '@/components/pwa/IosInstallGuideModal';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';
import './globals.css';

// ローカル同梱した Noto Sans JP を使用して build 時の外部通信をなくす
const notoSansJP = localFont({
	src: './fonts/NotoSansJP-Regular.woff2',
	weight: '400',
	style: 'normal',
	display: 'swap',
});

export const metadata: Metadata = {
	title: 'マネぶた おこづかいクエスト',
	description: 'クエスト(お手伝い)をクリアしておこづかいを貯めていくアプリです。',
	manifest: '/manifest.webmanifest',
	appleWebApp: {
		capable: true,
		title: 'マネぶた',
		statusBarStyle: 'default',
	},
	icons: {
		icon: '/favicon.ico',
		apple: '/pwa/apple-touch-icon.jpg',
	},
};

export const viewport: Viewport = {
	themeColor: '#f9fafb',
};

const RootLayout = ({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) => {
	return (
		<html lang="ja">
			<body className={`${notoSansJP.className} antialiased flex flex-col min-h-svh`}>
				<ServiceWorkerRegister />
				<InstallPromptBanner />
				<IosInstallGuideModal />
				{/* Main コンテンツ */}
				<div className="grow-1">{children}</div>
				{/* トースター */}
				<Toaster position="top-left" />
			</body>
		</html>
	);
};

export default RootLayout;
