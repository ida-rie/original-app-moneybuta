/* eslint-disable no-var */
// ↑ここで no-var ルールをこのファイル全体で無効化

import { createClient, SupabaseClient } from '@supabase/supabase-js';

declare global {
	// 型宣言としてのみ利用するグローバル変数
	var __supabase: SupabaseClient | undefined;
}

export const supabase =
	globalThis.__supabase ??
	createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// HMR（ホットリロード）時にも同じインスタンスを再利用
if (!globalThis.__supabase) {
	globalThis.__supabase = supabase;
}
