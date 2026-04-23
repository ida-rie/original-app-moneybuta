# 本番スモーク結果（認証Cookie移行）

実施日: 2026-04-23  
実施者: Codex  
対象URL: `https://moneybuta.vercel.app`

## 1. 実施範囲

- 未認証の基本挙動（401/redirect/signout）
- 認証済みケースの着手可否確認

## 2. 結果

1. `GET /api/auth/me`（未認証）
- 実測: `401`
- 判定: PASS

2. `POST /api/auth/refresh`（未認証）
- 実測: `401`
- 判定: PASS

3. `POST /api/auth/signout`（未認証）
- 実測: `200`
- 判定: PASS

4. `GET /quest`（未認証）
- 実測: `307` → `Location: /signin`
- 判定: PASS

## 3. ブロッカー

- README記載テストアカウントでの `signInWithPassword` が `Invalid login credentials` となり、認証済みケースを自動実行できない
- 追加のサインアップ試行は `email rate limit exceeded` により継続不可

## 4. 残タスク（認証済みケース）

1. 有効な本番検証アカウントでログイン
2. `AUTH-04` / `PWA-01` / `PWA-02` を実機で確認
3. `SEC-01` / `SEC-02`（CSRF拒否）確認
4. `SEC-03` / `SEC-04`（idle/absolute timeout）確認
