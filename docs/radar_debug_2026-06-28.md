# レーダー・衛星画面 デバッグ記録（2026-06-28）

## 発端

iPhone の Expo Go / ブラウザでレーダー・衛星画面がブラックアウトする問題が発生。

---

## 原因と対策の全記録

### 問題①：iPhone でブラックアウト（最初の問題）

**症状**  
iOS WKWebView（Expo Go・Safari WebView）でレーダー画面を開くと真っ黒になる。

**原因**  
`assets/html/coastlineData.ts` に海岸線GeoJSONを base64 文字列として埋め込んでいた（約660KB）。これを HTML 文字列として WKWebView に渡すと、ファイルサイズが大きすぎてクラッシュしていた。

**解決策**  
海岸線データを GitHub Raw から `fetch()` で動的取得する方式に変更。`coastlineData.ts` は削除。

```javascript
(function(){
  var REPO = 'https://raw.githubusercontent.com/masauehr/iphone-weather-app/main/assets/geodata/';
  function addCoast(url, style){
    fetch(url).then(r => r.json())
      .then(data => L.geoJSON(data, {pane:'coastPane', style}).addTo(map))
      .catch(() => {});
  }
  addCoast(REPO + 'world_coastline.json', {color:'#00cc44', weight:0.8, opacity:0.72, fill:false});
  addCoast(REPO + 'japan_coastline.json', {color:'#00cc44', weight:1.2, opacity:0.85, fill:false});
})();
```

**関連コミット**  
- `ca0fd3a` fix: 海岸線fetch方式
- `5552789` feat: 海岸線データ世界版追加

---

### 問題②：全球モード切替でブラックアウト

**症状**  
「全球」ボタンを押すとブラックアウトする。

**原因**  
全球モードでも12フレーム×2（衛星+レーダー）= 24レイヤーを一度に起動するため、メモリを超過。

**解決策**  
全球モード（FD）のフレーム数を 12→6 に削減、`keepBuffer` を 6→1 に変更。

**関連コミット**  
- `0b48725` fix: 全球フレーム数削減

---

### 問題③：ズームアウトでクラッシュ

**症状**  
地図をピンチアウトで縮小すると WKWebView がクラッシュする。

**試み1（失敗）**: `rebuildRadarLayersAtZoom` に debounce 500ms 追加 → 改善せず  
**試み2（失敗）**: rebuild 廃止 + zoomstart でレイヤー除外 + zoomend 遅延復元 → レーダーが奇数ズームで消えるバグを新たに作り込んでしまった

**対処**  
「アメダスダブルクリック機能を追加する前（`fe1fbe0^`）は問題なかった」との指摘により、`radarHtml.ts` をその時点の状態に巻き戻した。

**関連コミット**  
- `4cd1e58` fix: debounce追加（不十分）
- `a7a4d61` fix: ズームアウトクラッシュ対策（新バグを作り込んだ失敗作）
- `9b20213` revert: radarHtml.tsをfe1fbe0^の状態に戻す

---

### 問題④：Chrome / Firefox（iOS）でのクラッシュ

**症状**  
Safari では問題なく動作するが、Chrome と Firefox（iOS）ではズームアウト時にクラッシュする。

**背景**  
iOS では Safari・Chrome・Firefox のいずれも WebKit エンジンを使用しているが、Safari は WKWebView にアクセスできるメモリ上限が高い（≈300〜400MB）のに対し、Chrome・Firefox は制限が低い（≈150MB）。24レイヤーを同時に保持するとメモリを超過する。

**試み：keepBuffer 削減**  
`keepBuffer: 6 → 2` に変更してメモリ削減を試みた。Chrome/Firefox はまだクラッシュ。

**関連コミット**  
- `db8de81` fix: keepBuffer 6→2に削減

---

### 問題⑤：URL swap 方式でアニメーションがチラチラ（失敗）

**アプローチ**  
24レイヤー方式のメモリ問題を解消するため、衛星1枚＋レーダー1枚の計2レイヤーだけを持ち、フレーム切替時に `TileLayer.setUrl()` でURLを差し替える「URL swap方式」を実装。

**結果**  
メモリは削減できたが、`setUrl()` のたびに一瞬タイルが消えてチラチラし、アニメーションとして使い物にならなかった。

**対処**  
`db8de81`（fetch海岸線 + keepBuffer:2 + 元の24レイヤー方式）に戻した。

**関連コミット**  
- `34db0e2` fix: 衛星・レーダーをURL swap方式に変更（← 失敗）
- `9b5e1a6` revert: URL swap方式を取りやめ、元の24レイヤー方式に戻す

---

## 最終的な結論

| ブラウザ | 結果 |
|---------|------|
| PC（Chrome/Firefox/Safari） | ✅ 正常動作 |
| iPhone Safari | ✅ 正常動作（ズームも問題なし） |
| iPhone Chrome | ✅ 最終的に正常動作 |
| iPhone Firefox | ✅ 最終的に正常動作 |

**安定版の状態（コミット `9b5e1a6`）**  
- 衛星レイヤー12枚 + レーダーレイヤー12枚 = 24レイヤー同時保持
- `keepBuffer: 2`
- 海岸線は GitHub Raw から fetch 方式で動的取得
- `coastlineData.ts`（base64埋め込み660KB）は削除済み

---

## 教訓

1. **WebView に渡す HTML 文字列はできるだけ小さくする**  
   大きなデータ（GeoJSON等）は base64 埋め込みではなく、外部 URL から fetch して取得する。

2. **URL swap（`setUrl()`）はアニメーション用途に向かない**  
   Leaflet の `setUrl()` はタイルを一旦クリアして再取得するため、フレームの切替でちらつきが生じる。スムーズなアニメーションには複数レイヤーを事前ロードしてから表示切替する方式が必要。

3. **iOS ブラウザのメモリ上限の違い**  
   - Safari: ≈ 300〜400MB（WKWebView 上限が高い）
   - Chrome・Firefox: ≈ 150MB（同じ WebKit でも制限が低い）
   - メモリ消費を抑えるには `keepBuffer` を下げるか、フレーム数を減らす。

4. **巻き戻しは `git checkout <hash> -- <file>` が手軽**  
   1ファイルだけを特定コミット時点の状態に戻すのに有効。

---

## 関連ファイル

- [assets/html/radarHtml.ts](../assets/html/radarHtml.ts) — メインの地図HTML（最も変更が多いファイル）
- [app/(tabs)/radar.tsx](../app/(tabs)/radar.tsx) — Web版（`<iframe srcDoc>`）
- [app/(tabs)/radar.native.tsx](../app/(tabs)/radar.native.tsx) — iOS版（`react-native-webview`）
- [assets/geodata/japan_coastline.json](../assets/geodata/japan_coastline.json) — 日本高精度海岸線
- [assets/geodata/world_coastline.json](../assets/geodata/world_coastline.json) — 世界海岸線
