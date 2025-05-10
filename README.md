# 🐷 マネぶた　おこづかいクエスト

## 📌 アプリの概要

子どもの金銭教育をサポートする、親子で使えるおこづかい管理アプリです。  
親はおこづかいの設定やお手伝いの報酬を管理でき、子どもは自分で使える金額を確認できます。

## 🔗 公開サイト URL

[https://your-app-url.vercel.app](https://your-app-url.vercel.app)

## ✨ 主な機能

- 月額おこづかいの設定
- お手伝いに応じた報酬加算
- 残高確認機能（子ども向け）
- 管理画面（親向け）

## 🧪 テスト用アカウント

※ 実装済みの場合

- **親アカウント**

  - メール: ``
  - パスワード: ``

- **子アカウント**
  - メール: ``
  - パスワード: ``

## 🛠 技術スタック

### 🚀 フレームワーク・言語

- Next.js (App Router)
- TypeScript

### 🎨 UI

- Tailwind CSS
- shadcn/ui

### ⚙️ 状態管理

- React Hooks
- Zustand

### 🔐 認証・データベース

- Prisma（データベース接続と ORM）
- Supabase Auth（認証）

### 🗃 バージョン管理

- Git + GitHub

## 📋 機能一覧

### 👶 こども向け機能

- 自分の残高表示
- おこづかい履歴の確認
- アバター選択（カスタマイズ要素）

### 👨‍👩‍👧‍👦 親向け機能

- 月額おこづかいの設定
- お手伝いの追加／編集／削除
- 履歴管理

### 🔁 共通機能

- ログイン／ログアウト
- アカウント登録
- リアルタイム反映（Supabase Realtime）

## 🗂 プロジェクト構造（例）

/app
├── (auth) // 認証関連ページ
├── dashboard // 親用ダッシュボード
├── child // 子ども用ページ
└── components // 再利用コンポーネント
/libs // ロジック、ユーティリティ関数
/types // 型定義

## 🧾 データベーススキーマ（ER 図）

![ER図](./public/er-diagram.png)  
※ Supabase の ER 図は [dbdiagram.io](https://dbdiagram.io/) や Supabase Studio で作成可能です。

## 📄 ライセンス

© 2025 マネぶた おこづかいクエスト All rights reserved.
