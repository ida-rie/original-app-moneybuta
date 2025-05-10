import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/common/Header';
import BottomNav from '@/components/common/BottomNav';
import MobileHeader from '@/components/common/MobileHeader';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

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
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<div className="container m-auto px-4">
					{auth ?? (
						<>
							<Header />
							<MobileHeader />
							{children}
							<BottomNav />
						</>
					)}
				</div>
			</body>
		</html>
	);
};

export default RootLayout;
