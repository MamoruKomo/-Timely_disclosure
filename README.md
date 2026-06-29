# TDnet Slack Alert

TDnet公式の適時開示一覧を監視し、新着だけSlackへ投稿するbotです。

現在の主運用は **Cloudflare Workers Cron + KV** です。GitHub Actionsの定期実行は停止してあり、Actions枠を消費しません。

## 通知間隔

Cloudflare Workers Cronで1分おきに起動し、コード側でJST土日をskipします。

- 0秒通知ではなく、通常は0〜60秒程度の遅れ
- TDnet公式Webページを取得して差分検知
- KVに送信済みIDを保存して重複投稿を防止
- 初回実行は既存開示を既読登録するだけでSlack投稿しない
- 新着が多い場合は `MAX_NOTIFY` 件ずつ複数メッセージに分割して、全件投稿後に既読保存
- Cloudflare CronはUTC解釈なので、cron設定は単純な毎分起動にしてコード側でJST週末skip

## Slack投稿形式

```text
証券コード: 9983
銘柄名: ファーストリテイリング
日付: 2026-06-23 15:00 JST
たいとる: 決算短信
PDFのりんく: https://www.release.tdnet.info/inbs/140120260623123400.pdf
```

新着が複数ある場合は `---` で区切って1投稿にまとめます。

## Cloudflare Workersで使う

### 1. 依存関係

```bash
npm install
```

### 2. KV namespaceを作成

このrepoでは作成済みのKV namespace IDを `wrangler.jsonc` に設定済みです。

作り直す場合:

```bash
npx wrangler kv namespace create TDNET_STATE
```

出力された `id` を `wrangler.jsonc` の `kv_namespaces[0].id` に入れてください。

既存のPython版stateはremote KVへ移行済みです。

### 3. Slack secretを登録

Bot Tokenを使う場合:

```bash
npx wrangler secret put SLACK_BOT_TOKEN
```

Incoming Webhookを使う場合:

```bash
npx wrangler secret put SLACK_WEBHOOK_URL
```

手動テスト送信用の管理トークン:

```bash
npx wrangler secret put ADMIN_TOKEN
```

Slackの投稿先は `wrangler.jsonc` の `SLACK_CHANNEL_ID` で指定します。チャンネルID自体はsecretではありません。

### 4. テスト

```bash
npm test
python3 -m unittest discover -s tests
python3 scripts/tdnet_slack_alert.py --dry-run
```

### 5. デプロイ

```bash
npx wrangler deploy
```

デプロイ後は1分ごとに起動し、JSTの平日だけTDnetを監視します。

## 手動確認

Health check:

```bash
curl https://<worker-url>/health
```

Slackテスト送信:

```bash
curl -X POST https://<worker-url>/test \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"message":"TDnet Slack alert test from Cloudflare Workers"}'
```

## GitHub Actions版

`.github/workflows/tdnet-slack-alert.yml` は手動実行専用のバックアップとして残しています。`schedule` は削除済みなので、通常運用ではActions枠を消費しません。

## ローカルPython版

既存のPython版もバックアップ兼ローカル確認用として残しています。

```bash
python3 -m unittest discover -s tests
python3 scripts/tdnet_slack_alert.py --dry-run
```
