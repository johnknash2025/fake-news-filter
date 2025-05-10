# fake-news-filter

# フェイクニュースフィルター Wiki

## 概要

このプロジェクトは、ニュース記事をAIで分析し、フェイクニュースの可能性を判定するWebポータルサイトです。  
フロントエンドとバックエンドAPIの両方をVercelでホスティングし、サーバーレスAPIはVercel Serverless FunctionsとOpenAI APIを利用しています。

---

## 主な機能

- ニュースフィードの取得と表示
- フェイクニュース判定（OpenAI APIによる自動分析）
- 統計情報の表示（フィルタ率、ソース数など）

---

## ディレクトリ構成

```
/
├── api/
│   ├── fetch-news.js      # ニュース取得API（Vercel Serverless Function）
│   ├── get-stats.js       # 統計情報API（Vercel Serverless Function）
│   └── analyze-news.js    # ニュース分析API（OpenAI連携、Vercel用）
├── index.html             # フロントエンド
├── css/
│   └── style.css
├── js/
│   └── app.js
├── .gitignore
├── README.md
└── ...
```

---

## APIエンドポイント

- `/api/fetch-news` : ニュース一覧を取得
- `/api/get-stats`  : 統計情報を取得
- `/api/analyze-news` : ニュース本文をAIで分析

※Vercelにデプロイした場合、上記のエンドポイントが自動で有効になります。

---

## 環境変数

- `FAUNA_SECRET_KEY` : FaunaDBのシークレットキー（必要な場合のみ）
- `OPENAI_API_KEY`   : OpenAI APIキー

Vercelの「Settings > Environment Variables」から設定してください。

---

## セットアップ手順

1. リポジトリをクローン
2. 必要なAPIキーをVercelの環境変数に設定
3. Vercelでプロジェクトを新規作成し、GitHubリポジトリと連携
4. デプロイ後、`https://{your-project}.vercel.app/` でアクセス

---

## よくある質問

**Q. OpenAIのバッチAPIは使えますか？**  
A. サイトの即時判定には不向きですが、バックグラウンド処理には利用可能です。

**Q. フロントエンドから直接APIを呼べますか？**  
A. はい、VercelのServerless Functionsのエンドポイントを利用してください。

---

## ライセンス

MIT

---

## 貢献

IssueやPull Requestは歓迎します！