'use client';

import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/zustand/authStore';
import { useRefreshContext } from '@/contexts/RefreshContext';

type RefreshButtonProps = {
	className?: string;
};

export const RefreshButton = ({ className }: RefreshButtonProps) => {
	const userRole = useAuthStore((state) => state.user?.role);
	const { refreshAll, isRefreshing } = useRefreshContext();

	const label = userRole === 'child' ? 'こうしん' : '更新';

	const handleClickRefresh = async () => {
		try {
			const result = await refreshAll('manual');
			if (result === 'updated') {
				toast.success('最新情報に更新しました');
			}
		} catch (error) {
			console.error('更新エラー:', error);
			toast.error('更新に失敗しました');
		}
	};

	return (
		<Button
			type="button"
			variant="outline"
			size="sm"
			onClick={handleClickRefresh}
			disabled={isRefreshing}
			className={className}
			aria-label={label}
		>
			<RefreshCw className={isRefreshing ? 'animate-spin' : ''} />
			<span>{label}</span>
		</Button>
	);
};
