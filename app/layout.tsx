import type { Metadata } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import './globals.css';
import PcHeader from '@/components/layout/header/PcHeader';
import BottomNav from '@/components/layout/header/BottomNav';
import MobileHeader from '@/components/layout/header/MobileHeader';

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

// const RootLayout = ({
// 	children,
// }: Readonly<{
// 	children: React.ReactNode;
// }>) => {
// 	return (
// 		<html lang="ja">
// 			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
// 				<div className="container m-auto px-4">
// 					<Header />
// 					<MobileHeader />

// 					{children}
// 					<BottomNav />
// 				</div>
// 			</body>
// 		</html>
// 	);
// };

const RootLayout = ({
	children,
	auth,
}: Readonly<{
	children: React.ReactNode;
	auth: React.ReactNode;
}>) => {
	return (
		<html lang="ja">
			<body className={`${notoSansJP.className} antialiased`}>
				{/* authページ以外はヘッダー表示 */}
				{!auth && (
					<>
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
					</>
				)}

				{/* Main コンテンツ */}
				<div className="container mx-auto px-4 pt-4">
					{children}
					{/* モバイル用ナビ */}
					{!auth && <BottomNav />}
				</div>

				<footer className="m-6 pb-[50px] md:pb-0 text-center">
					<small>© 2025 マネぶた おこづかいクエスト All rights reserved.</small>
				</footer>
			</body>
		</html>
	);
};

export default RootLayout;
