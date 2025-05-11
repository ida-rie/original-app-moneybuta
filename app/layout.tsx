import type { Metadata } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import './globals.css';
import { PcHeader } from '@/components/layout/header/PcHeader';
import { BottomNav } from '@/components/layout/header/BottomNav';
import { MobileHeader } from '@/components/layout/header/MobileHeader';

// Noto Sans JP フォントをインポート
const notoSansJP = Noto_Sans_JP({
	subsets: ['latin'], // 日本語サポート
	weight: '400', // 必要なウェイトを指定
});

// Quicksand フォントをインポート
// const quicksand = Quicksand({
// 	subsets: ['latin'],
// 	weight: '400', // 必要なウェイトを指定
// });

export const metadata: Metadata = {
	title: 'マネぶた おこづかいクエスト',
	description: 'クエスト(お手伝い)をクリアしておこづかいを貯めていくアプリです。',
	icons: {
		icon: '/favicon.ico',
	},
};

const RootLayout = ({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) => {
	console.log(children);
	return (
		<html lang="ja">
			<body className={`${notoSansJP.className} antialiased`}>
				{/* authページはヘッダーを非表示 */}

				{/* PC用 Header */}
				<header className="hidden md:block">
					<div>
						<PcHeader />
					</div>
				</header>

				{/* モバイル用 Header */}
				<header className="md:hidden fixed top-0 left-0 right-0 p-2 border-b flex justify-between items-center bg-[var(--color-background)] z-50">
					<MobileHeader />
				</header>

				{/* Main コンテンツ */}
				<div className="container mx-auto px-4 pt-[50px] md:pt-4">
					<main>{children}</main>
					{/* モバイル用ナビ */}
					<BottomNav />
				</div>

				<footer className="m-6 pb-[50px] md:pb-0 text-center">
					<small>© 2025 マネぶた おこづかいクエスト All rights reserved.</small>
				</footer>
			</body>
		</html>
	);
};

export default RootLayout;
