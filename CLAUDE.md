# CLAUDE.md — MyFirstApp（iPhone天気予報アプリ）

## プロジェクト概要
React Native + Expo で作成したiPhone向け天気予報アプリ。
気象庁API（JMA）からリアルタイムでデータを取得して表示する。

## 場所
`~/MyFirstApp/`

## 起動方法
```bash
cd ~/MyFirstApp
npx expo start
```
iPhoneの「Expo Go」アプリでQRコードを読み取って実機確認。

## 主要ファイル
- `app/(tabs)/index.tsx` — メイン画面（天気予報表示）
- `app/(tabs)/explore.tsx` — Exploreタブ（未使用）
- `app/_layout.tsx` — ルートレイアウト

## 現在の機能
- 短期予報（3日間）／週間予報（7日間）の切替表示
- 対応地域：主要6都市クイック選択 ＋ 全47都道府県（「その他▼」モーダル）
- 各日カード：複合天気絵文字・降水確率・最高/最低気温
- 天気絵文字：時々→`//`、一時→`/` の区切り記号付き複合表示
- データソース：気象庁API `https://www.jma.go.jp/bosai/forecast/data/forecast/{code}.json`

## JMA APIの構造メモ
```
json[0] — 短期予報
  timeSeries[0] — 天気コード・天気テキスト（3日分）
  timeSeries[1] — 降水確率（時間帯別）
  timeSeries[2] — 今日の気温 areas[0].temps[0]=最低, [1]=最高

json[1] — 週間予報
  timeSeries[0] — 天気コード・降水確率（7日分）
  timeSeries[1] — tempsMax / tempsMin（7日分、index[0]は空文字の場合あり）
```

## 技術スタック
- React Native（Expo SDK 54）
- TypeScript
- expo-router（ファイルベースルーティング）
- JMA API（気象庁）

## コーディング規約
- インデント：スペース2つ
- コメント：日本語
- スタイル：StyleSheet.create() を使用

## 今後の拡張候補
- プッシュ通知（警報・注意報）
- 週間予報の天気テキスト表示
- お気に入り地点の保存
- ウィジェット対応
