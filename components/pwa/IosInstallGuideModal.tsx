'use client';

import { useEffect, useState } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';

const DISMISSED_KEY = 'ios_install_guide_dismissed_v1';

const isStandalone = () => {
	if (typeof window === 'undefined') return false;
	const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone;
	return window.matchMedia('(display-mode: standalone)').matches || !!iosStandalone;
};

const isIosSafari = () => {
	if (typeof navigator === 'undefined') return false;
	const ua = navigator.userAgent;
	const isIos = /iPad|iPhone|iPod/.test(ua);
	const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
	return isIos && isSafari;
};

export const IosInstallGuideModal = () => {
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (!isIosSafari()) return;
		if (isStandalone()) return;
		if (localStorage.getItem(DISMISSED_KEY) === '1') return;

		const timer = window.setTimeout(() => {
			setOpen(true);
		}, 1200);

		return () => window.clearTimeout(timer);
	}, []);

	const closeGuide = () => {
		localStorage.setItem(DISMISSED_KEY, '1');
		setOpen(false);
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) {
					localStorage.setItem(DISMISSED_KEY, '1');
				}
				setOpen(nextOpen);
			}}
		>
			<DialogContent className="max-w-[92vw] sm:max-w-md p-5 bg-[var(--color-card-bg)] border border-[var(--color-border)]">
				<DialogHeader className="space-y-2">
					<DialogTitle className="text-base leading-relaxed">ホーム画面に追加しよう</DialogTitle>
					<DialogDescription className="text-sm leading-relaxed">
						iPhoneでは「共有」からホーム画面に追加すると、アプリのように起動できます。
					</DialogDescription>
				</DialogHeader>

				<div className="mt-2 space-y-2">
					<div className="rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] p-3">
						<p className="text-sm leading-relaxed text-[var(--color-text)]">
							<span className="font-semibold mr-2">1.</span>
							画面下の共有ボタンをタップ
							<span className="inline-flex align-middle ml-2 rounded-md bg-white border border-[var(--color-border)] p-1">
								<Share2 size={14} />
							</span>
						</p>
					</div>
					<div className="rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] p-3">
						<p className="text-sm leading-relaxed text-[var(--color-text)]">
							<span className="font-semibold mr-2">2.</span>
							「ホーム画面に追加」を選択
						</p>
					</div>
					<div className="rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] p-3">
						<p className="text-sm leading-relaxed text-[var(--color-text)]">
							<span className="font-semibold mr-2">3.</span>
							右上の「追加」をタップ
						</p>
					</div>
				</div>

				<DialogFooter className="mt-2">
					<Button type="button" variant="primary" onClick={closeGuide}>
						閉じる
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
