import japanCoastline from '@/assets/geodata/japan_coastline.json';

const _coastlineJson = JSON.stringify(japanCoastline);

export const kikikuruHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no,minimum-scale=1,maximum-scale=1"/>
<title>キキクル</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{display:flex;flex-direction:column;height:100vh;height:100dvh;background:#1a1a2e;color:#e0e0e0;font-family:sans-serif;font-size:12px}
#header{padding:4px 8px;background:#0f3460;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
#header .title{font-weight:bold;font-size:13px}
#timeDisp{font-size:11px;color:#90caf9}
#controls{padding:4px 6px;background:#16213e;flex-shrink:0;display:flex;flex-direction:column;gap:4px}
.ctrl-row{display:flex;align-items:center;gap:4px;flex-wrap:wrap}
button{padding:4px 8px;border:1px solid #4a90e2;background:#1a3a5c;color:#e0e0e0;border-radius:4px;font-size:11px;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
button.active{background:#4a90e2;color:#fff;border-color:#4a90e2}
button.act-rain{background:#9933cc;border-color:#cc55ff;color:#fff}
button.act-land{background:#cc3300;border-color:#ff5533;color:#fff}
button.act-inund{background:#0066bb;border-color:#0099ff;color:#fff}
button.act-flood{background:#337722;border-color:#55aa33;color:#fff}
button.act-radar{background:#226644;border-color:#33aa66;color:#fff}
.sep{color:#555;font-size:10px}
#map{flex:1;background:#000;touch-action:none}
#bottom{padding:4px 6px;background:#0f3460;flex-shrink:0}
#sliderRow{display:flex;align-items:center;gap:6px;margin-bottom:3px}
#frameSlider{flex:1;accent-color:#4a90e2;height:24px;cursor:pointer}
#frameLabel{font-size:10px;white-space:nowrap;color:#90caf9;min-width:36px;text-align:right}
#loadRow{display:flex;align-items:center;gap:6px;height:14px}
.load-bar{flex:1;height:4px;background:#333;border-radius:2px;overflow:hidden}
.load-bar-fill{height:100%;background:#4a90e2;transition:width 0.2s;width:0%}
#loadStatus{font-size:10px;color:#aaa;min-width:120px}
#legendPanel{position:fixed;bottom:64px;left:6px;z-index:900;background:rgba(10,30,60,0.95);border:1px solid #4a90e2;border-radius:8px;padding:6px 8px;display:none;max-width:240px}
.leg-hdr{font-size:11px;font-weight:bold;color:#90caf9;display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}
.leg-img{width:224px;height:auto;display:block}
</style>
</head>
<body>

<div id="header">
  <span class="title">⚠️ キキクル</span>
  <span id="timeDisp">-</span>
</div>

<div id="controls">
  <div class="ctrl-row">
    <button id="btnRain"       class="act-rain" onclick="toggleLayer('rain_mesh')">大雨</button>
    <button id="btnLand"                        onclick="toggleLayer('land')">土砂</button>
    <button id="btnInund"                       onclick="toggleLayer('inund')">浸水</button>
    <button id="btnFlood"                       onclick="toggleLayer('flood')">洪水</button>
    <button id="btnInundFlood"                  onclick="toggleInundFlood()">浸水+洪水</button>
    <span class="sep">|</span>
    <button id="btnRadar"                       onclick="toggleLayer('radar')">雨雲</button>
    <span class="sep">|</span>
    <button id="btnBaseMap"                     onclick="toggleBaseMap()">地図中</button>
    <select id="speedSel" onchange="onSpeedChange(this.value)" style="padding:3px 4px;border:1px solid #4a90e2;background:#1a3a5c;color:#e0e0e0;border-radius:4px;font-size:11px">
      <option value="0">遅い</option>
      <option value="1" selected>普通</option>
      <option value="2">速い</option>
    </select>
    <button onclick="onBuild()">更新</button>
    <button id="legendBtn" onclick="toggleLegend()">凡例</button>
  </div>
  <div class="ctrl-row">
    <button id="t1h" onclick="setTimeRange(1)">1時間</button>
    <button id="t2h" class="active" onclick="setTimeRange(2)">2時間</button>
    <button id="t3h" onclick="setTimeRange(3)">3時間</button>
    <span class="sep">|</span>
    <button onclick="stepBack(360)">◀6h</button>
    <button onclick="stepBack(60)">◀1h</button>
    <button id="btnFwd" onclick="stepForward(60)" style="display:none">1h▶</button>
    <button id="btnNow" onclick="goNow()" style="display:none;background:#c62828;border-color:#e53935">▶現在</button>
    <span id="histLabel" style="font-size:10px;color:#ffb74d;margin-left:2px"></span>
  </div>
</div>

<div id="map"></div>

<div id="bottom">
  <div id="sliderRow">
    <button style="padding:4px 10px" onclick="onPlay()">▶</button>
    <button style="padding:4px 10px" onclick="onPause()">⏸</button>
    <input id="frameSlider" type="range" min="0" max="0" value="0" oninput="onSlider(this.value)"/>
    <span id="frameLabel">0/0</span>
  </div>
  <div id="loadRow">
    <span id="loadStatus"></span>
    <div class="load-bar"><div id="loadBarFill" class="load-bar-fill"></div></div>
  </div>
</div>

<div id="legendPanel">
  <div class="leg-hdr">
    <span id="legTitle">凡例</span>
    <button onclick="toggleLegend()" style="padding:0 4px;border:none;background:none;color:#aaa;font-size:13px;cursor:pointer;line-height:1">✕</button>
  </div>
  <div id="legSvgWrap" style="width:224px;overflow:hidden"></div>
</div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet.vectorgrid@latest/dist/Leaflet.VectorGrid.bundled.js"></script>
<script>
(function(){
'use strict';

/* ── 定数 ── */
var LEAD_SEC      = 11 * 60;
var INTERVAL_SEC  = 10 * 60;
var LOAD_TIMEOUT  = 10000;
var SPEEDS        = [1200, 600, 300];
var AUTO_INTERVAL = 10 * 60 * 1000;

/* 時間範囲・過去モード */
var timeRangeHours     = 2;       /* デフォルト2時間 */
var historicalOffsetMin = 0;      /* 0=現在 >0=過去N分遡り */
function isHistoricalMode(){ return historicalOffsetMin > 0; }

/* 洪水キキクルの河川線幅（ズームレベル0〜18対応・kikikuruViewer準拠） */
var FLOOD_LINE_WIDTH = [1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 5, 6, 8, 8, 8, 10, 12, 14, 16];

/* 凡例定義 */
var LEGEND = {
  rain_mesh: { url: 'https://www.jma.go.jp/bosai/risk/images/legend_jp_normal_heavyrain.svg', name: '大雨キキクル' },
  land:      { url: 'https://www.jma.go.jp/bosai/risk/images/legend_jp_normal_land.svg',      name: '土砂キキクル' },
  inund:     { url: 'https://www.jma.go.jp/bosai/risk/images/legend_jp_normal_inund.svg',     name: '浸水キキクル' },
  flood:     { url: 'https://www.jma.go.jp/bosai/risk/images/legend_jp_normal_flood.svg',     name: '洪水キキクル' }
};

/* ── ユーティリティ ── */
function pad2(n){ return n<10?'0'+n:''+n; }
function fmtUtc(d){
  return ''+d.getUTCFullYear()+pad2(d.getUTCMonth()+1)+pad2(d.getUTCDate())+
    pad2(d.getUTCHours())+pad2(d.getUTCMinutes())+pad2(d.getUTCSeconds());
}
function fmtLocal(d){
  return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate())+' '+
    pad2(d.getHours())+':'+pad2(d.getMinutes())+' JST';
}
function getBaseTime(leadSec, intervalSec){
  /* 過去モード時は historicalOffsetMin 分だけ遡ったベース時刻を返す */
  var t = Date.now() - (isHistoricalMode() ? historicalOffsetMin*60000 : leadSec*1000);
  t = t - (t % (intervalSec*1000));
  var d = new Date(t);
  return new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),
    d.getUTCHours(),d.getUTCMinutes(),d.getUTCSeconds()));
}

/* ── Leaflet地図 ── */
var map = L.map('map',{
  zoomControl:true, scrollWheelZoom:true,
  fadeAnimation:false, zoomAnimation:false, tap:false
}).setView([35.5,137.0],6);
map.setMinZoom(4); map.setMaxZoom(14);

/* 国土地理院淡色地図 — 背景が暗いので透明度で明暗を調整 */
var BASE_CHIRIIN = 'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png';
var BASE_OPACITIES = [0.2, 0.55, 0.9];
var BASE_LABELS    = ['地図暗', '地図中', '地図明'];
var baseOpacityIdx = 1;
var baseLayer = L.tileLayer(BASE_CHIRIIN,{
  maxZoom:18, opacity:BASE_OPACITIES[baseOpacityIdx],
  attribution:'© 国土地理院'
}).addTo(map);

/* ペイン定義（大雨→土砂→浸水→洪水→レーダー→海岸線の順）
   Leaflet の tilePane デフォルトは z=200 なので、全てそれより大きい値にする */
map.createPane('rainPane');      map.getPane('rainPane').style.zIndex      = 201;
map.createPane('landPane');      map.getPane('landPane').style.zIndex      = 202;
map.createPane('inundPane');     map.getPane('inundPane').style.zIndex     = 203;
map.createPane('floodBasePane'); map.getPane('floodBasePane').style.zIndex = 204; /* 静的河川PNG（常時） */
map.createPane('floodRiskPane'); map.getPane('floodRiskPane').style.zIndex = 205; /* 危険度PBF（洪水ON時） */
map.createPane('radarPane');     map.getPane('radarPane').style.zIndex     = 350;
map.createPane('coastPane');     map.getPane('coastPane').style.zIndex     = 600;
map.getPane('coastPane').style.pointerEvents = 'none';

/* 海岸線 */
L.geoJSON(${_coastlineJson},{
  pane:'coastPane',
  style:{color:'#00cc44',weight:1.2,opacity:0.85,fill:false}
}).addTo(map);

/* ── 状態 ── */
var frames = [];
/* flood は永続canvasGridLayer で別管理（floodCanvasGrid）*/
var layers = { rain_mesh:[], land:[], inund:[], radar:[] };
var currentIdx = -1;
var timerId = null, playing = false, speedIdx = 1;
var isLoading = false;
var autoTimerId = null;
var latestBaseTime = null;
var _wasPlaying = false;

/* 各レイヤーの表示ON/OFF（初期: 大雨のみON） */
var visible = { rain_mesh:true, land:false, inund:false, flood:false, radar:false };

/* 静的河川PNGタイル（洪水ON時のみ表示）— 全河川を水色で描く */
var riverBaseLayer = L.tileLayer(
  'https://www.jma.go.jp/bosai/jmatile/data/map/none/none/none/surf/flood/{z}/{x}/{y}.png',
  { pane:'floodBasePane', minNativeZoom:4, maxNativeZoom:13,
    minZoom:4, maxZoom:14, opacity:0.85 }
);
/* visible['flood'] に応じて河川タイルを表示/非表示 */
function updateRiverBaseLayer(){
  if(visible['flood']){
    if(!map.hasLayer(riverBaseLayer)) riverBaseLayer.addTo(map);
  } else {
    if(map.hasLayer(riverBaseLayer)) map.removeLayer(riverBaseLayer);
  }
}

/* ── 洪水キキクル危険度: 永続キャンバスGridLayer方式（参考: kikikuruViewer）──
   L.vectorGrid.protobuf を毎回作り直すと tiles 再読込中にブランクが生じる。
   代わりに L.GridLayer + canvas tile を1つ保持し続け、
   ymdhms変更時は既存canvasをその場で再描画（旧データを表示したまま非同期更新）。
   PBFバイナリはメモリキャッシュに保持するため2回目以降のズームは即時描画。 */
var floodPbfCache = {};       /* url → ArrayBuffer */
var floodCurrentYmdhms = null;
var floodCanvasGrid = null;   /* 永続GridLayer（一度だけ生成） */
var floodFrameTimer = null;

/* PBFバイナリをcanvasに描画（Pbf/VectorTileはバンドル内でグローバル露出） */
function drawFloodOnCanvas(canvas, buffer, z){
  try {
    var vt = new VectorTile(new Pbf(new Uint8Array(buffer)));
    var lay = vt.layers['flood'];
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 256, 256);
    if(!lay) return;
    var lw = FLOOD_LINE_WIDTH[Math.min(z, FLOOD_LINE_WIDTH.length-1)] || 4;
    /* 外側（灰色） */
    ctx.lineJoin='round'; ctx.strokeStyle='#333'; ctx.lineWidth=lw;
    for(var i=0; i<lay.length; i++){
      var geom=lay.feature(i).loadGeometry();
      ctx.beginPath();
      for(var j=0;j<geom.length;j++) for(var k=0;k<geom[j].length;k++){
        var p=geom[j][k],x=p.x/4096*256,y=p.y/4096*256;
        if(k) ctx.lineTo(x,y); else ctx.moveTo(x,y);
      }
      ctx.stroke();
    }
    /* 内側（危険度色） */
    for(var i=0; i<lay.length; i++){
      var feat=lay.feature(i), level=feat.properties.level;
      var c='#3cffff';
      if(level==1) c='#f2e700';
      if(level==2) c='#ff2800';
      if(level==3) c='#aa00aa';
      if(level==4) c='#0c000c';
      ctx.strokeStyle=c; ctx.lineWidth=Math.max(1,lw-2);
      var geom=feat.loadGeometry();
      ctx.beginPath();
      for(var j=0;j<geom.length;j++) for(var k=0;k<geom[j].length;k++){
        var p=geom[j][k],x=p.x/4096*256,y=p.y/4096*256;
        if(k) ctx.lineTo(x,y); else ctx.moveTo(x,y);
      }
      ctx.stroke();
    }
  } catch(e){}
}

function floodTileUrl(ymdhms, z, x, y){
  return 'https://www.jma.go.jp/bosai/jmatile/data/risk/'+ymdhms+'/none/'+ymdhms+'/surf/flood/'+z+'/'+x+'/'+y+'.pbf';
}

/* 永続GridLayerを初回のみ生成 */
function initFloodCanvasGrid(){
  if(floodCanvasGrid) return;
  var FloodLayer = L.GridLayer.extend({
    createTile: function(coords){
      var canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 256;
      if(!floodCurrentYmdhms || !visible['flood']) return canvas;
      var url = floodTileUrl(floodCurrentYmdhms, coords.z, coords.x, coords.y);
      var c = canvas, z = coords.z;
      if(floodPbfCache[url]){
        /* キャッシュヒット: 即時描画（ブランクなし） */
        drawFloodOnCanvas(c, floodPbfCache[url], z);
      } else {
        fetch(url).then(function(r){ return r.arrayBuffer(); }).then(function(buf){
          if(buf.byteLength > 0){ floodPbfCache[url]=buf; drawFloodOnCanvas(c,buf,z); }
        }).catch(function(){});
      }
      return canvas;
    }
  });
  floodCanvasGrid = new FloodLayer({
    pane:'floodRiskPane', minZoom:4, maxZoom:14, tileSize:256
  });
}

/* 表示中の全タイルcanvasを新ymdhmsで再描画（レイヤー除去なし → ブランクなし） */
function redrawFloodCanvases(){
  if(!floodCanvasGrid || !floodCurrentYmdhms) return;
  var tiles = floodCanvasGrid._tiles;
  if(!tiles) return;
  for(var key in tiles){
    var tile = tiles[key];
    if(!tile || !tile.el) continue;
    var canvas = tile.el;
    if(typeof canvas.getContext !== 'function') continue;
    var co = tile.coords, z = co.z;
    var url = floodTileUrl(floodCurrentYmdhms, z, co.x, co.y);
    if(floodPbfCache[url]){
      drawFloodOnCanvas(canvas, floodPbfCache[url], z);
    } else {
      (function(c, z2, u){ fetch(u).then(function(r){ return r.arrayBuffer(); }).then(function(buf){
        if(buf.byteLength>0){ floodPbfCache[u]=buf; drawFloodOnCanvas(c,buf,z2); }
      }).catch(function(){}); })(canvas, z, url);
    }
  }
}

function applyFloodToYmdhms(ymdhms){
  clearTimeout(floodFrameTimer); floodFrameTimer = null;
  floodCurrentYmdhms = ymdhms || null;
  if(!visible['flood'] || !ymdhms){
    if(floodCanvasGrid && map.hasLayer(floodCanvasGrid)) map.removeLayer(floodCanvasGrid);
    return;
  }
  initFloodCanvasGrid();
  if(!map.hasLayer(floodCanvasGrid)) floodCanvasGrid.addTo(map);
  /* 既存タイルをその場で再描画（旧ymdhmsの描画を残しながら非同期更新） */
  redrawFloodCanvases();
}
/* アニメーション中は再生成しない（playing中は1400msデバウンス、一時停止中は50ms） */
function scheduleFloodToFrame(ymdhms){
  clearTimeout(floodFrameTimer);
  var delay = playing ? 1400 : 50;
  floodFrameTimer = setTimeout(function(){ applyFloodToYmdhms(ymdhms); }, delay);
}
function updateFloodBaseLayer(){
  var idx = (currentIdx >= 0 && currentIdx < frames.length) ? currentIdx : frames.length - 1;
  applyFloodToYmdhms(frames.length ? frames[idx].ymdhms : null);
}

/* タイプ別設定 */
var PANE    = { rain_mesh:'rainPane', land:'landPane', inund:'inundPane', radar:'radarPane' };
var OPACITY = { rain_mesh:0.8, land:0.8, inund:0.8, radar:0.4 };
/* rain_meshはmaxNativeZoom=11（気象庁仕様）、その他は10 */
var NATIVE_MAX_BASE = { rain_mesh:11, land:10, inund:10, radar:10 };
/* 現在適用中のnativeMax（ズーム変化検知用） */
var currentNativeMax = { rain_mesh:11, land:10, inund:10, radar:10 };

/* 奇数ズーム対策: radarHtml.tsと同じロジック — 奇数ズームは常にz-1（偶数）に丸め、base上限 */
function getEffectiveNativeMax(type){
  var z = map.getZoom();
  var base = NATIVE_MAX_BASE[type];
  var nMax = (z % 2 === 1) ? z - 1 : z;
  if(nMax < 4) nMax = 4;
  if(nMax > base) nMax = base;
  return nMax;
}

/* ── URL ── */
function riskUrl(type, ymdhms){
  return 'https://www.jma.go.jp/bosai/jmatile/data/risk/'+
    ymdhms+'/none/'+ymdhms+'/surf/'+type+'/{z}/{x}/{y}.png';
}
function radarUrl(ymdhms){
  return 'https://www.jma.go.jp/bosai/jmatile/data/nowc/'+
    ymdhms+'/none/'+ymdhms+'/surf/hrpns/{z}/{x}/{y}.png';
}
/* ── 表示位置の保存/復元（localStorage）── */
function saveState(){
  try{
    var c=map.getCenter();
    localStorage.setItem('kikikuruState',JSON.stringify({
      lat:c.lat,lng:c.lng,zoom:map.getZoom()
    }));
  }catch(e){}
}
function loadState(){
  try{
    var s=localStorage.getItem('kikikuruState');
    return s?JSON.parse(s):null;
  }catch(e){return null;}
}

/* ── DOM ── */
var elTime   = document.getElementById('timeDisp');
var elSlider = document.getElementById('frameSlider');
var elLabel  = document.getElementById('frameLabel');
var elFill   = document.getElementById('loadBarFill');
var elStatus = document.getElementById('loadStatus');

function setLoadUI(done,total,msg){
  elFill.style.width = (total>0 ? Math.round(done/total*100) : 0)+'%';
  elStatus.textContent = msg || ('読込中 '+done+'/'+total);
}
function clearLoadUI(){ elFill.style.width='0%'; elStatus.textContent=''; }

/* ── ラスタータイルレイヤー作成（flood 以外）── */
function makeTileLayer(type, ymdhms){
  var url    = (type==='radar') ? radarUrl(ymdhms) : riskUrl(type, ymdhms);
  var pane   = PANE[type];
  var nMax   = getEffectiveNativeMax(type);
  var l = L.tileLayer(url,{
    minNativeZoom:4, maxNativeZoom:nMax,
    minZoom:4, maxZoom:14, opacity:0,
    updateWhenIdle:false, keepBuffer:4, pane:pane
  });
  /* tileload ごとに opacity を再適用（radarHtml.ts と同じパターン） */
  l.on('tileload', function(e){
    if(type==='radar') e.tile.style.imageRendering='pixelated';
    reapplyOpacity();
  });
  l.on('load', function(){ reapplyOpacity(); });
  return l;
}

/* ── クリーンアップ ── */
function cleanup(){
  var types = Object.keys(layers);
  types.forEach(function(t){
    layers[t].forEach(function(l){ if(l) map.removeLayer(l); });
    layers[t] = [];
  });
  /* floodCanvasGridはズームまたぎで再利用するため削除しない */
  if(floodCanvasGrid && map.hasLayer(floodCanvasGrid)) map.removeLayer(floodCanvasGrid);
  floodCurrentYmdhms = null;
  frames=[]; currentIdx=-1;
}

/* ── フレーム表示 ── */
function reapplyOpacity(){
  if(currentIdx<0) return;
  var types = Object.keys(layers);
  types.forEach(function(t){
    var arr = layers[t];
    if(!arr.length) return;
    for(var i=0;i<arr.length;i++){
      if(!arr[i]) continue;
      arr[i].setOpacity( (i===currentIdx && visible[t]) ? OPACITY[t] : 0 );
    }
  });
}

function showFrame(idx){
  if(!frames.length) return;
  idx = ((idx % frames.length) + frames.length) % frames.length;
  currentIdx = idx;
  reapplyOpacity();
  elSlider.value = String(idx);
  elLabel.textContent = (idx+1)+'/'+frames.length;
  elTime.textContent = fmtLocal(frames[idx].time);
  /* flood PBFを表示フレームに同期（400msデバウンスで高速切替を抑制） */
  if(visible['flood']){ scheduleFloodToFrame(frames[idx].ymdhms); }
}

/* ── 再生制御 ── */
function play(){
  if(playing || !frames.length || isLoading) return;
  playing=true;
  (function tick(){
    if(!playing) return;
    showFrame((currentIdx+1) % frames.length);
    timerId = setTimeout(tick, SPEEDS[speedIdx]);
  })();
}
function pause(){ playing=false; clearTimeout(timerId); timerId=null; }

/* ── フレーム構築（probeなし・即時表示）── */
function buildFrames(){
  if(isLoading) return;
  isLoading=true; pause(); cleanup();

  var bt = getBaseTime(LEAD_SEC, INTERVAL_SEC);
  latestBaseTime = bt;

  /* timeRangeHours に応じたフレーム数（10分間隔 × 6本/h）*/
  var frameCount = timeRangeHours * 6;
  var i;
  for(i=frameCount-1; i>=0; i--){
    var t = new Date(bt.getTime() - i*INTERVAL_SEC*1000);
    frames.push({ time:t, ymdhms:fmtUtc(t) });
  }

  var types = Object.keys(layers);
  elSlider.min='0';
  elSlider.max=String(frames.length-1);
  elSlider.value=String(frames.length-1);
  elLabel.textContent=frames.length+'/'+frames.length;

  /* 各タイプの配列を初期化してレイヤーをmap追加（flood は floodCanvasGrid で別管理） */
  types.forEach(function(tp){ layers[tp]=new Array(frames.length).fill(null); });
  frames.forEach(function(f,fi){
    types.forEach(function(tp){
      var l = makeTileLayer(tp, f.ymdhms);
      l.addTo(map);
      layers[tp][fi]=l;
    });
  });

  /* buildFrames完了時点のnativeMaxをcurrentNativeMaxに反映 */
  types.forEach(function(tp){ currentNativeMax[tp] = getEffectiveNativeMax(tp); });

  /* 洪水VectorGrid・河川タイルを更新 */
  updateRiverBaseLayer();
  updateFloodBaseLayer();

  /* currentIdxを確定させてからtileloadでreapplyOpacityが効くようにする */
  isLoading=false;
  showFrame(frames.length-1);
  elStatus.textContent='';

  /* 全フレームのプリロード完了後に再生開始 */
  var total=frames.length*types.length, loaded=0;
  function onLoad(){
    loaded++;
    if(loaded===total){ clearLoadUI(); play(); }
  }
  frames.forEach(function(f,fi){
    types.forEach(function(tp){
      var l=layers[tp][fi], n=false;
      l.on('load', function(){ if(!n){n=true;onLoad();} });
      setTimeout(function(){ if(!n){n=true;onLoad();} }, LOAD_TIMEOUT);
    });
  });
}

/* ── 自動更新（過去モード中は更新しない）── */
function scheduleAuto(){
  clearTimeout(autoTimerId);
  autoTimerId = setTimeout(function(){
    if(!isHistoricalMode()){
      var bt = getBaseTime(LEAD_SEC, INTERVAL_SEC);
      if(!latestBaseTime || bt.getTime()!==latestBaseTime.getTime()) buildFrames();
    }
    scheduleAuto();
  }, AUTO_INTERVAL);
}

/* ── レイヤーON/OFF ── */
var BTN_IDS   = { rain_mesh:'btnRain', land:'btnLand', inund:'btnInund', flood:'btnFlood', radar:'btnRadar' };
var BTN_CLASS = { rain_mesh:'act-rain', land:'act-land', inund:'act-inund', flood:'act-flood', radar:'act-radar' };

window.toggleLayer = function(type){
  visible[type] = !visible[type];
  var btn = document.getElementById(BTN_IDS[type]);
  btn.className = visible[type] ? BTN_CLASS[type] : '';
  if(type === 'flood'){
    updateRiverBaseLayer();
    updateFloodBaseLayer();
  } else if(currentIdx>=0 && layers[type] && layers[type][currentIdx]){
    layers[type][currentIdx].setOpacity( visible[type] ? OPACITY[type] : 0 );
  }
  updateLegendType();
};

/* ── 凡例 ── */
var legendShown=false;
var legendType='rain_mesh';

function updateLegendType(){
  var order=['rain_mesh','land','inund','flood'];
  for(var i=0;i<order.length;i++){
    if(visible[order[i]] && LEGEND[order[i]]){
      legendType=order[i];
      if(legendShown) applyLegend(legendType);
      return;
    }
  }
}
function applyLegend(type){
  if(!LEGEND[type]) return;
  document.getElementById('legTitle').textContent = LEGEND[type].name;
  /* SVGをfetchしてDOM挿入し、黒テキストを白に変換 */
  fetch(LEGEND[type].url)
    .then(function(r){ return r.text(); })
    .then(function(svgText){
      var wrap = document.getElementById('legSvgWrap');
      wrap.innerHTML = svgText;
      var svg = wrap.querySelector('svg');
      if(svg){ svg.style.width='224px'; svg.style.height='auto'; }
      /* 危険度・低は黒（黄・白背景のため）、それ以外は白に変換 */
      wrap.querySelectorAll('text').forEach(function(t){
        var content = (t.textContent || '').trim();
        var f = t.getAttribute('fill');
        var isDark = (content === '低' ||
                      content === '危険度' ||
                      content === '危' || content === '険' || content === '度');
        if(isDark){
          t.setAttribute('fill','#000000');
        } else if(!f || f==='black' || f==='#000' || f==='#000000'){
          t.setAttribute('fill','white');
        }
      });
    })
    .catch(function(){
      /* fetch失敗時はimgにフォールバック */
      document.getElementById('legSvgWrap').innerHTML =
        '<img src="'+LEGEND[type].url+'" style="width:224px;height:auto"/>';
    });
}

window.toggleLegend = function(){
  var panel = document.getElementById('legendPanel');
  legendShown = !legendShown;
  if(legendShown){
    updateLegendType();
    applyLegend(legendType);
    panel.style.display='block';
    document.getElementById('legendBtn').className='active';
  }else{
    panel.style.display='none';
    document.getElementById('legendBtn').className='';
  }
};

/* ── 時間範囲・過去モード ── */
function updateHistoricalUI(){
  var btnNow   = document.getElementById('btnNow');
  var btnFwd   = document.getElementById('btnFwd');
  var histLabel = document.getElementById('histLabel');
  if(isHistoricalMode()){
    btnNow.style.display = '';
    btnFwd.style.display = '';
    var h = Math.floor(historicalOffsetMin/60), m = historicalOffsetMin%60;
    histLabel.textContent = (h>0 ? h+'時間' : '') + (m>0 ? m+'分' : '') + '前';
  } else {
    btnNow.style.display = 'none';
    btnFwd.style.display = 'none';
    histLabel.textContent = '';
  }
}

window.setTimeRange = function(h){
  timeRangeHours = h;
  ['1','2','3'].forEach(function(x){
    document.getElementById('t'+x+'h').className = (parseInt(x)===h) ? 'active' : '';
  });
  buildFrames();
};

window.stepBack = function(min){
  historicalOffsetMin += min;
  updateHistoricalUI();
  clearTimeout(autoTimerId);  /* 過去モード中は自動更新停止 */
  buildFrames();
};

window.stepForward = function(min){
  historicalOffsetMin = Math.max(0, historicalOffsetMin - min);
  updateHistoricalUI();
  buildFrames();
};

window.goNow = function(){
  historicalOffsetMin = 0;
  latestBaseTime = null;
  updateHistoricalUI();
  buildFrames();
  scheduleAuto();
};

/* ── UI操作 ── */
window.onBuild = function(){ latestBaseTime=null; buildFrames(); };
window.onPlay  = play;
window.onPause = pause;

window.onSlider = function(v){
  pause();
  showFrame(parseInt(v,10));
};

window.onSpeedChange = function(v){
  speedIdx = parseInt(v,10);
  if(playing){ pause(); play(); }
};

/* 奇数ズーム対策: nativeMaxが変化した場合にラスタレイヤを再構築 */
function rebuildLayersAtZoom(){
  var types = Object.keys(layers);
  var changed = false;
  types.forEach(function(tp){
    if(getEffectiveNativeMax(tp) !== currentNativeMax[tp]) changed = true;
  });
  if(!changed) return false;

  types.forEach(function(tp){ currentNativeMax[tp] = getEffectiveNativeMax(tp); });

  var savedIdx = currentIdx;
  currentIdx = -1;
  types.forEach(function(tp){
    layers[tp].forEach(function(l, i){
      if(!l) return;
      map.removeLayer(l);
      layers[tp][i] = makeTileLayer(tp, frames[i].ymdhms);
      layers[tp][i].addTo(map);
    });
  });
  currentIdx = savedIdx;
  reapplyOpacity();
  /* flood VectorGrid はズーム時に再生成しない（GridLayer内蔵のタイル管理に任せる） */
  if(_wasPlaying) play();
  return true;
}

/* ── ベースマップ明暗切り替え（3段階サイクル） ── */
window.toggleBaseMap = function(){
  baseOpacityIdx = (baseOpacityIdx + 1) % BASE_OPACITIES.length;
  baseLayer.setOpacity(BASE_OPACITIES[baseOpacityIdx]);
  var btn = document.getElementById('btnBaseMap');
  btn.textContent = BASE_LABELS[baseOpacityIdx];
  btn.className = baseOpacityIdx === 2 ? 'active' : '';
};

/* ── 浸水・洪水重ね合わせ ── */
var inundFloodMode = false;
window.toggleInundFlood = function(){
  inundFloodMode = !inundFloodMode;
  visible['inund'] = inundFloodMode;
  visible['flood'] = inundFloodMode;
  document.getElementById('btnInund').className     = inundFloodMode ? BTN_CLASS['inund'] : '';
  document.getElementById('btnFlood').className     = inundFloodMode ? BTN_CLASS['flood'] : '';
  document.getElementById('btnInundFlood').className = inundFloodMode ? 'active' : '';
  reapplyOpacity();
  updateRiverBaseLayer();
  updateFloodBaseLayer();
  updateLegendType();
};

/* ズーム中はアニメーション停止・終了後に再開＋opacity再適用 */
map.on('zoomstart', function(){ _wasPlaying=playing; pause(); });
map.on('zoomend', function(){
  saveState();
  /* ズーム後に発火予定の再生成タイマーをキャンセル（zoom中のちらつき防止） */
  clearTimeout(floodFrameTimer); floodFrameTimer = null;
  if(rebuildLayersAtZoom()) return;
  reapplyOpacity();
  setTimeout(function(){ reapplyOpacity(); if(_wasPlaying) play(); }, 300);
});
map.on('moveend', function(){ saveState(); setTimeout(reapplyOpacity, 100); });

/* ── 初期化: 前回の表示状態を復元 ── */
(function(){
  var s=loadState();
  if(s&&s.lat!=null&&s.zoom!=null) map.setView([s.lat,s.lng],s.zoom);
  buildFrames();
  scheduleAuto();
  /* 安全網: 2秒ごとに現フレームのopacityを確認・修正。
     floodCanvasGridがmapから外れていた場合も再追加する */
  setInterval(function(){
    if(!isLoading && currentIdx>=0) reapplyOpacity();
    if(!isLoading && visible['flood'] && frames.length && currentIdx>=0){
      if(floodCanvasGrid && !map.hasLayer(floodCanvasGrid)){
        floodCanvasGrid.addTo(map);
        redrawFloodCanvases();
      }
    }
  }, 2000);
})();

})();
</script>
</body>
</html>`;
