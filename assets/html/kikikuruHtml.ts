import { vectorGridBundledJs } from './vectorgridJs';


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
#controls{padding:4px 6px;background:#16213e;flex-shrink:0;display:flex;flex-direction:row;flex-wrap:wrap;align-items:center;gap:4px}
.ctrl-row{display:contents}
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
<script>${vectorGridBundledJs}</script>
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
var timeRangeHours     = 2;
var historicalOffsetMin = 0;
function isHistoricalMode(){ return historicalOffsetMin > 0; }

/* 洪水キキクルの河川線幅 */
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

/* 国土地理院淡色地図 */
var BASE_CHIRIIN = 'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png';
var BASE_OPACITIES = [0.2, 0.55, 0.9];
var BASE_LABELS    = ['地図暗', '地図中', '地図明'];
var baseOpacityIdx = 1;
var baseLayer = L.tileLayer(BASE_CHIRIIN,{
  maxZoom:18, opacity:BASE_OPACITIES[baseOpacityIdx],
  attribution:'© 国土地理院'
}).addTo(map);

/* ペイン定義 */
map.createPane('rainPane');      map.getPane('rainPane').style.zIndex      = 201;
map.createPane('landPane');      map.getPane('landPane').style.zIndex      = 202;
map.createPane('inundPane');     map.getPane('inundPane').style.zIndex     = 203;
map.createPane('floodBasePane'); map.getPane('floodBasePane').style.zIndex = 204;
map.createPane('floodRiskPane'); map.getPane('floodRiskPane').style.zIndex = 205;
map.createPane('radarPane');     map.getPane('radarPane').style.zIndex     = 350;
/* pane レベルで multiply 設定（canvas 個別だと pane の stacking context で効かない） */
map.getPane('rainPane').style.mixBlendMode  = 'multiply';
map.getPane('landPane').style.mixBlendMode  = 'multiply';
map.getPane('inundPane').style.mixBlendMode = 'multiply';

/* ── 状態 ── */
var frames = [];
/* 全キキクルは Canvas GridLayer で管理 / radar のみラスタータイル */
var layers = { radar: [] };
var currentIdx = -1;
var timerId = null, playing = false, speedIdx = 1;
var isLoading = false;
var autoTimerId = null;
var latestBaseTime = null;
var _wasPlaying = false;

/* 各レイヤーの表示ON/OFF（初期: 大雨のみON） */
var visible = { rain_mesh:true, land:false, inund:false, flood:false, radar:false };

/* 静的河川PNGタイル（洪水ON時のみ表示） */
var riverBaseLayer = L.tileLayer(
  'https://www.jma.go.jp/bosai/jmatile/data/map/none/none/none/surf/flood/{z}/{x}/{y}.png',
  { pane:'floodBasePane', minNativeZoom:4, maxNativeZoom:13,
    minZoom:4, maxZoom:14, opacity:0.85 }
);
function updateRiverBaseLayer(){
  if(visible['flood']){
    if(!map.hasLayer(riverBaseLayer)) riverBaseLayer.addTo(map);
  } else {
    if(map.hasLayer(riverBaseLayer)) map.removeLayer(riverBaseLayer);
  }
}

/* ── 座標変換ユーティリティ ──
   nativeMax 上限 + 偶数ズーム丸め。displayZ > nativeMax の場合は
   nativeMax の親タイルを scale 倍拡大描画する（全 Canvas GridLayer 共通）。 */
function calcFetchCoords(displayZ, x, y, nativeMax){
  var fetchZ = (displayZ % 2 === 1) ? displayZ - 1 : displayZ;
  if(fetchZ > nativeMax) fetchZ = nativeMax;
  if(fetchZ < 4) fetchZ = 4;
  var scale = Math.round(Math.pow(2, displayZ - fetchZ));
  var fetchX = Math.floor(x / scale);
  var fetchY = Math.floor(y / scale);
  return { z:fetchZ, x:fetchX, y:fetchY, qx:x - fetchX*scale, qy:y - fetchY*scale, scale:scale };
}

/* ── 洪水キキクル危険度: Canvas GridLayer（PBF）── */
var FLOOD_NATIVE_MAX = 10;
var floodPbfCache = {};
var floodCurrentYmdhms = null;
var floodCanvasGrid = null;
var floodFrameTimer = null;

