# iPhone天気予報アプリ

React Native + Expo で作成したiPhone向け天気予報アプリ。
気象庁API（JMA）からリアルタイムデータを取得して3日間・週間予報を表示する。

- **公開URL**: https://masauehr.github.io/iphone-weather-app/
- **対応地域**: 全47都道府県

## 機能

| 機能 | 内容 |
|------|------|
| 短期予報 | 3日間の天気・降水確率・最高/最低気温 |
| 週間予報 | 7日間の天気・降水確率・最高/最低気温 |
| 地域選択 | 主要6都市クイック選択 ＋ 全47都道府県モーダル |
| 天気絵文字 | 時々→`//`、一時→`/` の区切り付き複合表示 |

## 起動方法（開発）

```bash
# 依存パッケージのインストール
npm install

# 開発サーバー起動
npx expo start
```

起動後、iPhoneの「Expo Go」アプリでQRコードをスキャン（MacとiPhoneが同じWi-Fi必須）。

## デプロイ（GitHub Pages）

```bash
npm run deploy
```

→ https://masauehr.github.io/iphone-weather-app/ が更新される。

## ファイル構成

```
app/
└── (tabs)/
    └── index.tsx   ← メイン画面（天気予報表示）
CLAUDE.md           ← Claude Code用プロジェクト説明
deploy.js           ← GitHub Pagesデプロイスクリプト
```

## 技術スタック

| 項目 | 内容 |
|------|------|
| フレームワーク | React Native（Expo SDK 54） |
| 言語 | TypeScript |
| データソース | 気象庁API（JMA） |
| Web公開 | GitHub Pages |

## 今後の拡張候補

- プッシュ通知（警報・注意報）
- お気に入り地点の保存
- 週間予報の天気テキスト表示
- App Store正式公開
