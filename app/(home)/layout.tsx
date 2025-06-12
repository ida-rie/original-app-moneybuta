import type { Metadata } from 'next';
import { PcHeader } from '@/components/layout/header/PcHeader';
import { BottomNav } from '@/components/layout/header/BottomNav';
import { MobileHeader } from '@/components/layout/header/MobileHeader';
import ClientProvider from '@/contexts/ClientProvider';
import AuthGuard from '@/components/auth/AuthGuard';

export const metadata: Metadata = {
	title: 'ホーム | マネぶた おこづかいクエスト',
	description: 'ホーム画面です。月別のおこづかいの履歴が確認できます。',
};

const RootLayout = ({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) => {
	return (
		<ClientProvider>
			<AuthGuard>
				<header>
					{/* PC用 Header */}
					<div className="hidden md:block">
						<PcHeader />
					</div>
					{/* モバイル用 Header */}
					<div className="md:hidden fixed top-0 left-0 right-0 p-2 border-b bg-[var(--color-background)] z-50">
						<MobileHeader />
					</div>
				</header>

				{/* Main コンテンツ */}
				<main className="container mx-auto px-4 pt-[60px] md:pt-4">{children}</main>

				<footer className="m-6 pb-[50px] md:pb-0 text-center">
					<small>© 2025 マネぶた おこづかいクエスト All rights reserved.</small>
				</footer>

				{/* モバイル用ナビ */}
				<BottomNav />
			</AuthGuard>
		</ClientProvider>
	);
};

export default RootLayout;
