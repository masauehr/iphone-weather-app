# 技術マニュアル — iPhone天気予報アプリ

[← README.md に戻る](README.md)

---

## 目次

1. [アプリ概要](#1-アプリ概要)
2. [iPhone版の使い方](#2-iphone版の使い方)
3. [Web版の使い方](#3-web版の使い方)
4. [ファイル構成と役割](#4-ファイル構成と役割)
5. [技術実装の詳細](#5-技術実装の詳細)
6. [JMA API 構造メモ](#6-jma-api-構造メモ)
7. [GitHub Pages デプロイ手順](#7-github-pages-デプロイ手順)
8. [改修履歴](#8-改修履歴)

---

## 1. アプリ概要

気象庁API（JMA）を利用した天気予報アプリ。React Native + Expo で構築し、iPhone実機（Expo Go）とWebブラウザの両方で動作する。

| 項目 | 内容 |
|------|------|
| フレームワーク | React Native（Expo SDK 54） |
| 言語 | TypeScript |
| ルーティング | expo-router（ファイルベース） |
| 永続化 | @react-native-async-storage/async-storage v2.2.0 |
| マップライブラリ | Leaflet 1.9.4 |
| データソース | 気象庁API（JMA） |
| iPhone配布 | Expo Go（開発・テスト用） |
| Web公開 | GitHub Pages |

---

## 2. iPhone版の使い方

### 2-1. セットアップ

1. Node.js・npm・Expo CLIがインストール済みであること
2. iPhoneに「Expo Go」アプリをインストール（App Store無料）
3. Expo Goでアカウント作成・ログイン済みであること

### 2-2. 起動手順

```bash
cd ~/projects/mobile_app
npx expo start
```

ターミナルにQRコードとログが表示される。
iPhoneの「Expo Go」アプリを開くと、**Projectsタブに自動表示**される（QRコード不要）。
- MacとiPhoneが**同じWi-Fiネットワーク**に接続していること
- Expo Goモードに切り替えるには `s` キーを押す

### 2-3. トラブルシューティング

| 症状 | 原因 | 対処 |
|------|------|------|
| アプリが表示されない | Wi-Fiが異なる | MacとiPhoneを同じWi-Fiに接続 |
| 変更が反映されない | キャッシュ残留 | `npx expo start --clear` → Expo Go完全終了 → 再接続 |
| 画面が真っ黒 | WebViewメモリ超過 | レーダーの時間範囲を1時間に戻す |

### 2-4. 天気予報タブの使い方

- **お気に入りボタン（上部3つ）**: タップで即切替。長押し → 編集モード → 地点を選び直す
- **その他▼**: タップでモーダル表示。全47都道府県から選択可能
- **サブ地域バー**: 複数地域を持つ地点（沖縄本島など）を選んだ場合に自動表示
- **短期/週間ボタン**: 3日予報と週間予報を切替
- **🔄ボタン（右上）**: 最新データを再取得

### 2-5. レーダー・衛星タブの使い方

- **[降水レーダー] / [可視] / [赤外]**: 表示モードを切替
- **[1時間] / [2時間] / [3時間]**: アニメーション時間範囲を切替
- **[◀5h] [◀1h]**: 過去5時間・1時間前に遡る（過去モード中は自動更新停止）
- **[1h▶] [▶現在]**: 1時間進む・現在時刻に戻る
- **[凡例]**: 降水強度カラースケールの表示/非表示を切替
- **[▶] / [❚❚]**: アニメーション再生/一時停止
- ピンチ操作でズーム、ドラッグでスクロール可能

---

## 3. Web版の使い方

### 3-1. ローカル確認

```bash
npx expo start --web
```

ブラウザで `http://localhost:8081` が開く。

### 3-2. GitHub Pagesへのデプロイ

```bash
npm run deploy
```

内部処理:
1. `npx expo export -p web` でWebビルド（`dist/` に出力）
2. `.nojekyll` ファイルを `dist/` に追加（GitHub PagesのJekyll処理を無効化）
3. `git subtree push` ではなく、カスタム `deploy.js` でdistをgh-pagesブランチに直接push

デプロイ先: https://masauehr.github.io/iphone-weather-app/

### 3-3. Web版の技術特性

iPhone版とWeb版でレーダー画面の実装が分かれている。

| 項目 | iPhone版 | Web版 |
|------|---------|------|
| レーダー表示 | `radar.native.tsx` + WebView | `radar.tsx` + iframe |
| Leaflet読み込み | WebView内でHTMLとして展開 | iframe内でHTMLとして展開 |
| 通信 | `postMessage` / `onMessage` | `postMessage` / `message` イベント |
| メモリ制約 | iOSのWebKit制限あり（厳しい） | ブラウザ依存（比較的緩い） |

---

## 4. ファイル構成と役割

```
mobile_app/
├── app/
│   ├── _layout.tsx              # ルートレイアウト（タブナビゲーション設定）
│   └── (tabs)/
│       ├── _layout.tsx          # タブバー設定（アイコン・ラベル）
│       ├── index.tsx            # 天気予報メイン画面（全ロジック）
│       ├── radar.tsx            # レーダー画面（Web版・iframe）
│       ├── radar.native.tsx     # レーダー画面（iPhone版・WebView）
│       └── explore.tsx          # 未使用タブ（触らない）
├── assets/
│   └── html/
│       └── radarHtml.ts         # Leafletビューア埋め込みHTML（テンプレートリテラル）
├── CLAUDE.md                    # Claude Code用プロジェクト指示
├── MANUAL.md                    # 本ファイル（技術マニュアル）
├── README.md                    # 使い方概要
├── deploy.js                    # GitHub Pagesデプロイスクリプト（カスタム）
├── app.json                     # Expo設定（baseUrl・bundleId等）
├── package.json                 # 依存パッケージ
└── tsconfig.json                # TypeScript設定
```

---

## 5. 技術実装の詳細

### 5-1. プラットフォーム分岐（.native.tsx）

expo-routerでは、ファイル名に `.native.tsx` をつけると iPhone/Android専用、`.tsx` がWeb専用として自動適用される。

```
radar.tsx          → Web版で使用
radar.native.tsx   → iPhone版（iOS/Android）で使用
```

これにより、WebViewとiframeを使い分けつつ、コード量を最小化している。

### 5-2. レーダーHTMLビューア（radarHtml.ts）

`assets/html/radarHtml.ts` に Leaflet 1.9.4 を組み込んだHTMLをTypeScriptテンプレートリテラルとして格納。WebView/iframe双方にそのまま渡す。

**主要変数:**
```javascript
var FIXED_FRAME_COUNT = 12;   // 常に12フレーム固定（メモリ管理）
var timeRangeHours = 2;       // デフォルト2時間
var historicalOffsetMin = 0;  // 0=現在モード、正値=過去モード（分）
```

**フレーム生成の仕組み（メモリ管理）:**

フレーム数を常に12枚固定にして、時間範囲に応じてステップ間隔を変える方式。
iOSのWebKit制限（多数のTileLayerでメモリ超過→黒画面）を回避するための設計。

```javascript
// 例: 2時間範囲の場合
var radarFactor = Math.max(1, Math.round(timeRangeHours * 3600 / (FIXED_FRAME_COUNT * RADAR_INT)));
// RADAR_INT=300秒, timeRangeHours=2 → factor=2 → 10分ステップ × 12枚 = 120分
var radarStepSec = radarFactor * RADAR_INT;
```

| 時間範囲 | radarFactor | ステップ | カバー範囲 |
|---------|------------|--------|---------|
| 1時間 | 1 | 5分 | 60分 |
| 2時間 | 2 | 10分 | 120分 |
| 3時間 | 3 | 15分 | 180分 |

**過去モード:**
```javascript
function isHistoricalMode() { return historicalOffsetMin > 0; }

function autoLoop() {
  if (isHistoricalMode()) { scheduleAuto(); return; }  // 過去モード中は再構築しない
  buildFrames(true);
  scheduleAuto();
}
```

**凡例（降水強度）:**
気象庁SVG仕様（`legend_jp_normal_hrpns.svg`）に準拠した8段階カラースケール。
`position:fixed; bottom:60px; left:6px; z-index:900` のオーバーレイとして表示。

```javascript
function toggleLegend() {
  var panel = document.getElementById('legendPanel');
  var btn = document.getElementById('legendBtn');
  if (panel.style.display === 'none') {
    panel.style.display = 'block';
    btn.classList.add('active');
  } else {
    panel.style.display = 'none';
    btn.classList.remove('active');
  }
}
```

### 5-3. 天気予報画面（index.tsx）

**地域データ構造:**
```typescript
type Area = { name: string; code: string };
type Section = { title: string; areas: Area[] };
type SubArea = { name: string; code: string };
```

`AREA_SECTIONS`: 10セクション・58地点（`/jma_app_suite/common/const/area.json` と整合）。

**お気に入りとデータ永続化:**
`@react-native-async-storage/async-storage` でJSONシリアライズして保存。

```typescript
// AsyncStorageキー
// 'favorites' → Area[] (3件) のJSON文字列
// 'lastArea'  → code文字列（最後に選んだ地点コード）
```

起動時に両方を読み込んで初期表示に反映。お気に入り編集・地点切替のたびに保存。

**サブ地域（class10s）の処理:**

JMAのoffice単位JSON (`{code}.json`) には、そのoffice配下の全class10s地域が含まれる。
追加APIコール不要で1回のfetchで全サブ地域を取得できる。

```typescript
const areas0 = json[0]?.timeSeries?.[0]?.areas ?? [];
const subs: SubArea[] = areas0.map((a: any) => ({
  name: a.area.name,
  code: a.area.code,
}));
// 各サブ地域ごとに buildShortForecast / buildWeekForecast を呼ぶ
const shorts = subs.map((_, i) => buildShortForecast(json, i));
const weeks  = subs.map((_, i) => buildWeekForecast(json, i));
```

サブ地域が2つ以上の場合のみ、画面上部に切替バーを表示する。

**気温取得の方針（ハマりポイント）:**

| 日 | ソース | 備考 |
|----|--------|------|
| 今日・明日 | `json[0].timeSeries[2]` | 日付照合しmin/max算出（getShortTemp） |
| 明後日以降 | `json[1].timeSeries[1].tempsMax/Min` | 日付照合で取得（getWeekTemp） |

週間予報の `tempsMax[0]` は空文字になる場合があるため、短期予報で補完する。

**安全なインデックス参照:**
```typescript
const cap = (arr: any[]) => Math.min(aIdx, arr.length - 1);
```
サブ地域数が異なるofficeでも、インデックス超過によるクラッシュを防止。

### 5-4. データソース（JMA API）

| API | URL形式 | 用途 |
|-----|--------|------|
| 天気予報 | `https://www.jma.go.jp/bosai/forecast/data/forecast/{code}.json` | 短期・週間予報 |
| 降水レーダー | `https://www.jma.go.jp/bosai/jmatile/data/nowc/{time}/surf/hrpns/{z}/{x}/{y}.png` | ナウキャスト |
| ひまわり衛星 | `https://www.jma.go.jp/bosai/himawari/data/satimg/{time}/fd/.../{z}/{x}/{y}.jpg` | 可視・赤外 |

---

## 6. JMA API 構造メモ

### 短期予報 json[0]

```
timeSeries[0].timeDefines           : 天気日時（3要素）
timeSeries[0].areas[i].weatherCodes : 天気コード（areas[i] = サブ地域i）
timeSeries[0].areas[i].weathers     : 天気テキスト
timeSeries[1].timeDefines           : 降水確率日時（時間帯別・複数）
timeSeries[1].areas[i].pops         : 降水確率（%）
timeSeries[2].areas[i].temps        : 今日・明日の気温（[0]=最低, [1]=最高）
```

### 週間予報 json[1]

```
timeSeries[0].areas[i].weatherCodes : 天気コード（7日）
timeSeries[0].areas[i].pops         : 降水確率（7日）
timeSeries[0].areas[i].reliabilities: 信頼度（A/B/C）
timeSeries[1].areas[i].tempsMax     : 最高気温（index[0]は空文字の場合あり）
timeSeries[1].areas[i].tempsMin     : 最低気温（同上）
```

### 地域コード（主要）

| 地域 | code | 備考 |
|------|------|------|
| 沖縄本島 | 471000 | class10s: 本島中南部・北部・久米島 |
| 大東島 | 472000 | |
| 宮古島 | 473000 | |
| 八重山 | 474000 | class10s: 石垣島・与那国島 |
| 東京 | 130000 | |
| 大阪 | 270000 | |
| 札幌 | 016000 | |
| 函館 | 017000 | |
| 旭川 | 012000 | |
| 釧路 | 014100 | |
| 鹿児島 | 460100 | |
| 奄美 | 460040 | |

---

## 7. GitHub Pages デプロイ手順

### deploy.js の処理フロー

```
1. npx expo export -p web  → dist/ を生成
2. dist/.nojekyll を作成   → GitHub PagesのJekyll処理を無効化
3. git init (dist内)
4. git add . && git commit
5. git push --force origin HEAD:gh-pages
```

### app.json の重要設定

```json
{
  "expo": {
    "experiments": {
      "baseUrl": "/iphone-weather-app"
    }
  }
}
```

サブディレクトリ配置でJSバンドルのパスがずれる問題を、`baseUrl` で解決している。

### ハマりポイントまとめ

| 問題 | 原因 | 解決策 |
|------|------|--------|
| JSバンドルが404 | サブディレクトリでパスずれ | `app.json` に `baseUrl` 設定 |
| `_expo/` フォルダが無視される | JekyllがアンダースコアフォルダをスキップI | `.nojekyll` を dist に追加 |
| フォントが404 | `gh-pages` npmパッケージがnode_modulesを除外 | `deploy.js` でgit直接pushに変更 |

---

## 8. 改修履歴

### 2026-05 今回の改修内容

#### レーダー・衛星タブ

| 改修 | 内容 |
|------|------|
| アニメーション時間拡張 | 1時間のみ → 1時間/2時間/3時間を選択可能に |
| デフォルト変更 | 1時間 → 2時間 |
| 過去データ再生 | [◀5h][◀1h][1h▶][▶現在] ボタンで最大5時間前まで遡れるように |
| 過去モード中の自動更新停止 | 過去モード中はautoLoopで再構築をスキップ |
| 現在に戻った際のマップ維持 | `goNow()` 内 `buildFrames(true)` に変更（表示範囲リセットを防止） |
| iPhone黒画面対策 | 動的フレーム数→**固定12フレーム+可変ステップ**方式に変更（WebKitメモリ超過防止） |
| 降水強度凡例 | [凡例]ボタンで8段階カラースケールをオン/オフ |

#### 天気予報タブ

| 改修 | 内容 |
|------|------|
| お気に入り地点 | 3地点登録・長押し編集・起動時復元（AsyncStorage） |
| 最終地点記憶 | 最後に選んだ地点をAsyncStorageに保存し次回復元 |
| 更新ボタン | 右上に🔄ボタンを追加 |
| 地域拡張 | `area.json` に合わせて全47都道府県58地点（10セクション）に拡充 |
| デフォルト変更 | 沖縄本島・東京・大阪の3地点をデフォルトお気に入りに |
| サブ地域切替 | class10s レベルのサブ地域を取得し、複数ある場合に切替バーを表示 |
| 安全なインデックス参照 | サブ地域数が異なる場合のクラッシュを防ぐ `cap()` 関数を追加 |

---

*最終更新: 2026-05*
