# iPhone天気予報アプリ

React Native + Expo で作成したiPhone向け気象アプリ。
気象庁API（JMA）からリアルタイムデータを取得して予報・レーダー・キキクル危険度を表示する。

- **公開URL（Web版）**: https://masauehr.github.io/iphone-weather-app/
- **GitHubリポジトリ**: https://github.com/masauehr/iphone-weather-app
- **対応地域**: 全47都道府県（class10s サブ地域対応）

詳しい技術仕様・開発手順は [MANUAL.md](MANUAL.md) を参照。

---

## 機能一覧

### 天気予報タブ
| 機能 | 内容 |
|------|------|
| 短期予報 | 今日〜明後日（3日間）の天気・降水確率・最高/最低気温 |
| 週間予報 | 7日間の天気・降水確率・最高/最低気温・信頼度 |
| お気に入り | 3地点まで登録・長押し編集・タップで即切替 |
| 最終地点記憶 | アプリ再起動後も最後に選んだ地点を自動復元 |
| 地域選択 | 全47都道府県モーダル（10セクション58地点） |
| サブ地域 | 沖縄本島→本島中南部/北部/久米島 等を自動切替バー表示 |
| 天気絵文字 | 「のち→」「時々//」「一時/」の区切り付き複合表示 |
| 更新ボタン | 右上の🔄ボタンで最新データを再取得 |

### レーダー・衛星タブ
| 機能 | 内容 |
|------|------|
| 降水レーダー | 気象庁ナウキャスト（5分間隔） |
| 衛星画像 | ひまわり9号（可視 / 赤外） |
| アニメーション時間 | 1時間 / **2時間（デフォルト）** / 3時間 |
| 過去データ再生 | [◀5h][◀1h][1h▶][▶現在] で最大5時間前まで遡って再生 |
| 自動更新 | 5分ごと自動更新（過去モード中は停止） |
| 凡例表示 | [凡例]ボタンで降水強度カラースケールをオン/オフ |
| インタラクティブマップ | ピンチズーム・ドラッグ対応（Leaflet） |
| アメダス重ね合わせ | 矢羽（風）・気温・露点温度・湿度・気圧・雨量・降雪量を地図に重ねて表示（12種・起動時ON） |
| アメダス間引き | ズームアウト時はグリッドで自動間引き（humidity観測局を優先して残す） |

### キキクルタブ
| 機能 | 内容 |
|------|------|
| 大雨キキクル | 大雨による危険度を格子状に色表示（rain_mesh） |
| 土砂キキクル | 土砂災害の危険度マップ（land） |
| 浸水キキクル | 短時間強雨による浸水危険度（inund） |
| 洪水キキクル | 河川の洪水危険度（PBFベクター＋静的PNG 2層構造） |
| 浸水+洪水同時切替 | 1ボタンで浸水・洪水を同時ON/OFF |
| レーダー重ね合わせ | 降水レーダーをキキクル上に重ねて表示 |
| アニメーション時間 | 1時間 / **2時間（デフォルト）** / 3時間 |
| 過去データ再生 | [◀6h][◀1h][1h▶][▶現在] で過去の危険度履歴を参照 |
| ベースマップ明度 | 地図暗 / 地図中 / 地図明 の3段階切替（国土地理院淡色地図） |
| 位置記憶 | 最後の地図位置・ズームを自動復元 |

---

## 起動方法

### iPhone実機確認（Expo Go）
```bash
cd ~/projects/mobile_app
npx expo start
```
- iPhoneの「Expo Go」アプリ → Projectsタブに自動表示
- MacとiPhoneが**同じWi-Fi**に接続している必要あり
- 変更が反映されない場合: `npx expo start --clear` → Expo Goを完全終了 → 再接続

### Web版ローカル確認
```bash
npx expo start --web
```

### Web版デプロイ（GitHub Pages）
```bash
npm run deploy
```
→ ビルド（`npx expo export -p web`）→ gh-pagesブランチに直接push → 公開URL更新

---

## ファイル構成

```
app/
└── (tabs)/
    ├── index.tsx            ← 天気予報メイン画面
    ├── radar.tsx            ← レーダー画面（Web版・iframe）
    ├── radar.native.tsx     ← レーダー画面（iPhone版・WebView）
    ├── kikikuru.tsx         ← キキクル画面（Web版・iframe）
    └── kikikuru.native.tsx  ← キキクル画面（iPhone版・WebView）
assets/
├── html/
│   ├── radarHtml.ts         ← レーダー/衛星ビューアHTML（Leaflet組み込み）
│   └── kikikuruHtml.ts      ← キキクルビューアHTML（Leaflet組み込み）
└── images/
    └── kikikuru-icon.png    ← キキクルタブアイコン（84×84px・Python生成）
CLAUDE.md                  ← Claude Code用プロジェクト説明
MANUAL.md                  ← 技術マニュアル（本ファイルからリンク）
deploy.js                  ← GitHub Pagesデプロイスクリプト（カスタム）
```

---

## 技術スタック

| 項目 | 内容 |
|------|------|
| フレームワーク | React Native（Expo SDK 54） |
| 言語 | TypeScript |
| ルーティング | expo-router（ファイルベース） |
| 永続化 | @react-native-async-storage/async-storage |
| マップ | Leaflet 1.9.4（WebView/iframe内） |
| データソース | 気象庁API（JMA） |
| Web公開 | GitHub Pages |

---

## 今後の拡張候補

- プッシュ通知（警報・注意報）
- 週間予報の天気テキスト表示
- お気に入り地点の保存件数拡張
- App Store正式公開（Apple Developer登録 年$99）