function floodTileUrl(ymdhms, z, x, y){
  return 'https://www.jma.go.jp/bosai/jmatile/data/risk/'+ymdhms+'/none/'+ymdhms+'/surf/flood/'+z+'/'+x+'/'+y+'.pbf';
}

function drawFloodOnCanvas(canvas, buffer, z, quadX, quadY, scale){
  try {
    var vt = new VectorTile(new Pbf(new Uint8Array(buffer)));
    var lay = vt.layers['flood'];
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 256, 256);
    if(!lay) return;
    var lw = FLOOD_LINE_WIDTH[Math.min(z, FLOOD_LINE_WIDTH.length-1)] || 4;
    ctx.save();
    if(scale > 1){
      var tileSize = 256 / scale;
      ctx.scale(scale, scale);
      ctx.translate(-quadX * tileSize, -quadY * tileSize);
      lw = lw / scale;
    }
    ctx.lineJoin='round';
    ctx.strokeStyle='#333'; ctx.lineWidth=lw;
    for(var i=0; i<lay.length; i++){
      var geom=lay.feature(i).loadGeometry();
      ctx.beginPath();
      for(var j=0;j<geom.length;j++) for(var k=0;k<geom[j].length;k++){
        var p=geom[j][k],x=p.x/4096*256,y=p.y/4096*256;
        if(k) ctx.lineTo(x,y); else ctx.moveTo(x,y);
      }
      ctx.stroke();
    }
    for(var i=0; i<lay.length; i++){
      var feat=lay.feature(i), level=feat.properties.level;
      var c='#3cffff';
      if(level==1) c='#f2e700';
      if(level==2) c='#ff2800';
      if(level==3) c='#aa00aa';
      if(level==4) c='#0c000c';
      ctx.strokeStyle=c; ctx.lineWidth=Math.max(0.5,(lw-2));
      var geom=feat.loadGeometry();
      ctx.beginPath();
      for(var j=0;j<geom.length;j++) for(var k=0;k<geom[j].length;k++){
        var p=geom[j][k],x=p.x/4096*256,y=p.y/4096*256;
        if(k) ctx.lineTo(x,y); else ctx.moveTo(x,y);
      }
      ctx.stroke();
    }
    ctx.restore();
  } catch(e){}
}

function initFloodCanvasGrid(){
  if(floodCanvasGrid) return;
  var FloodLayer = L.GridLayer.extend({
    createTile: function(coords, done){
      var canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 256;
      if(!floodCurrentYmdhms || !visible['flood']){
        setTimeout(function(){ done(null, canvas); }, 0);
        return canvas;
      }
      var fc = calcFetchCoords(coords.z, coords.x, coords.y, FLOOD_NATIVE_MAX);
      var url = floodTileUrl(floodCurrentYmdhms, fc.z, fc.x, fc.y);
      var c = canvas, qx = fc.qx, qy = fc.qy, lz = fc.z, sc = fc.scale;
      if(floodPbfCache[url]){
        drawFloodOnCanvas(c, floodPbfCache[url], lz, qx, qy, sc);
        setTimeout(function(){ done(null, c); }, 0);
      } else if(floodPbfCache[url] === false){
        setTimeout(function(){ done(null, c); }, 0);
      } else {
        fetch(url).then(function(r){ return r.ok ? r.arrayBuffer() : Promise.reject(r.status); }).then(function(buf){
          if(buf.byteLength > 0){ floodPbfCache[url]=buf; drawFloodOnCanvas(c,buf,lz,qx,qy,sc); }
          else floodPbfCache[url]=false;
          done(null, c);
        }).catch(function(){ floodPbfCache[url]=false; done(null, c); });
      }
      return canvas;
    }
  });
  floodCanvasGrid = new FloodLayer({ pane:'floodRiskPane', minZoom:4, maxZoom:14, tileSize:256 });
}

