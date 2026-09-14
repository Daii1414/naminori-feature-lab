<div align="center">

  # Naminori Feature Lab

  メインの「Naminori」Chrome拡張機能への統合を想定した、各種機能の実装およびプロトタイプをまとめたリポジトリです。

  各機能は単体のChrome拡張機能として個別にテストでき、メインプロジェクトとは分離して開発されています。

  <br>

  [![License](https://img.shields.io/github/license/Daii1414/Naminori-feature-lab?label=&style=flat&logo=license&logoColor=white&color=3da639)](./LICENSE)

</div>

###

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

<div align="center">

## License

This project is licensed under the [MIT License](./LICENSE).

</div>
