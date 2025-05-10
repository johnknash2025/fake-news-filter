# fake-news-filter

# フェイクニュースフィルター Wiki

## 概要

このプロジェクトは、ニュース記事をAIで分析し、フェイクニュースの可能性を判定するWebポータルサイトです。  
フロントエンドはGitHub Pagesで公開し、バックエンドAPIはNetlify FunctionsとOpenAI APIを利用しています。

---

## 主な機能

- ニュースフィードの取得と表示
- フェイクニュース判定（OpenAI APIによる自動分析）
- 統計情報の表示（フィルタ率、ソース数など）

---

## ディレクトリ構成

```
/
├── netlify/functions/
│   ├── fetch-news.js      # ニュース取得API
│   ├── get-stats.js       # 統計情報API
│   └── analyze-news.js    # ニュース分析API（OpenAI連携）
├── public/                # フロントエンド（index.html, js, css）
├── .gitignore
├── README.md
└── ...
```

---

## APIエンドポイント

- `/api/fetch-news` : ニュース一覧を取得
- `/api/get-stats`  : 統計情報を取得
- `/api/analyze-news` : ニュース本文をAIで分析

※Netlify FunctionsのURLに合わせてパスを調整してください。

---

## 環境変数

- `FAUNA_SECRET_KEY` : FaunaDBのシークレットキー
- `OPENAI_API_KEY`   : OpenAI APIキー

---

## セットアップ手順

1. リポジトリをクローン
2. 必要なAPIキーをNetlifyの環境変数に設定
3. Netlifyでデプロイ
4. フロントエンドはGitHub Pagesで公開

---

## よくある質問

**Q. OpenAIのバッチAPIは使えますか？**  
A. サイトの即時判定には不向きですが、バックグラウンド処理には利用可能です。

**Q. フロントエンドから直接APIを呼べますか？**  
A. はい、Netlify Functionsのエンドポイントを利用してください。

---

## ライセンス

MIT

---

## 貢献

IssueやPull Requestは歓迎します！

vercel用にこのREADMEの内容を修正して