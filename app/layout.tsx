import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/header/PcHeader';
import BottomNav from '@/components/layout/header/BottomNav';
import MobileHeader from '@/components/layout/header/MobileHeader';

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
							<header className="hidden md:flex items-center justify-between py-4 w-full">
								<Header />
							</header>
							<header className="md:hidden fixed top-0 left-0 right-0 p-2 border-b flex justify-between items-center bg-[var(--color-background)]">
								<MobileHeader />
							</header>
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
