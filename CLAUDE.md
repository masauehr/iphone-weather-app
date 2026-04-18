# CLAUDE.md — MyFirstApp（iPhone天気予報アプリ）

## プロジェクト概要
React Native + Expo で作成したiPhone向け天気予報アプリ。
気象庁API（JMA）からリアルタイムでデータを取得して表示する。

- **ローカルパス**: `~/MyFirstApp/`
- **GitHubリポジトリ**: https://github.com/masauehr/iphone-weather-app
- **公開URL（Web版）**: https://masauehr.github.io/iphone-weather-app/

---

## 起動方法

### 実機確認（Expo Go）
```bash
cd ~/MyFirstApp
npx expo start
```
- Expo Goアカウント作成済み → iPhoneのExpo Goアプリ「Projects」タブに自動表示される（QRコード不要）
- `s`キーでExpo Goモードに切替可能
- MacとiPhoneが**同じWi-Fi**に接続している必要あり
- 変更が反映されない場合: `npx expo start --clear` → Expo Goを完全終了 → 再接続

### Web版デプロイ（GitHub Pages）
```bash
npm run deploy
```
→ ビルド（`npx expo export -p web`）→ `gh-pages`ブランチに直接push → 公開URL更新

---

## 主要ファイル
- `app/(tabs)/index.tsx` — メイン画面（天気予報表示）※ほぼここだけ編集する
- `app/(tabs)/explore.tsx` — Exploreタブ（未使用・触らない）
- `app/_layout.tsx` — ルートレイアウト
- `deploy.js` — GitHub Pagesデプロイスクリプト（カスタム）
- `app.json` — `experiments.baseUrl: "/iphone-weather-app"` 設定済み（GitHub Pages用）

---

## 現在の機能
- 短期予報（3日間）／週間予報（7日間）の切替表示
- 対応地域：主要6都市クイック選択 ＋ 全47都道府県（「その他▼」モーダル）
- 各日カード：複合天気絵文字・降水確率（☂）・最高/最低気温
- 天気絵文字：時々→`//`、一時→`/` の区切り記号付き複合表示（例: ☁️//☂️）
- 雨アイコン: ☂️（傘）を使用
- データソース：気象庁API `https://www.jma.go.jp/bosai/forecast/data/forecast/{code}.json`

---

## JMA APIの構造メモ

```
json[0] — 短期予報（3日間）
  timeSeries[0].timeDefines        : 天気日時（3要素・[0]は前日17:00始まりの場合あり）
  timeSeries[0].areas[0].weatherCodes : 天気コード
  timeSeries[0].areas[0].weathers  : 天気テキスト
  timeSeries[1].timeDefines        : 降水確率日時（時間帯別・複数）
  timeSeries[1].areas[0].pops      : 降水確率（%）→ 日別に最大値を使う
  timeSeries[2].areas[0].temps     : 今日の気温 [0]=最低, [1]=最高（tempsMax/Minではない）

json[1] — 週間予報（7日間）
  timeSeries[0].areas[0].weatherCodes : 天気コード（7日）
  timeSeries[0].areas[0].pops      : 降水確率（7日）
  timeSeries[1].areas[0].tempsMax  : 最高気温（index[0]は空文字の場合あり→短期で補完）
  timeSeries[1].areas[0].tempsMin  : 最低気温（同上）
```

**気温取得の方針**（ハマりポイント）
- 今日: `json[0].timeSeries[2].areas[0].temps` を使う
- 明日以降: `json[1].timeSeries[1]` を日付照合（`iso.slice(0,10)`）で取得
- 週間予報のindex[0]は今日分が空文字のため直接インデックスで取得しない

---

## GitHub Pagesデプロイのハマりどころ

| 問題 | 原因 | 解決策 |
|------|------|--------|
| JSバンドルが404 | サブディレクトリ配置でパスがずれる | `app.json`に`"baseUrl": "/iphone-weather-app"`を追加済み |
| `_expo`フォルダが無視される | GitHub PagesのJekyll処理 | `.nojekyll`ファイルをdistに追加（`deploy.js`で対応済み） |
| フォントが404 | `gh-pages`パッケージがnode_modulesパスを除外する | `deploy.js`で直接git pushするよう変更済み |

---

## 技術スタック
- React Native（Expo SDK 54）
- TypeScript
- expo-router（ファイルベースルーティング）
- JMA API（気象庁）
- GitHub Pages（Web版公開）

## コーディング規約
- インデント：スペース2つ
- コメント：日本語
- スタイル：StyleSheet.create() を使用
- ボタン等のテキストは `color: '#000000'` を明示（iOSで見えなくなる問題あり）
- 横スクロールリストは `ScrollView` ではなく `View + flexWrap` を使う（iOSクリップ問題）
- 複数絵文字は `numberOfLines={1} adjustsFontSizeToFit` で1行収める

---

## 今後の拡張候補
- プッシュ通知（警報・注意報）
- 週間予報の天気テキスト表示
- お気に入り地点の保存（AsyncStorage）
- ウィジェット対応
- App Store正式公開（Apple Developer登録 年$99が必要）
