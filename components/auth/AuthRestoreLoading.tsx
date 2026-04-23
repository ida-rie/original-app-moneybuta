'use client';

const AuthRestoreLoading = () => {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-white/85">
			<div className="flex items-center gap-3 text-[var(--color-primary)]">
				<div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
				<p className="text-sm font-medium">ログイン状態を確認中...</p>
			</div>
		</div>
	);
};

export default AuthRestoreLoading;
