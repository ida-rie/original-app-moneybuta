import type { Metadata } from 'next';
import { PcHeader } from '@/components/layout/header/PcHeader';
import { BottomNav } from '@/components/layout/header/BottomNav';
import { MobileHeader } from '@/components/layout/header/MobileHeader';

// Quicksand フォントをインポート
// const quicksand = Quicksand({
// 	subsets: ['latin'],
// 	weight: '400', // 必要なウェイトを指定
// });

export const metadata: Metadata = {
	title: 'ホーム | マネぶた',
	description: 'ホーム画面です',
};

const RootLayout = ({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) => {
	return (
		<>
			<header>
				{/* PC用 Header */}
				<div className="hidden md:block">
					<PcHeader userIconUrl="" />
				</div>
				{/* モバイル用 Header */}
				<div className="md:hidden fixed top-0 left-0 right-0 p-2 border-b flex justify-between items-center bg-[var(--color-background)] z-50">
					<MobileHeader userIconUrl="" />
				</div>
			</header>

			{/* Main コンテンツ */}
			<main className="container mx-auto px-4 pt-[60px] md:pt-4">{children}</main>

			{/* モバイル用ナビ */}
			<BottomNav />
		</>
	);
};

export default RootLayout;
