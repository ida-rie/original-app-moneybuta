import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: '認証 | マネぶた',
	description: 'ログインまたは新規登録をしてください',
};

const AuthLayout = ({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) => {
	return (
		<div className="flex justify-center">
			<div className="w-full max-w-lg p-6">{children}</div>
		</div>
	);
};

export default AuthLayout;
