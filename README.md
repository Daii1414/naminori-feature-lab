<div align="center">

  # Naminori Feature Lab

  メインの「Naminori」Chrome拡張機能への統合を想定した、各種機能の実装およびプロトタイプをまとめたリポジトリです。

  各機能は単体のChrome拡張機能として個別にテストでき、メインプロジェクトとは分離して開発されています。

  <br>

  [![License](https://img.shields.io/github/license/Daii1414/Naminori-feature-lab?label=&style=flat&logo=license&logoColor=white&color=3da639)](./LICENSE)

</div>

###

<div align="center">

## 🛠️ Core Principles & Architecture

</div>

当リポジトリのコードは、メインの商用プロジェクトへスムーズに移植（インテグレーション）できるよう、以下の設計基準を厳守して開発されています。

- **Manifest V3:** すべての機能は最新の Chrome Extensions Manifest V3 に準拠しています。
- **Pure Vanilla JS:** 余計なフレームワーク（ReactやVue等）や重いビルドツール（ViteやWebpack等）を使わず、軽量なバニラJSで実装しています。
- **完全な機能分離 (Isolation):** 各機能は `features/XXX-feature-name/` 配下に完全に独立して格納されており、単体で動作・テストが可能です。
- **リファレンс実装 (Reference Implementation):** メインプロジェクトの開発者やAIコーディングエージェントが、そのままコードやアーキテクチャを持ち帰って統合できる設計にしています。

---

<div align="center">

## 📑 Quick Navigation

</div>

- [001 — Dubbing Antidote](#001--dubbing-antidote)
- [002 — Hide Non-Japanese Videos](#002--hide-non-japanese-videos)
- [003 — Filter Non-Japanese Comments](#003--filter-non-japanese-comments)
- [004 — JLPT Difficulty Analyzer & Badge](#004--jlpt-difficulty-analyzer--badge)
- [005 — Watch Time Statistics Dashboard](#005--watch-time-statistics-dashboard)
- [006 — Anki Comprehension Bar](#006--anki-comprehension-bar)

---

<div align="center">

## Features

</div>

### 001 — Dubbing Antidote

YouTubeで自動吹き替え（オートダビング）が使用されている場合、日本語のオリジナル音声トラックに自動的に切り替えます。

**ステータス:** 動作確認済み

**主な機能:**

- YouTubeの音声トラック検出
- 日本語オリジナル音声の検出
- 自動吹き替えから日本語オリジナル音声への自動切り替え
- 複数言語の自動吹き替えに対応
- YouTubeのSPAナビゲーションへの対応
- 非同期で読み込まれるプレーヤーおよび音声トラックへのリトライ処理
- Chrome拡張機能 Manifest V3

詳細およびテスト手順については、[`features/001-dubbing-antidote/README.md`](./features/001-dubbing-antidote/README.md) を参照してください。

###

### 002 — Hide Non-Japanese Videos

YouTubeのホーム画面、検索結果、サイドバー（関連動画）、Shortsから日本語以外の動画を自動で非表示にし、グリッドのレイアウト崩れや空白の隙間を修復します。

**ステータス:** 動作確認済み

**主な機能:**

- Unicode文字体系（ひらがな・カタカナ・漢字）による日本語タイトル判定
- 顔文字や英語クリッカブルタグの誤判定防止（ノイズ検出時の3文字種必須ルール）
- ホーム、検索、関連動画サイドバー、チャンネル動画、Shortsカルーセルに対応
- YouTubeの行コンテナ（`ytd-rich-grid-row`）のフラット化による隙間のないシームレスなグリッド再配置
- 動画がすべて非表示になった空のシェルフ（Shortsやニュース枠）の自動非表示
- YouTubeのSPAナビゲーションおよび仮想DOMリサイクルに対応（タイトル更新の追跡）
- 連続非表示により画面が空いた場合の無限スクロール自動補充トリガー
- 外部ライブラリ不要（Pure Vanilla JS & CSS）、Chrome拡張機能 Manifest V3

詳細およびテスト手順については、[`features/002-hide-non-japanese-video/README.md`](./features/002-hide-non-japanese-video/README.md) を参照してください。

###

### 003 — Filter Non-Japanese Comments

YouTubeの動画再生ページ（Watch page）で日本語以外のコメントを非表示にし、ネイティブの日本語コメントのみを表示します。「Reveal Comments」ボタンでいつでも一時表示が可能です。

**ステータス:** 動作確認済み

**主な機能:**

- Unicode文字体系による日本語コメント判定
- 英語・ロシア語などの外国語コメントの自動非表示
- ヘッダーへの「Reveal Comments（非表示件数）」切り替えボタンの自動挿入
- 表示切り替え時に非表示対象だったコメントを半透明（65%）で識別表示
- CPU負荷を防ぐための `requestAnimationFrame` による描画スロットリング
- プレーヤーのタイムライン更新による不要な再描画を防ぐコメントセクションのスコープ監視
- YouTubeのコメント無限スクロール読み込みに対応
- 動画切り替え時のSPAナビゲーション対応
- Chrome拡張機能 Manifest V3、外部ライブラリゼロ

詳細およびテスト手順については、[`features/003-filter-non-japanese-comments/README.md`](./features/003-filter-non-japanese-comments/README.md) を参照してください。

###

### 004 — JLPT Difficulty Analyzer & Badge

YouTubeの動画字幕をバックグラウンドで解析し、日本語の難易度（JLPT N5〜N1）を自動算出して動画カードと再生ページに難易度バッジおよび詳細な統計ボックスを表示します。

**ステータス:** 動作確認済み（※スコアリングアルゴリズムは将来的な刷新・高度化を推奨）

**主な機能:**

- YouTubeの内部API（`/youtubei/v1/player`）経由での字幕データ（timedtext）の軽量取得（iOSクライアントエミュレーション）
- ブラウザ標準の `Intl.Segmenter` による高速な単語分割（外部ライブラリ不要）
- 内蔵JLPT単語辞書（N5〜N1）に基づいた難易度加重スコアの算出
- 自動生成字幕（ASR）と手動字幕の判別表示（`*` マーク）
- 重複リクエストを防止するインフライトキャッシュ
- 再生ページ下の詳細統計ボックス（WPM、総単語数、文字数、語彙レベル分布グラフ）のレンダリング
- ホームフィード、検索結果、関連動画サイドバーへのバッジ自動挿入
- Chrome拡張機能 Manifest V3

**⚠️ アルゴリズムに関する注意点:**
現在の実装はプロトタイプとして問題なく動作し実用的な結果を出しますが、単語の単純な出現回数に基づく加重平均を行っているため、文脈や文法構造を考慮した高度な判定精度を求める場合、将来的に評価アルゴリズム全体の本格的な見直しや再設計が必要になります。

詳細およびテスト手順については、[`features/004-jlpt-difficulty-badge/README.md`](./features/004-jlpt-difficulty-badge/README.md) を参照してください。

###

### 005 — Watch Time Statistics Dashboard

日本語の動画視聴時間を正確に計測し、GitHub風のヒートマップ、総視聴時間、直近の視聴履歴、JLPTレベル別の内訳を確認できる統計ダッシュボードを提供します。

**ステータス:** 動作確認済み

**主な機能:**

- HTML5ビデオプレイヤーの稼働時間を監視し、アクティブな日本語学習時間のみを高精度で計測
- 広告や一時停止、バックグラウンドタブでの無駄な時間計測の自動除外
- 過去1年間の毎日の学習量を視覚化するGitHub風のフレックスボックス・ヒートマップ
- 直近の視聴履歴（サムネイル、タイトル、JLPTバッジ、チャンネル名、視聴時間）の自動リスト化
- データのJSONエクスポート機能
- Chrome拡張機能のポップアップおよびオプションページ（`stats.html`）としての独立動作
- Chrome Storage API を活用したローカルデータ永続化

詳細およびテスト手順については、[`features/005-watch-time-statistics/README.md`](./features/005-watch-time-statistics/README.md) を参照してください。

###

### 006 — Anki Comprehension Bar

Anki-Connect経由でローカルのAnkiデッキから語彙データを取得し、ウェブページ上の日本語テキストをリアルタイムで解析して、ユーザー自身の語彙力に基づいたテキスト理解度（Comprehension %）を算出・表示します。

**ステータス:** プロトタイプ実装完了（※UI/UX未洗練・要デザイン改善）

**主な機能:**

- Anki-Connect (`http://localhost:8765`) を利用したローカルAnkiの全デッキ一覧の自動取得と、選択したデッキの語彙データの非同期読み込み
- ブラウザ標準の `Intl.Segmenter` による高速な日本語単語のトークナイゼーション（外部ライブラリ不要）
- ページ上のテキストからユニークな日本語単語を抽出し、Ankiの習得語彙リストと照合してテキストの理解度（Comprehension %）を算出
- ページ上部への簡易的なトップステータスバー（デッキ選択ドロップダウン、接続インジケータ、Syncボタン付き）のインジェクション
- ページの動的な変化やスクロール（SPA・無限スクロール）に対応する自動再解析トリガー
- Chrome拡張機能 Manifest V3、外部ライブラリゼロ

**⚠️ UI/UXに関する注意点:**
現時点ではコアとなるロジックと動作するベースライン（基本機能）のコード実装のみが行われており、外観デザインや洗練されたパネルUI/UXの構築は行われていません。本格的な運用には、デザインの刷新やUIの拡張・ブラッシュアップが必要となります。

詳細およびテスト手順については、[`features/006-anki-comprehension-bar/README.md`](./features/006-anki-comprehension-bar/README.md) を参照してください。

###

<div align="center">

## License

This project is licensed under the [MIT License](./LICENSE).

</div>
