# Timely Disclosure Slack Alert

TDnet公式の適時開示一覧を監視し、新着だけSlackへ投稿するbotです。

現在の主運用は **Cloudflare Workers Cron + KV** です。GitHub Actionsの定期実行は停止してあり、Actions枠を消費しません。

## 通知間隔

Cloudflare Workers Cronで1分おきに起動し、コード側でJPX休業日をskipします。

- 0秒通知ではなく、通常は0〜60秒程度の遅れ
- TDnet公式Webページを取得して差分検知
- JPXの営業時間・休業日一覧を参照し、休業日は動かさない
- J-Quantsの商品区分でいうETF、REIT、外国株、投資信託などに相当する開示は通知しない
- `block.txt` 由来の除外ワードに一致する開示は通知しない
- 重要ワードに一致する開示はSlack本文の先頭に `重要` を付ける
- KVに送信済みIDを保存して重複投稿を防止
- 初回実行は既存開示を既読登録するだけでSlack投稿しない
- 新着が多い場合は `MAX_NOTIFY` 件ずつ複数メッセージに分割して、全件投稿後に既読保存
- Cloudflare CronはUTC解釈なので、cron設定は単純な毎分起動にしてコード側で営業日判定

## 取得元について

取得元はTDnet公式HTMLです。

BRiSK適時開示は、利用規約でデータの加工、第三者提供/共有、私的な資産運用目的以外の利用、業務目的利用が禁止されているため、このbotの取得元には使わない方針です。

## Slack投稿形式

```text
9983

ファーストリテイリング

2026-06-23 15:00

決算短信

https://www.release.tdnet.info/inbs/140120260623123400.pdf
```

重要ワードに一致した場合:

```text
重要

4444

インフォネット

2026-06-29 15:00

株主優待の一部内容変更（優待品目の変更）に関するお知らせ

https://storage.googleapis.com/disclosed-file-bucket-d4575ee/20260629583350/1/general.pdf
```

新着が複数ある場合は `---` で区切って1投稿にまとめます。PDF URLは単独行に置き、Slackのリンク展開を有効にしています。

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

デプロイ後は1分ごとに起動し、JPX営業日だけTDnet公式の適時開示を監視します。

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
