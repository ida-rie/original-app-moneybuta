# 認証 Cookie 移行 Phase 2 テスト結果

実施日: 2026-04-23  
実施者: Codex

参照計画書: `docs/auth-cookie-migration-test-plan.md`

## 1. 実施結果サマリー

- 自動テスト/検証: PASS
- 手動確認（実機）: 未実施
- 判定: Phase 2 実装は完了、実機/手動試験待ち

## 2. 実装した内容（Phase 2）

1. CSRF（Double Submit Cookie）
- `mb_csrf_token` をセッション確立時に発行
- 変更系メソッド（POST/PUT/PATCH/DELETE）で `x-csrf-token` を必須化
- `apiClient` が変更系リクエストに自動で `x-csrf-token` を付与

2. セッション期限管理
- `idle timeout`: 30日
- `absolute timeout`: 90日
- `mb_session_meta`（署名付き）で `iat/lat` を管理
- refresh時に timeout 判定 + `lat` 更新

## 3. 実施した検証

1. TypeScript 型チェック
- コマンド: `npx tsc --noEmit`
- 結果: PASS

2. 変更ファイル限定 lint
- コマンド: `npx eslint <Phase2変更ファイル>`
- 結果: PASS

3. 本番ビルド
- コマンド: `npm run build`
- 結果: PASS
- 備考: `@supabase/realtime-js` の既知 warning（Critical dependency）は継続

## 4. ケース別ステータス（Phase 2 対象）

- `SEC-01` CSRFなし更新API拒否: 実装完了 / 手動未確認
- `SEC-02` 不正CSRFトークン拒否: 実装完了 / 手動未確認
- `SEC-03` idle timeout超過失効: 実装完了 / 手動未確認
- `SEC-04` absolute timeout超過失効: 実装完了 / 手動未確認

## 5. 次アクション（手動確認）

1. CSRFヘッダを外した更新APIで `403` を確認
2. 改ざんCSRFヘッダで `403` を確認
3. `mb_session_meta` の `lat` を古い値にして refresh実行 → `401` を確認
4. `mb_session_meta` の `iat` を古い値にして refresh実行 → `401` を確認
