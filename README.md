# Naminori-feature-lab
メインの「JP Immersion」Chrome拡張機能への統合を想定した、各種機能の実装およびプロトタイプをまとめたリポジトリです。

各機能は単体のChrome拡張機能として個別にテストでき、メインプロジェクトとは分離して開発されています。

## 機能

### 001 — Dubbing Antidote

YouTubeで自動吹き替え（オートダビング）が使用されている場合、日本語のオリジナル音声トラックに自動的に切り替えます。

**ステータス:** 動作確認済みプロトタイプ

- Chrome拡張機能 Manifest V3
- YouTubeの音声トラック検出
- 日本語オリジナル音声の検出
- 自動吹き替えから日本語オリジナル音声への自動切り替え
- YouTube SPAナビゲーションへの対応
- 非同期で読み込まれるプレーヤーへのリトライ処理

詳細およびテスト手順については、`features/001-dubbing-antidote/README.md` を参照してください。

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
