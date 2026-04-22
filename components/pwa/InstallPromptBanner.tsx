'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

type BeforeInstallPromptEvent = Event & {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const DISMISSED_KEY = 'pwa_install_prompt_dismissed_v1';

const isStandalone = () => {
	if (typeof window === 'undefined') return false;
	return window.matchMedia('(display-mode: standalone)').matches;
};

const isAndroidChromium = () => {
	if (typeof navigator === 'undefined') return false;
	const ua = navigator.userAgent.toLowerCase();
	const isAndroid = ua.includes('android');
	const isChromium = ua.includes('chrome') || ua.includes('edg') || ua.includes('opr');
	return isAndroid && isChromium;
};

export const InstallPromptBanner = () => {
	const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
	const [visible, setVisible] = useState(false);
	const [installing, setInstalling] = useState(false);

	const canShowBanner = useMemo(() => {
		if (typeof window === 'undefined') return false;
		if (isStandalone()) return false;
		if (!isAndroidChromium()) return false;
		return localStorage.getItem(DISMISSED_KEY) !== '1';
	}, []);

	useEffect(() => {
		if (!canShowBanner) return;

		const onBeforeInstallPrompt = (event: Event) => {
			event.preventDefault();
			setDeferredPrompt(event as BeforeInstallPromptEvent);
			setVisible(true);
		};

		const onInstalled = () => {
			setVisible(false);
			setDeferredPrompt(null);
		};

		window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
		window.addEventListener('appinstalled', onInstalled);

		return () => {
			window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
			window.removeEventListener('appinstalled', onInstalled);
		};
	}, [canShowBanner]);

	if (!visible || !deferredPrompt) return null;

	const handleInstall = async () => {
		setInstalling(true);
		try {
			await deferredPrompt.prompt();
			const choice = await deferredPrompt.userChoice;
			if (choice.outcome === 'accepted') {
				setVisible(false);
				setDeferredPrompt(null);
			}
		} finally {
			setInstalling(false);
		}
	};

	const handleClose = () => {
		localStorage.setItem(DISMISSED_KEY, '1');
		setVisible(false);
	};

	return (
		<div className="fixed bottom-16 md:bottom-4 left-3 right-3 md:left-auto md:right-4 md:max-w-sm z-50 rounded-xl border border-[var(--color-border)] bg-white/95 shadow-lg p-3">
			<p className="text-sm font-semibold">ホーム画面に追加できます</p>
			<p className="text-xs text-[var(--color-text-secondary)] mt-1">
				インストールするとアプリのようにすぐ開けます。
			</p>
			<div className="mt-3 flex gap-2 justify-end">
				<Button type="button" variant="ghost" size="sm" onClick={handleClose}>
					閉じる
				</Button>
				<Button type="button" variant="primary" size="sm" onClick={handleInstall} disabled={installing}>
					<Download size={16} />
					{installing ? '確認中...' : 'インストール'}
				</Button>
			</div>
		</div>
	);
};
