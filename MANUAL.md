# 技術マニュアル — iPhone天気予報アプリ

[← README.md に戻る](README.md)

---

## 目次

1. [アプリ概要・アーキテクチャ全体像](#1-アプリ概要アーキテクチャ全体像)
2. [使用言語と開発環境](#2-使用言語と開発環境)
3. [iPhone版の使い方と開発手法](#3-iphone版の使い方と開発手法)
4. [Apple（App Store）へのデプロイ手順](#4-appleapp-storeへのデプロイ手順)
5. [Web版の技術実装](#5-web版の技術実装)
6. [Web版を他のWebサーバーへ移植する方法](#6-web版を他のwebサーバーへ移植する方法)
7. [iPhone版→Web版の変換の仕組み](#7-iphone版web版の変換の仕組み)
8. [レーダービューアの技術詳細](#8-レーダービューアの技術詳細)
9. [天気予報画面の技術詳細](#9-天気予報画面の技術詳細)
10. [JMA API 構造メモ](#10-jma-api-構造メモ)
11. [GitHub Pages デプロイ手順](#11-github-pages-デプロイ手順)
12. [改修履歴](#12-改修履歴)

---

## 1. アプリ概要・アーキテクチャ全体像

本アプリは**1つのコードベースからiPhone・Android・Webブラウザの3プラットフォームに同時対応**する設計になっている。これを実現しているのが Expo（React Native の開発フレームワーク）。

```
ソースコード（TypeScript + JSX）
        │
        ├─── Expo Build（iOS向け）
        │       └─→ ネイティブアプリ（.ipa）→ App Store
        │
        ├─── Expo Build（Android向け）
        │       └─→ ネイティブアプリ（.apk/.aab）→ Google Play
        │
        └─── Expo Export（Web向け）
                └─→ 静的HTML/CSS/JS → GitHub Pages 等
```

ただしレーダー画面だけは、地図操作に Leaflet（ブラウザ専用ライブラリ）を使うため、
プラットフォームごとに異なるラッパーを用意している。

```
radarHtml.ts（Leaflet HTML・純粋なJavaScript）
        │
        ├─── radar.native.tsx → WebView でHTML文字列を読み込む（iPhone/Android）
        └─── radar.tsx        → <iframe> でHTML文字列を読み込む（Web）
```

---

## 2. 使用言語と開発環境

### 開発言語

| 言語 | 用途 |
|------|------|
| **TypeScript** | アプリ本体（画面コンポーネント・ロジック全般） |
| **JavaScript（Vanilla JS）** | radarHtml.ts の中身（Leafletビューア内部） |
| **JSX / TSX** | UIコンポーネントの記述形式（TypeScript + HTML風の構文） |

TypeScriptはJavaScriptの「型付きスーパーセット」。コンパイル時に型チェックを行い、実行時には通常のJavaScriptに変換される。IDEの補完・エラー検出が強力になる。

### フレームワーク・ライブラリ

| パッケージ | バージョン | 用途 |
|-----------|-----------|------|
| React | 19.1.0 | UIコンポーネントの仮想DOM管理 |
| React Native | 0.81.5 | ネイティブUIへのブリッジ |
| Expo | ~54.0.33 | React Nativeのビルド・実行環境 |
| expo-router | ~6.0.23 | ファイルベースルーティング |
| react-native-web | ~0.21.0 | React NativeコンポーネントをHTML/CSSに変換 |
| react-native-webview | ^13.16.1 | iPhone内でWebページ（HTML）を表示 |
| @react-native-async-storage | 2.2.0 | キーバリュー永続化ストレージ |
| Leaflet | 1.9.4 | インタラクティブマップ（ブラウザ内） |

### 開発環境（必須）

| ツール | 役割 |
|--------|------|
| Node.js（v18以上推奨） | JavaScriptランタイム・npmの実行 |
| npm | パッケージ管理 |
| Expo CLI（`npx expo`） | 開発サーバー起動・ビルド |
| Xcode（Mac必須） | iOSシミュレータ・本番ビルド |
| TypeScript（devDependency） | 型チェック・コンパイル |
| VS Code / Cursor 等 | コードエディタ（任意） |

### 開発機要件

- **Mac必須**（Xcodeが必要なため。iOS開発はWindowsでは不可）
- Xcode 16以上（Expo SDK 54の要件）
- iOS実機テストは Expo Go アプリ（無料）で可能
- App Store配布には Apple Developer Program（年$99）が必要

---

## 3. iPhone版の使い方と開発手法

### 3-1. 初期セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/masauehr/iphone-weather-app.git
cd iphone-weather-app

# 依存パッケージをインストール
npm install
```

### 3-2. 実機確認（Expo Go）

```bash
npx expo start
```

起動後の選択肢:
- `i` → iOSシミュレータで起動（Xcode必須）
- `w` → Webブラウザで起動
- `s` → Expo Goモードに切替（実機接続）

Expo Goアプリ（iPhoneにインストール済み）の「Projects」タブにプロジェクトが自動表示される。MacとiPhoneが**同じWi-Fiネットワーク**に接続していること。

### 3-3. 開発時のホットリロード

ファイルを保存すると自動的にiPhone側が更新される（**Fast Refresh**）。
レイアウト・スタイル・ロジック変更は即座に反映されるが、ネイティブモジュールの追加（`npm install` を伴う変更）は再起動が必要。

```bash
# キャッシュクリア再起動（変更が反映されない場合）
npx expo start --clear
```

### 3-4. コンポーネント構造

```
app/
├── _layout.tsx           # アプリ全体のルートレイアウト（テーマ・フォント読込）
└── (tabs)/
    ├── _layout.tsx       # タブバーの設定（アイコン・ラベル・色）
    ├── index.tsx         # 天気予報タブ（メイン画面）
    ├── radar.tsx         # レーダータブ（Web版）
    ├── radar.native.tsx  # レーダータブ（iPhone版）
    └── explore.tsx       # 未使用タブ（デフォルトのまま）
```

### 3-5. プラットフォーム分岐の仕組み

expo-routerは `.native.tsx` 拡張子を自動判別する:
- `radar.native.tsx` → iOS / Android でのみ使用
- `radar.tsx` → Web版でのみ使用（`.native` がないため）

これにより、iPhone向けには `react-native-webview`（WebView）、Web向けには `<iframe>` を使い分けている。

```typescript
// radar.native.tsx（iPhone版）
import WebView from 'react-native-webview';
<WebView source={{ html: radarHtml }} javaScriptEnabled domStorageEnabled />

// radar.tsx（Web版）
<iframe srcDoc={radarHtml} sandbox="allow-scripts allow-same-origin" />
```

### 3-6. スタイリングの方法

React Nativeは `StyleSheet.create()` でスタイルを定義する。CSSではなくJavaScriptオブジェクト形式。

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  button: {
    padding: 12,
    borderRadius: 8,
    color: '#000000',  // iOSで色が見えなくなる問題を防ぐため明示
  },
});
```

### 3-7. iPhone固有の注意点

| 問題 | 原因 | 対処 |
|------|------|------|
| テキスト色が見えない | iOSのデフォルトカラーが黒になる場合 | `color: '#000000'` を明示 |
| 横スクロールがクリップされる | iOSの `ScrollView` 挙動 | `View + flexWrap` を使用 |
| WebView内でメモリ超過→黒画面 | iOSのWKWebKitのメモリ制限 | Leafletのレイヤー数を12枚固定に制限 |
| セーフエリア | ノッチ・ホームインジケーターとの干渉 | `useSafeAreaInsets()` でpadding調整 |

---

## 4. Apple（App Store）へのデプロイ手順

現在はExpo Go（開発配布）のみ対応。App Store正式公開には以下の手順が必要。

### 4-1. 必要な準備

| 項目 | 詳細 |
|------|------|
| Apple Developer Program | 年額$99（約15,000円）の登録が必要 |
| Xcode | 最新版（Mac App Storeで無料配布） |
| Bundle Identifier | `com.{あなたのドメイン}.weather-forecast` の形式で決める |
| アプリアイコン | 1024×1024px の PNG（アルファチャンネル不可） |
| スクリーンショット | 各デバイスサイズごとに必要（App Store Connect で管理） |

### 4-2. EAS Buildを使ったビルド（推奨）

Expo Application Services（EAS）はクラウドビルドサービス。
Xcode の詳細知識なしにApp Store向けのIPA（iOSアプリパッケージ）を生成できる。

```bash
# EAS CLIをインストール
npm install -g eas-cli

# Expoアカウントにログイン（無料）
eas login

# プロジェクトの初期化（初回のみ）
eas init

# ビルド設定ファイルを生成（初回のみ）
eas build:configure

# App Store向けビルド（クラウドで実行される）
eas build --platform ios --profile production
```

`eas.json`（ビルド設定ファイル）の例:
```json
{
  "build": {
    "production": {
      "ios": {
        "bundleIdentifier": "com.example.weatherforecast",
        "buildNumber": "1"
      }
    }
  }
}
```

### 4-3. App Store Connect での申請手順

1. [appstoreconnect.apple.com](https://appstoreconnect.apple.com) にログイン
2. 「新規App」を作成（Bundle IDを設定）
3. メタデータを入力（アプリ名・説明・カテゴリ・スクリーンショット）
4. EAS Build で生成したIPAをアップロード（`eas submit --platform ios`）
5. Appleの審査に提出（通常1〜3日）
6. 審査通過後に公開

### 4-4. app.json の App Store向け設定

```json
{
  "expo": {
    "name": "天気予報",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.example.weatherforecast",
      "buildNumber": "1",
      "supportsTablet": true,
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "現在地の天気を表示するために使用します"
      }
    }
  }
}
```

### 4-5. TestFlight（ベータ配布）

App Store正式公開前に、特定ユーザーにテスト配布できる。

```bash
eas submit --platform ios --latest
```

App Store Connect で「テスター」のメールアドレスを招待する。
TestFlightアプリ（iPhoneに無料インストール）でベータ版をインストールできる。

---

## 5. Web版の技術実装

### 5-1. Web版のプログラミング言語

開発時は **TypeScript**（JavaScriptの型付き版）で記述するが、
Expo のビルドプロセスによって **JavaScript + HTML + CSS** に変換される。

実行時（ブラウザ上）の技術スタック:

| 技術 | 役割 |
|------|------|
| JavaScript | 実行コード（TypeScriptからコンパイル済み） |
| React DOM | UIのレンダリング（React NativeコンポーネントをHTML要素に変換） |
| react-native-web | View→div, Text→span, StyleSheet→CSSに変換するレイヤー |
| HTML / CSS | 最終的な表示形式 |

`react-native-web` が React Native の UI コンポーネントを自動的に HTML/CSS に変換するため、
1つのコードで iOS/Web 両方に対応できる。

### 5-2. Web版のビルドプロセス

```
TypeScript (.tsx)
    ↓ Expo（Webpack/Metro Bundler）
JavaScript バンドル（_expo/static/js/*.js）
    ↓
dist/
├── index.html          # エントリーポイント
├── _expo/
│   └── static/
│       ├── js/         # バンドルされたJSコード
│       └── fonts/      # フォントファイル
└── assets/             # 画像・アイコン等
```

### 5-3. レーダー画面のWeb版実装

Leaflet はブラウザ専用のライブラリで React Native に対応していない。
そのため、Leafletを使う部分を「生のHTML文字列」として `radarHtml.ts` に格納し、
Web版では `<iframe>` の `srcDoc` に流し込んで表示する。

```typescript
// radarHtml.ts → HTMLを文字列として持つ（JavaScriptで書かれた地図コード）
export const radarHtml = `<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
</head>
<body>
  <!-- Leafletの地図 + 気象庁タイル -->
</body>
</html>`;
```

```typescript
// radar.tsx（Web版の画面コンポーネント）
<iframe srcDoc={radarHtml} sandbox="allow-scripts allow-same-origin" />
```

iframe内のJavaScriptは外部CDN（unpkg.com）から Leaflet を読み込む。
そのため**インターネット接続が必要**（オフラインでは地図は表示されない）。

### 5-4. 静的サイトとして動作する理由

`app.json` で `"output": "static"` を指定しているため、
ビルド結果はすべて**静的ファイル（HTML/CSS/JS）**になる。
サーバーサイドの処理（Node.jsやPythonのサーバー）は一切不要。

```json
{
  "web": {
    "output": "static"
  }
}
```

---

## 6. Web版を他のWebサーバーへ移植する方法

Web版は静的ファイルなので、どのWebサーバーにも移植できる。

### 6-1. ビルド手順

```bash
# Web版をビルド
npx expo export -p web

# → dist/ フォルダに静的ファイルが生成される
```

### 6-2. サブディレクトリなしで配置する場合

ドメインのルート（`https://example.com/`）で配信する場合は、
`app.json` の `baseUrl` を削除または空文字にしてビルドする。

```json
{
  "experiments": {
    "baseUrl": ""
  }
}
```

その後 `dist/` の中身をWebサーバーのルートにアップロード。

### 6-3. サブディレクトリで配置する場合

`https://example.com/weather/` のようなサブディレクトリで配信する場合:

```json
{
  "experiments": {
    "baseUrl": "/weather"
  }
}
```

### 6-4. 各Webサーバーへの移植例

#### Apache / Nginx

```bash
# ビルド
npx expo export -p web

# dist/ の中身をドキュメントルートへコピー
scp -r dist/* user@server:/var/www/html/weather/
```

Nginx の設定例（SPA向け）:
```nginx
server {
  root /var/www/html/weather;
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

#### Python の簡易HTTPサーバー（ローカルテスト用）

```bash
npx expo export -p web
cd dist
python3 -m http.server 8080
# → http://localhost:8080/ でアクセス可能
```

#### Netlify / Vercel

`dist/` フォルダをドラッグ＆ドロップするだけで公開できる。

```bash
# Netlify CLI
npm install -g netlify-cli
npx expo export -p web
netlify deploy --dir dist --prod
```

#### AWS S3 + CloudFront

```bash
# S3バケットに同期
aws s3 sync dist/ s3://your-bucket-name/ --delete
```

S3のスタティックウェブホスティングを有効にし、CloudFrontでキャッシュ配信する。

### 6-5. 移植時の注意点

| 注意点 | 内容 |
|--------|------|
| CORS | 気象庁API（JMA）はCORS対応済みのため、ブラウザから直接アクセス可能 |
| HTTPS | 本番環境はHTTPS必須（HTTP環境では一部ブラウザでAPIが制限される） |
| `_expo/` フォルダ | Apacheなどは `_` 始まりのフォルダを無視する設定がある → `.htaccess` で対処 |
| フォント | フォントパスが正しく通るよう `baseUrl` を設定する |
| オフライン | 静的ファイルはキャッシュできるが、JMA APIはオンライン必須 |

Apache で `_expo/` フォルダが無効になる場合の `.htaccess`:
```apache
Options +FollowSymLinks
RewriteEngine On
RewriteBase /weather/
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /weather/index.html [L]
```

---

## 7. iPhone版→Web版の変換の仕組み

### 7-1. 開発ワークフロー

実際の開発は「iPhoneで動かしながらコードを書き、それをそのままWebとしても公開する」流れ。
「変換」という別工程は存在せず、**1つのコードが両方で動く**。

```
① コードを書く（TypeScript）
        ↓
② npx expo start（開発サーバー起動）
        ├─ iPhoneのExpo Goで即確認
        └─ ブラウザ(localhost)でも同時確認
        ↓
③ 問題がなければデプロイ
        ├─ eas build → App Store（iPhone）
        └─ npm run deploy → GitHub Pages（Web）
```

### 7-2. react-native-web の変換テーブル

`react-native-web` が React Native コンポーネントを自動的に対応するHTML要素に変換する。

| React Native | Web（HTML）に変換 |
|-------------|-----------------|
| `<View>` | `<div>` |
| `<Text>` | `<div>` または `<span>` |
| `<Image>` | `<img>` |
| `<TouchableOpacity>` | `<div role="button">` |
| `<ScrollView>` | スクロール可能な `<div>` |
| `<Modal>` | `<div>` + オーバーレイ |
| `StyleSheet.create()` | CSS に変換 |

`AsyncStorage` も Web版ではブラウザの **localStorage** に自動的にマッピングされる。
そのため、お気に入りや最終選択地点の記憶機能もWeb版で同様に動作する。

### 7-3. Web版で動かないもの・制限

| 機能 | iPhone版 | Web版 | 理由 |
|------|---------|------|------|
| ハプティクス（振動） | 動作 | 無効 | iOSのみ |
| プッシュ通知 | 対応可（未実装） | 制限あり | ブラウザ通知は許可が必要 |
| ファイルシステムアクセス | 対応可 | 制限あり | Webはsandbox |
| WebView | 動作 | `.native.tsx` が自動で除外 | 専用コンポーネントが分岐 |
| セーフエリア（ノッチ） | 動作 | 無視 | ブラウザにはノッチなし |

### 7-4. プラットフォーム固有コードの書き方

必要な場合は `Platform.OS` で分岐できる:
```typescript
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
  },
});
```

または `Platform.select()`:
```typescript
const message = Platform.select({
  ios: 'iPhoneです',
  android: 'Androidです',
  web: 'Webブラウザです',
});
```

---

## 8. レーダービューアの技術詳細

### 8-1. アーキテクチャの理由

Leaflet は `document.getElementById()` や `window` オブジェクトを直接操作するブラウザ専用ライブラリ。
React Nativeの仮想DOM環境では動作しない。

解決策: **HTMLを文字列として定義し、ブラウザ環境（WebView/iframe）の中で実行する**。

```
radarHtml.ts
└── HTMLテンプレートリテラルとしてエクスポート
    ├── <head>にLeaflet CSS/JSをCDNから読み込む
    ├── <body>に地図コンテナとコントロールUI
    └── <script>に地図ロジック（純粋なJavaScript）
```

### 8-2. 主要な状態変数

```javascript
var FIXED_FRAME_COUNT = 12;   // フレーム数固定（iOSメモリ管理のため）
var timeRangeHours = 2;       // アニメーション時間範囲（デフォルト2時間）
var historicalOffsetMin = 0;  // 0=現在モード、正値=過去へのオフセット（分）
var isPlaying = true;         // 再生中かどうか
var currentFrame = 0;         // 現在のフレームインデックス
```

### 8-3. フレーム生成の仕組み（メモリ管理）

フレーム数を固定12枚にし、時間範囲に応じてステップ間隔を変えることで
iOSのWebKitメモリ制限（多数のTileLayer → メモリ超過 → 黒画面）を回避。

```javascript
// レーダーの場合（RADAR_INT = 300秒 = 5分間隔）
var radarFactor = Math.max(1, Math.round(timeRangeHours * 3600 / (FIXED_FRAME_COUNT * RADAR_INT)));
var radarStepSec = radarFactor * RADAR_INT;

// ひまわり衛星の場合（params.interval = 600秒 = 10分間隔）
var satFactor = Math.max(1, Math.round(timeRangeHours * 3600 / (FIXED_FRAME_COUNT * params.interval)));
var satStepSec = satFactor * params.interval;
```

| 時間範囲 | レーダーステップ | 衛星ステップ | Leafletレイヤー総数 |
|---------|--------------|------------|------------------|
| 1時間 | 5分×12 | 10分×12 | 24枚 |
| 2時間 | 10分×12 | 10分×12 | 24枚 |
| 3時間 | 15分×12 | 20分×12 | 24枚 |

常に24枚固定でiOSのメモリ制限内に収まる。

### 8-4. レーダーフレームのprobe（存在確認）

JMAのnowcデータ（降水レーダー）はサーバー上に**60〜70分程度しか保持されない**。
そのため1時間レンジでも最古フレームが約72分前となり、前半フレームのタイルが404になる。

| 時間範囲 | 最古フレーム | 存在しないフレーム数の目安 |
|---------|-----------|----------------------|
| 1時間 | 約72分前 | 1〜2枚 |
| 2時間 | 約132分前 | 4〜5枚 |
| 3時間 | 約192分前 | 6〜8枚 |

これを放置すると「前半フレームでレーダーが静止して見える」問題が発生する（`closestRadar()` が常に最古の有効フレームを返し続けるため）。

対策として、衛星（`probe()`）と同様に `probeRadar()` で候補フレームを事前確認し、
有効フレームのみを `radarFrames` に格納してからロードを開始する。

```javascript
// 衛星・レーダーを並行probeし、両方完了後にロード開始
probe(currentArea, currentBand, satCands, function(valid){ validSat=valid; satDone=true; tryLoadAll(); });
probeRadar(radarCands, function(valid){ validRadar=valid; radarDone=true; tryLoadAll(); });
```

### 8-4. 過去データ再生

```javascript
function isHistoricalMode() {
  return historicalOffsetMin > 0;
}

// [◀5h] ボタン
function stepBack(hours) {
  historicalOffsetMin += hours * 60;
  buildFrames(true);  // true = マップビュー維持
  updateHistLabel();
}

// [▶現在] ボタン
function goNow() {
  historicalOffsetMin = 0;
  buildFrames(true);  // マップビュー（ズーム・中心位置）はリセットしない
}

// 自動更新
function autoLoop() {
  if (isHistoricalMode()) { scheduleAuto(); return; }  // 過去モード中はスキップ
  buildFrames(true);
  scheduleAuto();
}
```

### 8-5. 凡例の実装

気象庁 SVG仕様（`legend_jp_normal_hrpns.svg`）に準拠した8段階カラースケール。

| 色 | RGB | 降水強度 |
|----|-----|---------|
| 紫 | rgb(180,0,104) | ≥80 mm/h |
| 赤 | rgb(255,40,0) | ≥50 mm/h |
| 橙 | rgb(255,153,0) | ≥30 mm/h |
| 黄 | rgb(255,245,0) | ≥20 mm/h |
| 濃青 | rgb(0,65,255) | ≥10 mm/h |
| 青 | rgb(33,140,255) | ≥5 mm/h |
| 薄青 | rgb(160,210,255) | ≥1 mm/h |
| 白 | rgb(242,242,255) | <1 mm/h |

```css
/* 凡例パネル: 画面左下に固定表示 */
#legendPanel {
  position: fixed;
  bottom: 60px;
  left: 6px;
  z-index: 900;
  background: rgba(15,52,96,0.92);
  border: 1px solid #4a90e2;
  border-radius: 6px;
  padding: 6px 8px;
  display: none;  /* 初期非表示 */
}
```

---

## 9. 天気予報画面の技術詳細

### 9-1. 永続化ストレージ（AsyncStorage）

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// 保存
await AsyncStorage.setItem('favorites', JSON.stringify(favorites));
await AsyncStorage.setItem('lastArea', selectedArea.code);

// 読み込み
const raw = await AsyncStorage.getItem('favorites');
if (raw) setFavorites(JSON.parse(raw));
const lastCode = await AsyncStorage.getItem('lastArea');
```

iPhone版は **NSUserDefaults**（iOSのキーバリューストア）に保存される。
Web版は **localStorage**（ブラウザのストレージ）に自動的にマッピングされる。

### 9-2. 地域階層構造

JMA APIの地域構造:
```
centers（地方）
  └─ offices（都道府県・地域）  ← forecast/{code}.json のcode
       └─ class10s（市区町村群）← JSON内に複数含まれる
            └─ class15s・class20s（詳細地区）
```

このアプリでは **offices** 単位でAPIを叩き、レスポンスに含まれる **class10s** をサブ地域として表示する。
追加のAPIコールなしに1回のfetchで全サブ地域のデータを取得できる。

### 9-3. 気温取得ロジック

週間予報APIの `tempsMax[0]`（明日分）が空文字になる問題への対処:

```typescript
// 短期予報から今日・明日の気温を取得
function getShortTemp(json: any, aIdx: number, dateStr: string): {max: string, min: string} {
  const ts2 = json[0]?.timeSeries?.[2];
  const areas = ts2?.areas ?? [];
  const cap = Math.min(aIdx, areas.length - 1);
  const temps = areas[cap]?.temps ?? [];
  const times = ts2?.timeDefines ?? [];
  // 対象日付のtempをすべて集め、min/maxを算出
  const dayTemps = times
    .map((t: string, i: number) => t.slice(0, 10) === dateStr ? Number(temps[i]) : NaN)
    .filter((v: number) => !isNaN(v));
  return {
    max: dayTemps.length ? String(Math.max(...dayTemps)) : '',
    min: dayTemps.length ? String(Math.min(...dayTemps)) : '',
  };
}
```

### 9-4. 天気絵文字の変換

天気テキスト（「晴れ時々くもり」等）を絵文字に変換する際の区切り記号:

| 日本語 | 区切り | 例 |
|--------|--------|-----|
| のち | `→` | ☁️→☀️ |
| 時々 | `//` | ☀️//⛅ |
| 一時 | `/` | ☀️/🌧️ |

---

## 10. JMA API 構造メモ

### 天気予報 API

```
GET https://www.jma.go.jp/bosai/forecast/data/forecast/{code}.json
```

```
json[0] — 短期予報（3日間）
  timeSeries[0].timeDefines           : 天気日時（3要素）
  timeSeries[0].areas[i].weatherCodes : 天気コード（areas[i] = サブ地域i）
  timeSeries[0].areas[i].weathers     : 天気テキスト
  timeSeries[1].timeDefines           : 降水確率日時（時間帯別）
  timeSeries[1].areas[i].pops         : 降水確率（%）
  timeSeries[2].areas[i].temps        : 今日・明日の気温

json[1] — 週間予報（7日間）
  timeSeries[0].areas[i].weatherCodes : 天気コード
  timeSeries[0].areas[i].pops         : 降水確率
  timeSeries[0].areas[i].reliabilities: 信頼度（A/B/C）
  timeSeries[1].areas[i].tempsMax     : 最高気温（index[0]は空文字の場合あり）
  timeSeries[1].areas[i].tempsMin     : 最低気温（同上）
```

### 降水レーダー API（ナウキャスト）

```
https://www.jma.go.jp/bosai/jmatile/data/nowc/{time}/surf/hrpns/{z}/{x}/{y}.png
```
- `{time}` : yyyyMMddHHmm00 形式（5分刻み）
- `{z}/{x}/{y}` : Leafletのタイル座標

### ひまわり衛星 API

```
https://www.jma.go.jp/bosai/himawari/data/satimg/{time}/fd/{type}/{z}/{x}/{y}.jpg
```
- `{type}` : `B03` (可視) / `B13` (赤外)
- `{time}` : yyyyMMddHHmm00 形式（10分刻み）

### 主要地域コード

| 地域 | code | サブ地域の例 |
|------|------|------------|
| 北海道（札幌） | 016000 | |
| 北海道（函館） | 017000 | |
| 北海道（旭川） | 012000 | |
| 北海道（釧路） | 014100 | |
| 北海道（帯広） | 014030 | |
| 北海道（網走） | 013000 | |
| 北海道（室蘭） | 015000 | |
| 北海道（稚内） | 011000 | |
| 東京 | 130000 | |
| 大阪 | 270000 | |
| 鹿児島 | 460100 | |
| 奄美 | 460040 | |
| 沖縄本島 | 471000 | 本島中南部・本島北部・久米島 |
| 大東島 | 472000 | |
| 宮古島 | 473000 | |
| 八重山 | 474000 | 石垣島・与那国島 |

---

## 11. GitHub Pages デプロイ手順

### deploy.js の処理フロー

```javascript
// 1. Webビルド（predeploy として npm run predeploy が事前実行される）
//    → npx expo export -p web → dist/ を生成

// 2. .nojekyll を作成（_expo/ フォルダの Jekyll 除外を防止）
fs.writeFileSync('dist/.nojekyll', '');

// 3. dist/ 内で一時的な git リポジトリを作成し gh-pages ブランチとして push
run('cd dist && git init -b gh-pages');
run('cd dist && git add -A');
run('cd dist && git commit -m "Deploy to GitHub Pages"');
run('cd dist && git push -f https://github.com/masauehr/iphone-weather-app.git gh-pages');

// 4. 一時 git を削除（dist/.git を削除）
fs.rmSync('dist/.git', { recursive: true, force: true });
```

### app.json の重要設定

```json
{
  "expo": {
    "web": { "output": "static" },
    "experiments": {
      "baseUrl": "/iphone-weather-app",
      "typedRoutes": true,
      "reactCompiler": true
    }
  }
}
```

### ハマりポイントまとめ

| 問題 | 原因 | 解決策 |
|------|------|--------|
| JSバンドルが404 | サブディレクトリでパスがずれる | `app.json` に `baseUrl` を設定 |
| `_expo/` が無視される | GitHub PagesのJekyll処理がアンダースコアフォルダをスキップ | `.nojekyll` を dist に追加 |
| フォントが404 | `gh-pages` npmパッケージがnode_modulesを除外 | カスタム `deploy.js` でgit直接pushに変更 |

### 自動デプロイフック（Claude Code）

`.claude/settings.json` の `PostToolUse` フックにより、**`git push` 実行後に自動的に `npm run deploy` が走る**。
Claude Code でコードを修正・push するだけでWebアプリが自動更新される。

```json
// .claude/settings.json（抜粋）
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "if": "Bash(git *)",
        "command": "cmd=$(jq -r '.tool_input.command'); if echo \"$cmd\" | grep -qE 'git( -C [^ ]+)? push' && echo \"$cmd\" | grep -qv 'gh-pages' && echo \"$cmd\" | grep -qv 'pc_docs'; then cd /Users/masahiro/projects/mobile_app && npm run deploy 2>&1; fi",
        "timeout": 180,
        "statusMessage": "Webアプリをデプロイ中..."
      }]
    }]
  }
}
```

**フィルタリングルール**

| git pushコマンド | 自動デプロイ |
|-----------------|------------|
| `git push origin main`（mobile_app内） | 実行 ✅ |
| `git -C .../mobile_app push origin main` | 実行 ✅ |
| `git -C .../pc_docs push origin main` | スキップ（別リポジトリ） ⏭ |
| `git push -f ... gh-pages`（deploy.js内部） | スキップ（ループ防止） ⏭ |

---

## 12. 改修履歴

### 2026-06 レーダーprobe修正

#### レーダー・衛星タブ

| 改修 | 内容 |
|------|------|
| レーダーフレームprobe導入 | 衛星と同様にレーダーも `probeRadar()` で事前存在確認するよう変更 |
| 前半フレーム静止バグ修正 | JMAのnowcデータは約60〜70分しか保持されないため、1時間・3時間レンジで前半フレームが空になる問題を修正 |
| 並行probe | 衛星・レーダーのprobeを並行実行して待ち時間を短縮 |

---

### 2026-05 今回の改修内容

#### レーダー・衛星タブ

| 改修 | 内容 |
|------|------|
| アニメーション時間拡張 | 1時間のみ → 1時間/2時間/3時間を選択可能に |
| デフォルト変更 | 1時間 → 2時間 |
| 過去データ再生 | [◀5h][◀1h][1h▶][▶現在] ボタンで最大5時間前まで遡れるように |
| 過去モード中の自動更新停止 | 過去モード中は autoLoop で再構築をスキップ |
| マップビュー維持 | `goNow()` で `buildFrames(true)` に変更（表示範囲リセットを防止） |
| iPhone黒画面対策 | 動的フレーム数 → 固定12フレーム＋可変ステップ方式（WebKitメモリ超過防止） |
| 降水強度凡例 | [凡例]ボタンで8段階カラースケールをオン/オフ |

#### 天気予報タブ

| 改修 | 内容 |
|------|------|
| お気に入り地点 | 3地点登録・長押し編集・起動時復元（AsyncStorage） |
| 最終地点記憶 | 最後に選んだ地点を AsyncStorage に保存し次回復元 |
| 更新ボタン | 右上に🔄ボタンを追加 |
| 地域拡張 | area.json に合わせて全47都道府県58地点（10セクション）に拡充 |
| デフォルト変更 | 沖縄本島・東京・大阪の3地点をデフォルトお気に入りに |
| サブ地域切替 | class10s レベルのサブ地域を取得し、複数ある場合に切替バーを表示 |
| 安全なインデックス参照 | サブ地域数が異なる場合のクラッシュを防ぐ `cap()` 関数を追加 |

---

*最終更新: 2026-06*
