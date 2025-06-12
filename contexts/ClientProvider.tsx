'use client';

import React, { ReactNode } from 'react';
import RestoreUserFromSession from '@/components/auth/RestoreUserFromSession';

type Props = { children: ReactNode };

/**
 * クライアント専用のプロバイダーコンポーネント。
 * セッションから user を復元したあとに子コンポーネントを描画します。
 */
const ClientProvider = ({ children }: Props) => {
	return (
		<>
			<RestoreUserFromSession />
			{children}
		</>
	);
};

export default ClientProvider;
