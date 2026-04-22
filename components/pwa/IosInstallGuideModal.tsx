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
			<DialogContent>
				<DialogHeader>
					<DialogTitle>ホーム画面に追加しよう</DialogTitle>
					<DialogDescription>
						iPhoneでは「共有」からホーム画面に追加すると、アプリのように起動できます。
					</DialogDescription>
				</DialogHeader>

				<div className="text-sm space-y-2">
					<p>1. 画面下の <Share2 className="inline" size={14} /> 共有ボタンをタップ</p>
					<p>2. 「ホーム画面に追加」を選択</p>
					<p>3. 右上の「追加」をタップ</p>
				</div>

				<DialogFooter>
					<Button type="button" variant="primary" onClick={closeGuide}>
						閉じる
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
