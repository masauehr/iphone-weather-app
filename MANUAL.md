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
10. [キキクルビューアの技術詳細](#10-キキクルビューアの技術詳細)
11. [JMA API 構造メモ](#11-jma-api-構造メモ)
12. [GitHub Pages デプロイ手順](#12-github-pages-デプロイ手順)
13. [改修履歴](#13-改修履歴)

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

## 10. キキクルビューアの技術詳細

### 10-1. アーキテクチャ概要

キキクルタブはレーダー・衛星タブと同じアーキテクチャ（Leaflet HTML を WebView/iframe に閉じ込める方式）で実装している。

```
kikikuruHtml.ts（Leaflet HTML・純粋なJavaScript）
        │
        ├─── kikikuru.native.tsx → WebView でHTML文字列を読み込む（iPhone/Android）
        └─── kikikuru.tsx        → <iframe> でHTML文字列を読み込む（Web）
```

### 10-2. JMA キキクルタイルURL一覧

| 種類 | URL パターン | 時刻依存 |
|------|-------------|---------|
| 大雨キキクル（rain_mesh） | `bosai/jmatile/data/risk/{ymdhms}/none/{ymdhms}/surf/rain_mesh/{z}/{x}/{y}.png` | ✅ |
| 土砂キキクル（land） | `bosai/jmatile/data/risk/{ymdhms}/none/{ymdhms}/surf/land/{z}/{x}/{y}.png` | ✅ |
| 浸水キキクル（inund） | `bosai/jmatile/data/risk/{ymdhms}/none/{ymdhms}/surf/inund/{z}/{x}/{y}.png` | ✅ |
| 洪水危険度PBF（flood） | `bosai/jmatile/data/risk/{ymdhms}/none/{ymdhms}/surf/flood/{z}/{x}/{y}.pbf` | ✅ |
| 全河川背景PNG（静的） | `bosai/jmatile/data/map/none/none/none/surf/flood/{z}/{x}/{y}.png` | ❌（時刻なし） |
| 降水レーダー（nowc） | `bosai/jmatile/data/nowc/{ymdhms}/none/{ymdhms}/surf/hrpns/{z}/{x}/{y}.png` | ✅ |

- `{ymdhms}` : `yyyyMMddHHmmss` 形式、10分刻み
- flood PBFのタイル: 偶数ズームのみ存在（z=4,6,8,10,12,14）/ rain_mesh・land・inund PNGのnativeZoom: 4〜13（同様に偶数のみ）
- 奇数ズームでは z-1 の親タイル座標でPBFを取得し、canvas scale(2,2)＋translate でクアドラント表示（後述）

### 10-3. 洪水キキクルの2層構造（最重要）

JMA公式サイトのキキクルビューアは、洪水キキクルを **2レイヤーを重ねて** 表現している。

| 層 | 役割 | レイヤー種類 | 表示内容 |
|----|------|------------|---------|
| 第1層（z=204） | 全河川の背景 | PNG ラスタータイル（時刻なし） | 全河川を水色で常時表示 |
| 第2層（z=205） | 危険度の色付き | PBF ベクタータイル（時刻あり） | 危険度1〜4の河川だけ上書き着色 |

**なぜPBFだけでは全河川が表示されないか**:
JMAのflood PBFには「危険度データが存在する河川」しか含まれていない。危険度0（問題なし）の河川はPBF自体に入っていないため、PBFのみ描画すると一部しか現れない。
この2層構造は `web/webapp/kikikuruViewer/js/image_util2.js` の165行目（`river_channel`エントリ）を参照して発見した。

危険度ごとの配色は以下の通り（JMA仕様準拠）:

| level（PBFプロパティ） | 色 |
|---------------------|-----|
| 未設定（level=0） | 水色（第1層PNG） |
| 1 | 黄（`#f2e700`） |
| 2 | 赤（`#ff2800`） |
| 3 | 紫（`#aa00aa`） |
| 4 | 黒（`#0c000c`） |

### 10-4. Leaflet ペイン構成（z-index 設計）

```javascript
// CartoDB tilePane のデフォルト z=200 より大きい値を割り当てる
map.createPane('rainPane');      map.getPane('rainPane').style.zIndex      = 201; // 大雨
map.createPane('landPane');      map.getPane('landPane').style.zIndex      = 202; // 土砂
map.createPane('inundPane');     map.getPane('inundPane').style.zIndex     = 203; // 浸水
map.createPane('floodBasePane'); map.getPane('floodBasePane').style.zIndex = 204; // 静的河川PNG
map.createPane('floodRiskPane'); map.getPane('floodRiskPane').style.zIndex = 205; // 危険度PBF
map.createPane('radarPane');     map.getPane('radarPane').style.zIndex     = 350; // レーダー
map.createPane('coastPane');     map.getPane('coastPane').style.zIndex     = 600; // 海岸線（最前面）
```

### 10-5. ベースマップ（国土地理院淡色地図）

当初は CartoDB 暗色地図を使用していたが、「地図全体ではなく地図だけの明るさを調整したい」という要件に対応するため **国土地理院淡色地図** （`cyberjapandata.gsi.go.jp/xyz/pale/`）に変更した。

背景色を `#1a1a2e`（濃紺）に固定し、地図タイルのopacityを3段階で切り替えることで、地図の明度だけを調整できる。

```javascript
var BASE_CHIRIIN   = 'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png';
var BASE_OPACITIES = [0.2, 0.55, 0.9];  // 地図暗 / 地図中 / 地図明
var BASE_LABELS    = ['地図暗', '地図中', '地図明'];
// opacity が低いほど濃紺背景が透けて暗く見える
```

### 10-6. 時間範囲選択・過去データ再生

レーダー・衛星タブと同方式で実装した。

- **時間範囲選択**: 1時間 / 2時間（デフォルト）/ 3時間
- **フレーム数**: `timeRangeHours × 6`（10分間隔固定）→ 6/12/18フレーム
- **過去モード変数**: `historicalOffsetMin`（0 = 現在、正値 = 現在から遡る分数）

| ボタン | 動作 |
|--------|------|
| ◀6h | 6時間前へ（`historicalOffsetMin += 360`） |
| ◀1h | 1時間前へ（`historicalOffsetMin += 60`） |
| 1h▶ | 1時間後へ（`historicalOffsetMin = Math.max(0, …-60)`） |
| ▶現在 | 現在に戻る（`historicalOffsetMin = 0`、ボタン非表示） |

過去モード中は自動更新（10分ごとの `buildFrames` 再構築）をスキップする。

### 10-7. 試行錯誤の記録（ハマりポイント）

#### ① VectorGrid の `setOpacity()` が効かない

Leaflet.VectorGrid には `setOpacity()` メソッドが存在しないか動作しない。

- **失敗**: `floodLayer.setOpacity(0)` → 無効
- **解決**: `map.removeLayer(layer)` / `layer.addTo(map)` で着脱制御に統一

#### ② VectorGrid 2インスタンス同時ロードで描画競合

当初「level=0河川（水色）用VectorGrid」と「危険度色VectorGrid」の2インスタンスが同一PBF URLを読み込む実装にしていた。

- **症状**: 「全河川が表示されていない」（一部の河川が消える）
- **原因**: 同じPBFへの2重リクエストでタイル描画が競合する
- **解決**: level=0専用インスタンスを廃止し、静的PNG（第1層）を背景に採用。PBFは1インスタンスのみ

#### ③ CSSペインのopacityがWebView内で効かない

`map.getPane('floodBasePane').style.opacity = '0.3'` をJSから設定したが、WebView環境では期待通りに動作しなかった（表示が消えた）。

- **解決**: paneのCSS opacityは使わず、addTo/removeLayerによる着脱に統一

#### ④ 洪水PBFが「全河川が表示されていない」ように見える

- **原因**: JMAのflood PBFには危険度データのある河川しか含まれない（❸ 参照）
- **発見**: `web/webapp/kikikuruViewer/js/image_util2.js` 165行目に静的PNG URLが記録されていた
- **解決**: 時刻なし静的PNG（`…/map/none/none/none/surf/flood/…`）を第1層として追加

#### ⑤ 洪水レイヤーON/OFF切替の同期漏れ

- `riverBaseLayer`（静的PNG）と `floodBaseLayer`（PBF）の2レイヤーは必ず同期して着脱する
- `visible['flood']` を直接変更する箇所（個別トグルボタン・`inundFloodMode` ボタン）の両方で `updateRiverBaseLayer()` と `updateFloodBaseLayer()` を呼ぶこと

#### ⑥ 洪水PBFがアニメーションフレームと同期しない

- **症状**: スライダーを動かしても洪水危険度の色が変わらない。動画時間範囲（1h/2h/3h）を切り替えると変化するが、同じ時刻を指していても時間帯によって色が異なって見えた
- **原因**: `updateFloodBaseLayer()` が常に `frames[frames.length-1].ymdhms`（最終フレームの固定タイムスタンプ）でVectorGridを生成していた。`showFrame()` 内でPNG系レイヤーの `reapplyOpacity()` しか呼んでおらず、flood PBFの時刻が更新されなかった
- **解決**: `showFrame()` に `scheduleFloodToFrame(frames[idx].ymdhms)` を追加し、表示フレームのymdhmsでflood VectorGridを再生成するようにした。400msデバウンス（`floodFrameTimer`）を挟んで高速スライダー操作時の過剰リクエストを抑制
- **備考**: 間引きは行っていない。フレームは常に10分間隔固定で、1h=6枚・2h=12枚・3h=18枚

#### ⑦ 洪水キキクルがズームレベルにより交互に表示されない

- **症状**: zoom偶数（10,12…）では表示されるが、zoom奇数（9,11,13…）では消えるという「交互消え」が発生
- **原因**: JMAの洪水PBFタイルは他レイヤー（rain_mesh等）と同様に**偶数ズームのみ存在**する気象庁仕様。奇数ズームでは `{z}/{x}/{y}` が404を返すためタイルが空白になる
- **解決**: `floodFetchCoords()` 関数で奇数ズームを検出し、z-1（偶数）の親タイル座標 `(floor(x/2), floor(y/2))` でPBFを取得。canvas描画時に `scale(2,2)` + `translate(-qx*128, -qy*128)` で正しいクアドラント（左上/右上/左下/右下）を切り出して表示する

```javascript
function floodFetchCoords(displayZ, x, y){
  if(displayZ % 2 === 0) return { z:displayZ, x:x, y:y, qx:0, qy:0, isOdd:false };
  // 奇数ズーム: 親タイル(z-1)を取得、クアドラント(qx,qy)を算出
  return { z:displayZ-1, x:Math.floor(x/2), y:Math.floor(y/2), qx:x%2, qy:y%2, isOdd:true };
}
// 描画: isOdd=true の場合
ctx.scale(2, 2);
ctx.translate(-quadX * 128, -quadY * 128);
// → lineWidth は scale後に2倍になるため lw/2 で指定
```

- **既知の制限**: 奇数ズームでは scale(2,2)の影響で線幅が偶数ズームの約半分になる（今後の検討課題）

#### ⑧ 奇数ズームで別クアドラントの河川が混入する

- **症状**: 奇数ズームにすると、その地点とは別の場所にあるはずの洪水キキクル線が地図上に出現する
- **原因**: `odd` フラグの判定を `(quadX !== 0 || quadY !== 0)` にしていたため、ディスプレイタイルの x・y が**両方偶数**（qx=0, qy=0 = 親タイルの左上クアドラント）のとき `odd=false` と判定されてしまった。この場合 `scale(2,2)` が適用されず親タイルの全フィーチャーが1:1で描かれ、他クアドラントの河川が混入した
- **解決**: `isOdd` フラグを `floodFetchCoords()` の戻り値で明示的に渡す。qx/qy の値ではなく**ズームが奇数かどうか**で判定する

```javascript
// 誤: var odd = (quadX !== 0 || quadY !== 0);  // qx=qy=0 のとき false になる
// 正: isOdd フラグを明示的に渡す
var odd = !!isOdd;  // ズームが奇数なら必ず true
```

#### ⑨ VectorGrid + setUrl() 方式ではアニメーション中に洪水が更新されない

- **症状**: `L.vectorGrid.protobuf` に `setUrl()` で ymdhms を更新しようとすると、アニメーション中（600ms/フレーム）に洪水が一切更新されなくなった
- **原因1**: `setUrl()` → `redraw()` → `_removeAllTiles()` で全タイルを即座に削除するため、ブランク期間が生じる。毎フレーム呼ぶと常に空白になる
- **原因2**: 上記を避けるため 1400ms デバウンスを設定したが、これが 600ms フレーム間隔より長いため「常に直前のタイマーがリセットされ永遠に発火しない」状態になった
- **解決**: VectorGrid 方式を断念し、canvas GridLayer 方式（⑦）に戻す。canvas はその場で再描画するためタイル除去がなく、50ms デバウンスでもアニメーションに追随できる

#### ⑩ スマホWebアプリでキキクルが点滅・異常終了する

- **症状**: PCブラウザでは正常動作するが、スマホ（Safari/Chrome）でキキクルタブを開くと画面が点いたり消えたりを繰り返して異常終了する
- **原因1**: `kikikuruHtml.ts` の `srcDoc` に 海岸線GeoJSON（403KB） + VectorGrid JS（47KB） ≈ 470KB が埋め込まれており、モバイルブラウザがプロセスメモリ/処理制限でクラッシュ → 自動リロード → またクラッシュ のループになる
- **原因2**: `buildFrames()` で全フレーム（12枚）× 4タイプ = 48 `L.TileLayer` を一括 `addTo(map)` し、同時タイルフェッチが数百件に達して OOM（メモリ不足）
- **解決1**: 海岸線GeoJSON の import を `kikikuruHtml.ts` から削除。国土地理院ベースマップが海岸線を内包するため表示への影響はない。`srcDoc` サイズが 470KB → 約 70KB に削減
- **解決2**: `showFrame()` 内でオンデマンドにレイヤーを生成・`addTo`。現フレーム + 次フレームのみ map で管理（最大8レイヤー固定）し、前フレームのレイヤーは `removeLayer` で解放

### 10-8. タブアイコン（PNG画像方式）

React Native の `View` 組み合わせによるカスタム描画から、Python（PIL）で生成した PNG 画像方式に変更した。

```
assets/images/kikikuru-icon.png  （84×84px RGBA・3x Retina 対応）
```

生成内容:
- グレーの地図背景（角丸10px）
- 黄色の洪水リスクゾーン
- 赤の高危険区域
- 水色の幹川（polygon で斜め）
- 水色の支川（上から合流）

`KikikuruTabIcon.tsx` で `require()` して `<Image>` に渡す。`focused` props で opacity（1.0/0.45）を切り替えることでアクティブ/非アクティブを表現。

### 10-9. 凡例SVGの文字色処理

JMA提供の凡例SVG（`legend_jp_normal_*.svg`）はもともと黒字テキストで構成されている。
背景が暗い（黒・紫・赤）箇所では黒字が見えないため、SVG取得後にJavaScriptでテキスト色を変換している。

```javascript
wrap.querySelectorAll('text').forEach(function(t){
  var content = (t.textContent || '').trim();
  var f = t.getAttribute('fill');
  // 黄・白背景上の「危険度」「低」は黒字のまま
  var isDark = (content === '低' ||
                content === '危険度' ||
                content === '危' || content === '険' || content === '度');
  if(isDark){
    t.setAttribute('fill', '#000000');
  } else if(!f || f==='black' || f==='#000' || f==='#000000'){
    t.setAttribute('fill', 'white');  // それ以外は白字に変換
  }
});
```

| テキスト | 背景色 | 文字色 |
|---------|--------|--------|
| 高 | 暗い紺 | 白 |
| 危険度（各文字） | 黒〜黄のグラデーション | **黒**（黄・白部分で視認性確保） |
| 低 | 黄・白 | **黒** |
| その他ラベル | 黒・紫・赤 | 白 |

### 10-10. アメダス観測値オーバーレイ

レーダー・衛星ビューアに、気象庁アメダスの観測値をリアルタイム重ね合わせする機能。  
起動時デフォルトON（矢羽モード）。[アメダス]ボタンでON/OFF切替、セレクトで種別切替。

#### 対応観測種別（12種）

| セレクト値 | 表示名 | データフィールド | 単位 |
|-----------|--------|----------------|------|
| `wind` | 矢羽（風） | `wind` + `windDirection` | m/s |
| `temp` | 気温 | `temp` | ℃ |
| `dewPoint` | 露点温度 | `temp` + `humidity`（計算値） | ℃ |
| `humidity` | 湿度 | `humidity` | % |
| `normalPressure` | 気圧 | `normalPressure` | hPa |
| `precipitation10m` | 10分雨量 | `precipitation10m` | mm |
| `precipitation1h` | 1h雨量 | `precipitation1h` | mm |
| `precipitation3h` | 3h雨量 | `precipitation3h` | mm |
| `precipitation24h` | 24h雨量 | `precipitation24h` | mm |
| `snow1h` | 1h降雪 | `snow1h` | cm |
| `snow6h` | 6h降雪 | `snow6h` | cm |
| `snow24h` | 24h降雪 | `snow24h` | cm |

露点温度は `humidity` が無い局では計算できないため非表示。Magnus近似式を使用:
```javascript
var g = Math.log(rh/100) + 17.62*t / (243.12+t);
dewPoint = 243.12*g / (17.62-g);
```

#### カラースケール

| スケール名 | 用途 | 閾値 |
|-----------|------|------|
| `wind` | 風速 | 0/5/10/15/20/25 m/s |
| `temp` | 気温・露点温度 | -50/-5/0/5/10/15/20/25/30/35 ℃ |
| `precip_10m` | 10分雨量 | 0/1/3/5/10/15/20/30 mm |
| `precip_1h` | 1h雨量 | 0/1/5/10/20/30/50/80 mm |
| `precip_3h` | 3h雨量 | 0/20/40/60/80/100/120/150 mm |
| `precip_24h` | 24h雨量 | 0/50/80/100/150/200/250/300 mm |
| `humidity` | 湿度 | 0/10/20…100 %（乾燥=赤茶〜多湿=濃青） |
| `pressure` | 気圧 | 800/988/992…1024 hPa（低圧=赤茶〜高圧=濃青） |
| `snow` | 降雪量 | 0/1/5/10/15/20/30/50 cm |

#### 縁取り色ルール

地図が暗背景のため、塗りつぶし色に応じて縁取り色を切り替える:

```javascript
var BLUE_FILL = {
  'rgb(0,32,128)':1, 'rgb(0,65,255)':1, 'rgb(0,150,255)':1,
  'rgb(33,140,255)':1, 'rgb(0,114,154)':1, 'rgb(0,75,150)':1, 'rgb(1,31,125)':1
};
function outlineColor(c){ return BLUE_FILL[c] ? '#fff' : '#000'; }
```

- 青系（暗背景に溶ける色）→ 白縁取り
- 黄・橙・赤・紫・白系 → 黒縁取り（暗背景でも明瞭）

矢羽SVGのstrokeにも同じルールを適用（`arrowStroke`）。

#### 時刻同期

アメダスデータURLは JST 10分丸めのタイムスタンプを使う。衛星タイルURLは UTC なので変換が必要:

```javascript
function fmtJst(d){
  var t = d.getTime() + 9*3600*1000;   // UTC → JST
  t = t - (t % (10*60*1000));           // 10分丸め
  var j = new Date(t);
  return '' + j.getUTCFullYear() + pad2(...) + '00';
}
```

アニメーション中は `lastAmedasJst` で前回フレームのJSTバケットを記録し、バケットが変わった時のみ50msデバウンスで再取得（同一バケットの連続フレームはスキップ）。

#### ズームに応じた間引き

観測局が密集しすぎるズームアウト時は格子セルで間引く:

```javascript
var THIN = {6: 1.0, 7: 0.5, 8: 0.2};  // 度単位のグリッド幅
```

間引き時は **2パス方式** で `humidity` 観測局を優先:
1. 全局をスキャンし、各セル内の humidity 観測局を `cellBest` に登録（非humidity局が先にあっても上書き）
2. `cellBest` から `selectedCodes` セットを作成
3. メインループで `selectedCodes` に含まれる局のみ描画

これにより、露点温度表示時に間引き後の密度が最大になる（露点 = temp + humidity の計算値のため）。

| ズーム | グリッド幅 | 目安間隔 |
|--------|-----------|---------|
| 6 | 1.0° | 約110km に1点 |
| 7 | 0.5° | 約55km に1点 |
| 8 | 0.2° | 約22km に1点 |
| 9以上 | なし | 全点表示 |

#### キャッシュ

取得済みデータは `amedasDataCache` オブジェクトに最大30タイムスタンプ分キャッシュ（`AMEDAS_CACHE_MAX=30`）。観測局リスト（`amedastable.json`）は初回1回のみ取得し `amedasStations` に保持。

---

## 11. JMA API 構造メモ

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

## 12. GitHub Pages デプロイ手順

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

## 13. 改修履歴

### 2026-06 タブアイコン刷新・webタブバー修正

#### 全タブ共通

| 改修 | 内容 |
|------|------|
| アイコンサイズ縮小 | 全タブのアイコンを28px → 24pxに縮小 |
| webタブバー高さ修正 | webのみ `tabBarStyle: { height: 60, paddingBottom: 8 }` を適用し、ラベルが画面外に切れる問題を修正（`Platform.OS === 'web'` 条件分岐でiOSには影響なし） |
| 天気予報アイコン変更 | `house.fill`（家） → `cloud.sun.fill`（太陽+雲）。web版は `icon-symbol.tsx` に `'cloud.sun.fill': 'wb-sunny'` マッピングを追加 |
| キキクルアイコン変更 | 道路マップ風PNG → 川の流れ図PNG（S字本流・2支流・流向矢印）に再生成（Python/PIL、4x超解像→84pxリサイズ） |

---

### 2026-06 アメダスオーバーレイ追加・拡張

#### レーダー・衛星タブ

| 改修 | 内容 |
|------|------|
| アメダスオーバーレイ実装 | `radarHtml.ts` にアメダス重ね合わせ機能を追加。[アメダス]ボタンでON/OFF、セレクトで12種類の観測要素を切替可能 |
| 対応種別（12種） | 矢羽（風）・気温・露点温度・湿度・気圧・10分/1h/3h/24h雨量・1h/6h/24h降雪 |
| 露点温度 | JMA APIに直接フィールドなし → temp + humidity から Magnus 近似式で計算 |
| 縁取り色の色依存化 | 青系の塗りつぶし色 → 白縁取り、それ以外 → 黒縁取り（暗背景での視認性向上） |
| マーカーサイズ拡大 | 矢羽 14×22px → 18×28px、テキスト 11px → 13px に統一 |
| デフォルトON | `amedasOn=true` に変更、起動時にボタンをアクティブ化 |
| ズーム間引き | ズーム6〜8でグリッド間引き（1.0°/0.5°/0.2°）。humidity観測局を優先して残す2パス方式 |
| 時刻同期 | `lastAmedasJst` でJST10分バケット変化時のみ再取得（アニメーション中の過剰リクエスト防止） |

### 2026-06 キキクルビューアタブ追加

#### キキクルタブ（新規）

| 改修 | 内容 |
|------|------|
| タブ新規追加 | `kikikuru.tsx / kikikuru.native.tsx / kikikuruHtml.ts` を作成。`_layout.tsx` に3枚目タブとして登録 |
| 大雨・土砂・浸水・洪水レイヤー | JMAキキクルの4種レイヤー（rain_mesh/land/inund/flood）を個別トグル |
| 浸水+洪水同時モード | 1ボタンで浸水・洪水を同時ON/OFFする `inundFloodMode` 実装 |
| 洪水2層構造 | 静的PNG（全河川背景）＋動的PBF（危険度色）の2層構造を実装（JMA公式ビューアと同方式） |
| ベースマップ変更 | CartoDB暗色 → 国土地理院淡色地図（opacity 3段階切替: 地図暗/地図中/地図明） |
| 時間範囲選択 | 1時間/2時間（デフォルト）/3時間 切替 |
| 過去データ再生 | ◀6h/◀1h/1h▶/▶現在 ボタンで過去キキクル閲覧 |
| レーダー重ね合わせ | キキクル画像に降水レーダーを重ねるオプション |
| 位置記憶 | localStorage（`kikikuruState` キー）で最後の地図位置を保存・復元 |
| タブアイコン変更 | View描画 → 地図風PNG画像（`assets/images/kikikuru-icon.png`・84×84px・Python生成）に切り替え |
| 凡例文字色修正 | JMA SVG凡例の「危険度」「低」を黒字固定（黄・白背景での視認性向上）、「高」他は白字 |
| 洪水PBFフレーム同期修正 | `showFrame()` 内で `scheduleFloodToFrame(ymdhms)` を呼ぶよう変更。アニメーションフレームと洪水危険度色が一致しなかった問題を修正（400msデバウンス付き） |

#### 全タブ共通

| 改修 | 内容 |
|------|------|
| Homeタブのラベル変更 | "Home" → "天気予報"（`_layout.tsx` の `title` プロパティ変更） |

### 2026-06 コントロールボタン横一列レイアウト変更

#### レーダー+衛星タブ・キキクルタブ共通（radarHtml.ts / kikikuruHtml.ts）

| 改修 | 内容 |
|------|------|
| ボタン横一列化 | コントロール領域のボタンを縦複数行 → 横1行（PC幅）に変更。スマホ幅では自動折り返しで複数行になる |
| CSS変更（2行のみ） | `#controls` を `flex-direction:column` → `flex-direction:row; flex-wrap:wrap; align-items:center` に変更。`.ctrl-row` を `display:contents` にして行ラッパーを透明化 |
| 地図の縦スペース最大化 | ボタン行が1行に収まることで上部コントロール領域の高さが削減され、地図表示領域が広がる |

**技術メモ**: `display:contents` はブラウザのフレックスレイアウト上でラッパー要素を「透明」にする。`ctrl-row` の子要素が直接 `#controls` フレックスコンテナに参加するため、HTML構造を変えずにレイアウトを変更できる。

---

### 2026-06 スマホWebアプリ異常終了修正

#### キキクルタブ（Web版・スマホ）

| 改修 | 内容 |
|------|------|
| coastline GeoJSON除去 | `kikikuruHtml.ts` の海岸線GeoJSON（403KB）を `srcDoc` 埋め込みから削除。国土地理院ベースマップが海岸線を内包するため表示上の影響なし。`srcDoc` サイズが 470KB → 約70KB に削減 |
| タイルレイヤーのオンデマンド管理 | 全フレーム（12枚）×4タイプ=48レイヤーを一括 `addTo(map)` → 現フレーム+次フレームのみ管理に変更。同時フェッチ数を最大768タイル→128タイル（1/6）に削減 |
| プリロード対象を縮小 | 再生開始まで「全フレーム完了」待ちだったのを「現フレーム4レイヤー完了」待ちに変更 |
| `showFrame` にオンデマンド生成を実装 | フレーム切替時に現フレームのレイヤーを生成・表示し、前フレームのレイヤーをmap除去。次フレームをopacity=0で先読み（スムーズ再生を維持） |

**症状と原因**:

```
症状: スマホ(Safari/Chrome)でキキクルタブを開くと
      画面が点いたり消えたりを繰り返して異常終了する
      （PCブラウザでは問題なし）

原因:
  ① 470KBのHTML文字列がiframeのsrcDocに渡され
     モバイルブラウザのプロセスメモリ/処理制限に抵触
  ② 48レイヤーが同時にaddTo→数百のPNGを並行フェッチ
     → OOM(メモリ不足)でブラウザタブがクラッシュ
     → 自動リロード → またクラッシュ → ループ
```

### 2026-06 キキクル透過色・高解像度対応

#### キキクルタブ（大雨・土砂・浸水レイヤー）

| 改修 | 内容 |
|------|------|
| PNG 3レイヤーをCanvas GridLayer方式に変更 | 大雨（rain_mesh）・土砂（land）・浸水（inund）をラスタータイルからcanvas GridLayer方式に統一。高解像度（ズーム11以上）でも表示されるよう改善 |
| `calcFetchCoords` 共通関数を実装 | rain_mesh・land・inund・flood全4レイヤーで使用する親タイル座標変換関数を統一実装。奇数ズーム→z-1偶数丸め、nativeMax上限（z=10）適用、scale/quadX/quadY算出を1関数に集約 |
| `mix-blend-mode: multiply` で白背景透過 | canvas個別への設定ではLeaflet paneがstacking contextを作るため地図と合成されない問題に対処。`map.getPane('rainPane').style.mixBlendMode = 'multiply'` のように**paneレベル**で設定することで、気象庁タイルの白背景（非データ領域）が透過し下の地図が見えるよう改善 |
| `getImageData` 廃止 | 従来の白ピクセル除去処理（`getImageData` → pixel操作）はiframe `about:srcdoc`環境のCORS制限（SecurityError）で無効だったため完全廃止。`mix-blend-mode`方式に一本化 |
| 404タイルのキャッシュ化 | 気象庁タイルは危険度のある地域のみ存在するため404は正常。`cache[url] = false`で404確認済みタイルをキャッシュし、毎フレームの無駄なリクエストを防止 |

**技術メモ（透過の仕組み）**:

`mix-blend-mode: multiply` では白（1,1,1）× 地図色 = 地図色となり白背景が消える。Leaflet paneは CSS `transform` により独立した stacking context を持つため、canvas個別ではなくpane要素に設定しないと地図とのブレンドが効かない。

---

### 2026-06 洪水キキクルズームバグ修正

#### キキクルタブ（洪水レイヤー）

| 改修 | 内容 |
|------|------|
| 奇数ズーム交互消え修正 | JMA洪水PBFタイルが偶数ズームのみ存在する仕様に対応。奇数ズームでは z-1 の親タイル座標 `(floor(x/2), floor(y/2))` でPBFを取得し、canvas `scale(2,2)` + `translate` で正しいクアドラントを切り出して描画するよう変更 |
| 奇数ズーム他クアドラント混入修正 | クアドラント判定を `(qx≠0 or qy≠0)` から `isOdd` フラグに変更。左上クアドラント（qx=0,qy=0）でも必ず scale(2,2) を適用し、他エリアの河川線が混入しないよう修正 |
| アニメーション中の洪水更新回復 | `L.vectorGrid.protobuf` + `setUrl()` 方式では 1400ms デバウンスが 600ms フレーム間隔より長く更新が止まる問題が判明。canvas GridLayer 方式（その場再描画）に戻し、デバウンスを 50ms 固定に変更 |
| PBFキャッシュ実装 | `floodPbfCache[url]` で取得済みPBFをメモリキャッシュ。同一フレームへの戻り操作・ズーム変化で即時再描画可能 |
| `done` コールバックによるズーム保持 | `createTile(coords, done)` の `done` 呼び出しで Leaflet の `_retainParent` 機構を有効化。新ズームのタイル読み込み中は旧ズームのタイルが保持され、ブランク期間を低減 |
| 既知の制限 | 奇数ズームでは `scale(2,2)` の影響で線幅が約半分になる（今後の検討課題） |

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

*最終更新: 2026-06-17（キキクル透過色・高解像度対応・洪水ズームバグ修正・スマホ異常終了修正・レーダーprobe修正 他）*
