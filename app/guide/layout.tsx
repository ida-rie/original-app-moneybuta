import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'マネぶた おこづかいクエスト',
	description: 'マネぶたアプリの使い方です。',
};

const GuideLayout = ({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) => {
	return (
		<div className="bg-[#f9fafb] text-gray-900 min-h-screen flex flex-col">
			<main className="min-h-screen px-4 py-8">{children}</main>

			<footer className="m-6 text-center">
				<small>© 2025 マネぶた おこづかいクエスト All rights reserved.</small>
			</footer>
		</div>
	);
};

export default GuideLayout;