function redrawFloodCanvases(){
  if(!floodCanvasGrid || !floodCurrentYmdhms) return;
  var tiles = floodCanvasGrid._tiles;
  if(!tiles) return;
  for(var key in tiles){
    var tile = tiles[key];
    if(!tile || !tile.el || typeof tile.el.getContext !== 'function') continue;
    var co = tile.coords;
    var fc = calcFetchCoords(co.z, co.x, co.y, FLOOD_NATIVE_MAX);
    var url = floodTileUrl(floodCurrentYmdhms, fc.z, fc.x, fc.y);
    var c = tile.el, qx = fc.qx, qy = fc.qy, lz = fc.z, sc = fc.scale;
    if(floodPbfCache[url]){
      drawFloodOnCanvas(c, floodPbfCache[url], lz, qx, qy, sc);
    } else if(floodPbfCache[url] !== false){
      (function(cv, z2, qx2, qy2, sc2, u){ fetch(u).then(function(r){ return r.ok ? r.arrayBuffer() : Promise.reject(r.status); }).then(function(buf){
        if(buf.byteLength>0){ floodPbfCache[u]=buf; drawFloodOnCanvas(cv,buf,z2,qx2,qy2,sc2); }
        else floodPbfCache[u]=false;
      }).catch(function(){ floodPbfCache[u]=false; }); })(c, lz, qx, qy, sc, url);
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
  redrawFloodCanvases();
}
function scheduleFloodToFrame(ymdhms){
  clearTimeout(floodFrameTimer);
  floodFrameTimer = setTimeout(function(){ applyFloodToYmdhms(ymdhms); }, 50);
}
function updateFloodBaseLayer(){
  var idx = (currentIdx >= 0 && currentIdx < frames.length) ? currentIdx : frames.length - 1;
  applyFloodToYmdhms(frames.length ? frames[idx].ymdhms : null);
}

/* ── 大雨・土砂・浸水キキクル: Canvas GridLayer（PNG + mix-blend-mode透過）──
   getImageData は iframe の CORS 制限で使えないため、
   mix-blend-mode: multiply で白背景を透過に見せる。
   白(255,255,255) × 地図色 = 地図色 → 白が消えて下の地図が透けて見える。
   危険度色（黄・赤・紫・黒）はそのまま重なって表示される。
   cache値: undefined=未取得, false=404確認済み, ArrayBuffer=データあり */
var RISK_PNG_NATIVE_MAX = { rain_mesh:10, land:10, inund:10 };
var RISK_PNG_PANE       = { rain_mesh:'rainPane', land:'landPane', inund:'inundPane' };

var riskPngCache    = { rain_mesh:{}, land:{}, inund:{} };
var riskCurrentYmd  = { rain_mesh:null, land:null, inund:null };
var riskCanvasGrid  = { rain_mesh:null, land:null, inund:null };
var riskFrameTimer  = { rain_mesh:null, land:null, inund:null };

function riskPngTileUrl(type, ymdhms, z, x, y){
  return 'https://www.jma.go.jp/bosai/jmatile/data/risk/'+ymdhms+'/none/'+ymdhms+'/surf/'+type+'/'+z+'/'+x+'/'+y+'.png';
}

/* PNG ArrayBuffer → canvas 描画。mix-blend-mode:multiply で白背景を透過表示 */
function drawRiskPngFromBuffer(canvas, buffer, scale, quadX, quadY, onComplete){
  var blob = new Blob([buffer], {type:'image/png'});
  var blobUrl = URL.createObjectURL(blob);
  var img = new Image();
  img.onload = function(){
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 256, 256);
    ctx.save();
    if(scale > 1){
      var ts = 256 / scale;
      ctx.scale(scale, scale);
      ctx.translate(-quadX * ts, -quadY * ts);
    }
    ctx.drawImage(img, 0, 0, 256, 256);
    ctx.restore();
    URL.revokeObjectURL(blobUrl);
    if(onComplete) onComplete();
  };
  img.onerror = function(){ URL.revokeObjectURL(blobUrl); if(onComplete) onComplete(); };
  img.src = blobUrl;
}

/* 土砂・浸水・大雨の Canvas GridLayer を初期化 */
function initRiskCanvasGrid(type){
  var nMax  = RISK_PNG_NATIVE_MAX[type];
  var pane  = RISK_PNG_PANE[type];
  var cache = riskPngCache[type];
  var Layer = L.GridLayer.extend({
    createTile: function(coords, done){
      var canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 256;
      var ymd = riskCurrentYmd[type];
      if(!ymd || !visible[type]){
        setTimeout(function(){ done(null, canvas); }, 0);
        return canvas;
      }
      var fc  = calcFetchCoords(coords.z, coords.x, coords.y, nMax);
      var url = riskPngTileUrl(type, ymd, fc.z, fc.x, fc.y);
      var c = canvas, qx = fc.qx, qy = fc.qy, sc = fc.scale;
      if(cache[url]){
        drawRiskPngFromBuffer(c, cache[url], sc, qx, qy, function(){ done(null, c); });
      } else if(cache[url] === false){
        setTimeout(function(){ done(null, c); }, 0);
      } else {
        fetch(url).then(function(r){ return r.ok ? r.arrayBuffer() : Promise.reject(r.status); }).then(function(buf){
          if(buf.byteLength > 0){
            cache[url] = buf;
            drawRiskPngFromBuffer(c, buf, sc, qx, qy, function(){ done(null, c); });
          } else {
            cache[url] = false; done(null, c);
          }
        }).catch(function(){ cache[url] = false; done(null, c); });
      }
      return canvas;
    }
  });
  var grid = new Layer({ pane:pane, minZoom:4, maxZoom:14, tileSize:256 });
  riskCanvasGrid[type] = grid;
}

/* 既存タイルを現在の ymdhms で再描画 */
function redrawRiskCanvases(type){
  var nMax  = RISK_PNG_NATIVE_MAX[type];
  var grid  = riskCanvasGrid[type];
  var cache = riskPngCache[type];
  var ymd   = riskCurrentYmd[type];
  if(!grid || !ymd) return;
  var tiles = grid._tiles;
  if(!tiles) return;
  for(var key in tiles){
    var tile = tiles[key];
    if(!tile || !tile.el || typeof tile.el.getContext !== 'function') continue;
    var co  = tile.coords;
    var fc  = calcFetchCoords(co.z, co.x, co.y, nMax);
    var url = riskPngTileUrl(type, ymd, fc.z, fc.x, fc.y);
    (function(cv, fc2, u){
      if(cache[u]){
        drawRiskPngFromBuffer(cv, cache[u], fc2.scale, fc2.qx, fc2.qy, null);
      } else if(cache[u] !== false){
        fetch(u).then(function(r){ return r.ok ? r.arrayBuffer() : Promise.reject(r.status); }).then(function(buf){
          if(buf.byteLength > 0){ cache[u]=buf; drawRiskPngFromBuffer(cv,buf,fc2.scale,fc2.qx,fc2.qy,null); }
          else cache[u]=false;
        }).catch(function(){ cache[u]=false; });
      }
    })(tile.el, fc, url);
  }
}

function applyRiskToYmdhms(type, ymdhms){
  clearTimeout(riskFrameTimer[type]); riskFrameTimer[type]=null;
  riskCurrentYmd[type] = ymdhms || null;
  var grid = riskCanvasGrid[type];
  if(!visible[type] || !ymdhms){
    if(grid && map.hasLayer(grid)) map.removeLayer(grid);
    return;
  }
  if(!grid){ initRiskCanvasGrid(type); grid=riskCanvasGrid[type]; }
  if(!map.hasLayer(grid)) grid.addTo(map);
  redrawRiskCanvases(type);
}
function scheduleRiskToFrame(type, ymdhms){
  clearTimeout(riskFrameTimer[type]);
  riskFrameTimer[type] = setTimeout(function(){ applyRiskToYmdhms(type, ymdhms); }, 50);
}
function updateRiskBaseLayer(type){
  var idx = (currentIdx >= 0 && currentIdx < frames.length) ? currentIdx : frames.length - 1;
  applyRiskToYmdhms(type, frames.length ? frames[idx].ymdhms : null);
}

/* ── radar のみラスタータイル ── */
var RADAR_NATIVE_MAX = 10;
function radarUrl(ymdhms){
  return 'https://www.jma.go.jp/bosai/jmatile/data/nowc/'+
    ymdhms+'/none/'+ymdhms+'/surf/hrpns/{z}/{x}/{y}.png';
}

/* ── 表示位置の保存/復元 ── */
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

function clearLoadUI(){ elFill.style.width='0%'; elStatus.textContent=''; }

/* ── radar ラスタータイルレイヤー作成 ── */
function makeRadarLayer(ymdhms){
  var fc = calcFetchCoords(map.getZoom(), 0, 0, RADAR_NATIVE_MAX); /* nMax計算用 */
  var nMax = fc.z; /* ズームに応じたnMax */
  var l = L.tileLayer(radarUrl(ymdhms),{
    minNativeZoom:4, maxNativeZoom:nMax,
    minZoom:4, maxZoom:14, opacity:0,
    updateWhenIdle:false, keepBuffer:4, pane:'radarPane'
  });
  l.on('tileload', function(e){
    e.tile.style.imageRendering='pixelated';
    reapplyOpacity();
  });
  l.on('load', function(){ reapplyOpacity(); });
  return l;
}

/* ── クリーンアップ ── */
function cleanup(){
  layers.radar.forEach(function(l){ if(l && map.hasLayer(l)) map.removeLayer(l); });
  layers.radar = [];
  if(floodCanvasGrid && map.hasLayer(floodCanvasGrid)) map.removeLayer(floodCanvasGrid);
  floodCurrentYmdhms = null;
  ['rain_mesh','land','inund'].forEach(function(tp){
    var g = riskCanvasGrid[tp];
    if(g && map.hasLayer(g)) map.removeLayer(g);
    riskCurrentYmd[tp] = null;
  });
  frames=[]; currentIdx=-1;
}

/* ── フレーム表示 ── */
function reapplyOpacity(){
  if(currentIdx<0) return;
  for(var i=0;i<layers.radar.length;i++){
    if(!layers.radar[i] || !map.hasLayer(layers.radar[i])) continue;
    layers.radar[i].setOpacity( (i===currentIdx && visible['radar']) ? 0.4 : 0 );
  }
}

function showFrame(idx){
  if(!frames.length) return;
  idx = ((idx % frames.length) + frames.length) % frames.length;
  var prevIdx = currentIdx;
  currentIdx = idx;

  /* radar はラスタータイル管理 */
  if(!layers.radar[idx]) layers.radar[idx] = makeRadarLayer(frames[idx].ymdhms);
  if(visible['radar']){
    if(!map.hasLayer(layers.radar[idx])) layers.radar[idx].addTo(map);
    layers.radar[idx].setOpacity(0.4);
  } else {
    if(map.hasLayer(layers.radar[idx])) map.removeLayer(layers.radar[idx]);
  }
  if(prevIdx >= 0 && prevIdx !== idx && layers.radar[prevIdx] && map.hasLayer(layers.radar[prevIdx])){
    map.removeLayer(layers.radar[prevIdx]);
  }
  /* 次フレームを先読み */
  var nextIdx = (idx + 1) % frames.length;
  if(frames.length > 1 && nextIdx !== idx){
    if(!layers.radar[nextIdx]) layers.radar[nextIdx] = makeRadarLayer(frames[nextIdx].ymdhms);
    if(!map.hasLayer(layers.radar[nextIdx])) layers.radar[nextIdx].addTo(map);
    layers.radar[nextIdx].setOpacity(0);
  }

  elSlider.value = String(idx);
  elLabel.textContent = (idx+1)+'/'+frames.length;
  elTime.textContent = fmtLocal(frames[idx].time);

  /* Canvas GridLayer のフレーム切替 */
  if(visible['flood'])    { scheduleFloodToFrame(frames[idx].ymdhms); }
  if(visible['rain_mesh']){ scheduleRiskToFrame('rain_mesh', frames[idx].ymdhms); }
  if(visible['land'])     { scheduleRiskToFrame('land',  frames[idx].ymdhms); }
  if(visible['inund'])    { scheduleRiskToFrame('inund', frames[idx].ymdhms); }
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

/* ── フレーム構築 ── */
function buildFrames(){
  if(isLoading) return;
  isLoading=true; pause(); cleanup();

  var bt = getBaseTime(LEAD_SEC, INTERVAL_SEC);
  latestBaseTime = bt;

  var frameCount = timeRangeHours * 6;
  var i;
  for(i=frameCount-1; i>=0; i--){
    var t = new Date(bt.getTime() - i*INTERVAL_SEC*1000);
    frames.push({ time:t, ymdhms:fmtUtc(t) });
  }

  elSlider.min='0';
  elSlider.max=String(frames.length-1);
  elSlider.value=String(frames.length-1);
  elLabel.textContent=frames.length+'/'+frames.length;

  layers.radar = new Array(frames.length).fill(null);

  updateRiverBaseLayer();
  updateFloodBaseLayer();
  ['rain_mesh','land','inund'].forEach(function(tp){
    if(visible[tp]) updateRiskBaseLayer(tp);
  });

  isLoading=false;
  showFrame(frames.length-1);
  elStatus.textContent='';

  /* radar のロード完了後に再生開始 */
  var loaded=false;
  function onLoad(){
    if(!loaded){ loaded=true; clearLoadUI(); play(); }
  }
  var l = layers.radar[frames.length-1];
  if(!l){ onLoad(); return; }
  var n=false;
  l.on('load', function(){ if(!n){n=true;onLoad();} });
  setTimeout(function(){ if(!n){n=true;onLoad();} }, LOAD_TIMEOUT);
}

/* ── 自動更新 ── */
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
  } else if(type === 'rain_mesh' || type === 'land' || type === 'inund'){
    if(visible[type]){
      if(frames.length && currentIdx >= 0) applyRiskToYmdhms(type, frames[currentIdx].ymdhms);
    } else {
      var grid = riskCanvasGrid[type];
      if(grid && map.hasLayer(grid)) map.removeLayer(grid);
    }
  } else if(type === 'radar'){
    if(currentIdx>=0 && layers.radar[currentIdx]){
      var l = layers.radar[currentIdx];
      if(visible['radar']){
        if(!map.hasLayer(l)) l.addTo(map);
        l.setOpacity(0.4);
      } else {
        if(map.hasLayer(l)) map.removeLayer(l);
      }
    }
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
  fetch(LEGEND[type].url)
    .then(function(r){ return r.text(); })
    .then(function(svgText){
      var wrap = document.getElementById('legSvgWrap');
      wrap.innerHTML = svgText;
      var svg = wrap.querySelector('svg');
      if(svg){ svg.style.width='224px'; svg.style.height='auto'; }
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
  clearTimeout(autoTimerId);
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

/* ── ベースマップ明暗切り替え ── */
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
  if(inundFloodMode && frames.length && currentIdx >= 0){
    applyRiskToYmdhms('inund', frames[currentIdx].ymdhms);
  } else {
    var g = riskCanvasGrid['inund'];
    if(g && map.hasLayer(g)) map.removeLayer(g);
  }
  updateLegendType();
};

/* ズーム中はアニメーション停止・終了後に再開 */
map.on('zoomstart', function(){ _wasPlaying=playing; pause(); });
map.on('zoomend', function(){
  saveState();
  clearTimeout(floodFrameTimer); floodFrameTimer=null;
  /* Canvas GridLayer（rain_mesh/land/inund/flood）はズーム後自動でタイル再取得 */
  /* radar のラスタータイルのみ nativeMax 変化時に再構築 */
  var radarChanged = false;
  if(layers.radar.length && currentIdx >= 0){
    var fc = calcFetchCoords(map.getZoom(), 0, 0, RADAR_NATIVE_MAX);
    var savedNMax = layers.radar[currentIdx] ?
      layers.radar[currentIdx].options.maxNativeZoom : -1;
    if(fc.z !== savedNMax){
      radarChanged = true;
      var savedIdx = currentIdx;
      var nextIdx = (savedIdx + 1) % frames.length;
      [savedIdx, nextIdx].forEach(function(fi){
        if(fi < 0 || !layers.radar[fi]) return;
        var wasIn = map.hasLayer(layers.radar[fi]);
        map.removeLayer(layers.radar[fi]);
        layers.radar[fi] = makeRadarLayer(frames[fi].ymdhms);
        if(wasIn) layers.radar[fi].addTo(map);
      });
      reapplyOpacity();
    }
  }
  reapplyOpacity();
  setTimeout(function(){ reapplyOpacity(); if(_wasPlaying) play(); }, 300);
});
map.on('moveend', function(){ saveState(); setTimeout(reapplyOpacity, 100); });

/* ── 初期化 ── */
(function(){
  var s=loadState();
  if(s&&s.lat!=null&&s.zoom!=null) map.setView([s.lat,s.lng],s.zoom);
  buildFrames();
  scheduleAuto();
  /* 安全網: Canvas GridLayer が外れていた場合に再追加して再描画 */
  setInterval(function(){
    if(isLoading || currentIdx<0) return;
    reapplyOpacity();
    if(visible['flood'] && frames.length){
      if(floodCanvasGrid && !map.hasLayer(floodCanvasGrid)){
        floodCanvasGrid.addTo(map); redrawFloodCanvases();
      }
    }
    ['rain_mesh','land','inund'].forEach(function(tp){
      if(visible[tp] && frames.length){
        var g = riskCanvasGrid[tp];
        if(g && !map.hasLayer(g)){ g.addTo(map); redrawRiskCanvases(tp); }
      }
    });
  }, 2000);
})();

})();
</script>
</body>
</html>`;
