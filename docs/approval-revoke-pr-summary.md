# 承認解除機能 PR サマリ

## 変更概要

- 親アカウント向けに、承認済みクエストの承認解除機能を追加
- 承認・完了APIに状態遷移ガード（再実行防止、競合対策）を追加
- `GET /api/amount/monthly` に `childId` の認可チェックを追加

## 仕様変更点

1. 承認解除 API を追加
- `DELETE /api/quests/[id]/approve`
- 当日（JST）に承認したクエストのみ解除可能

2. ステータスの厳格化
- 再完了・再承認・不正な承認解除は `409`
- 権限外アクセスは `403`

3. UI変更
- 親画面の承認済み表示を「承認解除」ボタンへ変更
- 子画面の導線は変更なし

## 既存機能への影響

- 既存の「子が完了 → 親が承認」フローは維持
- 金額表示は `approved` 状態に追従し、承認解除時に月次集計へ反映
- 他家庭 `childId` の月次参照を `403` で拒否（セキュリティ改善）

## テスト結果

- APIシナリオ: 11/11 PASS
- 競合・金額反映: 5/5 PASS
- UI表示分岐（コード確認）: 2/2 PASS
- 合計: 18/18 PASS

詳細:
- [docs/approval-revoke-test-checklist.md](./approval-revoke-test-checklist.md)
- [docs/approval-revoke-test-report-2026-04-22.md](./approval-revoke-test-report-2026-04-22.md)

## 実行コマンド

- `npm run test:approval-revoke`
- `npm run test:approval-revoke:extended`
- `npm run test:approval-revoke:all`
