/* eslint-disable no-var */
// ↑ここで no-var ルールをこのファイル全体で無効化

import { createClient, SupabaseClient } from '@supabase/supabase-js';

declare global {
	// 型宣言としてのみ利用するグローバル変数
	var __supabase: SupabaseClient | undefined;
}

// ビルド時にモジュールが読み込まれても環境変数がなくてもクラッシュしないよう
// 実際にアクセスされた瞬間にクライアントを生成する（遅延初期化）
function getClient(): SupabaseClient {
	if (!globalThis.__supabase) {
		globalThis.__supabase = createClient(
			process.env.SUPABASE_URL!,
			process.env.SUPABASE_SERVICE_ROLE_KEY!
		);
	}
	return globalThis.__supabase;
}

export const supabase = new Proxy({} as SupabaseClient, {
	get(_, prop) {
		const client = getClient();
		const value = Reflect.get(client, prop);
		return typeof value === 'function' ? value.bind(client) : value;
	},
});
