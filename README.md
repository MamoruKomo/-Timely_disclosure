# TDnet Slack Alert

適時開示の新着を5分おきに確認し、Slackチャンネル `C0ASFHVU94L` に投稿する小さなGitHub Actionsプロジェクトです。

投稿形式:

```text
証券コード: 9983
銘柄名: ファーストリテイリング
日付: 2026-06-23 15:00 JST
たいとる: 決算短信
PDFのりんく: https://www.release.tdnet.info/inbs/140120260623123400.pdf
```

新着が複数ある場合は、同じ形式のブロックを `---` で区切って1投稿にまとめます。

## 仕組み

- 取得元: TDnet公式の開示一覧 `https://www.release.tdnet.info/inbs/I_list_001_YYYYMMDD.html`
- フォールバック: TDnet公式が取れない場合のみ、Kabutanの適時開示一覧 `https://kabutan.jp/disclosures/`
- PDF: TDnet公式PDF `https://www.release.tdnet.info/inbs/<doc_id>.pdf`
- 重複防止: `data/tdnet_state.json` に送信済みIDを保存
- 初回実行: 既存の開示をベースライン登録するだけで、Slackには送りません
- 2回目以降: 新着IDだけSlackへ送信します

TDnet公式は1日分のページを `I_list_001_YYYYMMDD.html`, `I_list_002_YYYYMMDD.html`, ... の順に確認します。会社名、コード、タイトル、PDFリンクは公式HTMLの `kjTime`, `kjCode`, `kjName`, `kjTitle` から取得します。

## GitHub Actionsで使う

1. このフォルダの中身を新しいGitHubリポジトリに置きます。
2. Slackアプリを作成し、Bot Token Scopes に `chat:write` を付けます。
3. Botをチャンネル `C0ASFHVU94L` に参加させます。
4. GitHub repo の `Settings -> Secrets and variables -> Actions` に `SLACK_BOT_TOKEN` を追加します。
5. `.github/workflows/tdnet-slack-alert.yml` を手動実行します。

Incoming Webhookを使う場合は、`SLACK_BOT_TOKEN` の代わりに `SLACK_WEBHOOK_URL` をsecretへ入れてください。その場合、投稿先チャンネルはWebhook側の設定に従います。

## ローカル確認

```bash
python3 -m unittest discover -s tests
python3 scripts/tdnet_slack_alert.py --dry-run
python3 scripts/tdnet_slack_alert.py --dry-run --date 20260627
```

実際にローカルからSlackへ送る場合:

```bash
export SLACK_BOT_TOKEN='xoxb-...'
export SLACK_CHANNEL_ID='C0ASFHVU94L'
python3 scripts/tdnet_slack_alert.py --state data/tdnet_state.json
```
