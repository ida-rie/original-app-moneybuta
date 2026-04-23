'use client';

import type React from 'react';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useRefreshContext } from '@/contexts/RefreshContext';

const PULL_THRESHOLD_PX = 72;
const MAX_PULL_DISTANCE_PX = 120;

type PullToRefreshProps = {
	children: React.ReactNode;
};

export const PullToRefresh = ({ children }: PullToRefreshProps) => {
	const { refreshAll } = useRefreshContext();

	const [pullDistance, setPullDistance] = useState(0);
	const [isPullRefreshing, setIsPullRefreshing] = useState(false);

	const startYRef = useRef<number | null>(null);
	const startXRef = useRef<number | null>(null);
	const isPullingRef = useRef(false);

	const isReadyToRefresh = pullDistance >= PULL_THRESHOLD_PX;

	const indicatorMessage = useMemo(() => {
		if (isPullRefreshing) return '更新中...';
		return isReadyToRefresh ? 'はなして更新' : '引っぱって更新';
	}, [isPullRefreshing, isReadyToRefresh]);

	const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (event) => {
		if (isPullRefreshing) return;
		if (window.scrollY > 0) return;

		const touch = event.touches[0];
		startYRef.current = touch.clientY;
		startXRef.current = touch.clientX;
		isPullingRef.current = true;
	};

	const onTouchMove: React.TouchEventHandler<HTMLDivElement> = (event) => {
		if (!isPullingRef.current || startYRef.current === null || startXRef.current === null) {
			return;
		}

		const touch = event.touches[0];
		const deltaY = touch.clientY - startYRef.current;
		const deltaX = Math.abs(touch.clientX - startXRef.current);

		if (deltaY <= 0) {
			setPullDistance(0);
			return;
		}

		if (deltaX > deltaY) {
			setPullDistance(0);
			return;
		}

		const clamped = Math.min(deltaY, MAX_PULL_DISTANCE_PX);
		setPullDistance(clamped);
	};

	const resetPull = () => {
		startYRef.current = null;
		startXRef.current = null;
		isPullingRef.current = false;
		setPullDistance(0);
	};

	const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = async () => {
		if (!isPullingRef.current) return;

		const shouldRefresh = pullDistance >= PULL_THRESHOLD_PX;
		if (!shouldRefresh) {
			resetPull();
			return;
		}

		setIsPullRefreshing(true);
		try {
			const result = await refreshAll('pull');
			if (result === 'updated') {
				toast.success('最新情報に更新しました');
			}
		} catch (error) {
			console.error('Pull to Refresh error:', error);
			toast.error('更新に失敗しました');
		} finally {
			setIsPullRefreshing(false);
			resetPull();
		}
	};

	const contentTranslate = isPullRefreshing ? PULL_THRESHOLD_PX / 2 : pullDistance * 0.5;

	return (
		<div
			onTouchStart={onTouchStart}
			onTouchMove={onTouchMove}
			onTouchEnd={onTouchEnd}
			style={{ overscrollBehaviorY: 'contain' }}
		>
			<div
				className={cn(
					'pointer-events-none grid place-items-center text-xs text-[var(--color-text-secondary)] transition-all duration-200',
					pullDistance > 0 || isPullRefreshing ? 'h-10 opacity-100' : 'h-0 opacity-0'
				)}
			>
				<span>{indicatorMessage}</span>
			</div>
			<div style={{ transform: `translateY(${contentTranslate}px)` }} className="transition-transform duration-200">
				{children}
			</div>
		</div>
	);
};
