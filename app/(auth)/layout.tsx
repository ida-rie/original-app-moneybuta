import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'マネぶた おこづかいクエスト',
	description:
		'クエスト(お手伝い)をクリアしておこづかいを貯めていくアプリです。ログインまたは新規登録をしてください。',
};

const AuthLayout = ({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) => {
	return (
		<>
			<main className="flex justify-center">
				<div className="w-full max-w-lg p-6">{children}</div>
			</main>
			<footer className="m-6 pb-[50px] md:pb-0 text-center">
				<small>© 2025 マネぶた おこづかいクエスト All rights reserved.</small>
			</footer>
		</>
	);
};

export default AuthLayout;
