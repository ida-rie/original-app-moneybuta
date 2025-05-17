import type { Metadata } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import './globals.css';

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
	return (
		<html lang="ja">
			<body className={`${notoSansJP.className} antialiased flex flex-col min-h-svh`}>
				{/* Main コンテンツ */}
				<div className="grow-1">{children}</div>

				<footer className="m-6 pb-[50px] md:pb-0 text-center">
					<small>© 2025 マネぶた おこづかいクエスト All rights reserved.</small>
				</footer>
			</body>
		</html>
	);
};

export default RootLayout;
