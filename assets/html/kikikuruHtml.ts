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
button.act-land{background:#cc3300;border-color:#ff5533;color:#fff}
button.act-inund{background:#0066bb;border-color:#0099ff;color:#fff}
button.act-flood{background:#7733aa;border-color:#aa44dd;color:#fff}
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
    <span style="font-size:10px;color:#aaa">キキクル:</span>
    <button id="btnLand"  class="act-land"  onclick="toggleLayer('land')">土砂</button>
    <button id="btnInund"                   onclick="toggleLayer('inund')">浸水</button>
    <button id="btnFlood"                   onclick="toggleLayer('flood_mesh')">洪水</button>
    <span class="sep">|</span>
    <button id="btnRadar"                   onclick="toggleLayer('radar')">雨雲</button>
    <span class="sep">|</span>
    <select id="speedSel" onchange="onSpeedChange(this.value)" style="padding:3px 4px;border:1px solid #4a90e2;background:#1a3a5c;color:#e0e0e0;border-radius:4px;font-size:11px">
      <option value="0">遅い</option>
      <option value="1" selected>普通</option>
      <option value="2">速い</option>
    </select>
    <button onclick="onBuild()">更新</button>
    <button id="legendBtn" onclick="toggleLegend()">凡例</button>
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
  <img id="legImg" class="leg-img" src="" alt="凡例"/>
</div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
(function(){
'use strict';

/* ── 定数 ── */
var LEAD_SEC     = 11 * 60;
var INTERVAL_SEC = 10 * 60;
var FRAME_COUNT  = 6;
var PROBE_TIMEOUT = 5000;
var LOAD_TIMEOUT  = 10000;
var SPEEDS = [600, 300, 150];
var AUTO_INTERVAL = 10 * 60 * 1000;

/* プローブタイル（東京付近 zoom=6） */
var PROBE = { z: 6, x: 56, y: 25 };

/* レイヤー情報 */
var LEGEND = {
  land:       { url: 'https://www.jma.go.jp/bosai/risk/images/legend_jp_normal_land.svg',      name: '土砂キキクル' },
  inund:      { url: 'https://www.jma.go.jp/bosai/risk/images/legend_jp_normal_inund.svg',     name: '浸水キキクル' },
  flood_mesh: { url: 'https://www.jma.go.jp/bosai/risk/images/legend_jp_normal_floodmesh.svg', name: '洪水キキクル(メッシュ)' }
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
  var t = Date.now() - leadSec*1000;
  t = t - (t % (intervalSec*1000));
  var d = new Date(t);
  /* UTC日時のまま Date オブジェクトを再構成 */
  return new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),
    d.getUTCHours(),d.getUTCMinutes(),d.getUTCSeconds()));
}

/* ── Leaflet地図 ── */
var map = L.map('map',{
  zoomControl:true, scrollWheelZoom:true,
  fadeAnimation:false, zoomAnimation:false, tap:false
}).setView([35.5,137.0],6);
map.setMinZoom(4); map.setMaxZoom(14);

/* ベースマップ（CartoDB Dark）*/
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',{
  maxZoom:19, subdomains:['a','b','c','d'], attribution:'© CartoDB'
}).addTo(map);

/* ペイン定義（土砂→浸水→洪水→レーダー→海岸線の順） */
map.createPane('landPane');      map.getPane('landPane').style.zIndex      = 200;
map.createPane('inundPane');     map.getPane('inundPane').style.zIndex     = 210;
map.createPane('floodPane');     map.getPane('floodPane').style.zIndex     = 220;
map.createPane('radarPane');     map.getPane('radarPane').style.zIndex     = 350;
map.createPane('coastPane');     map.getPane('coastPane').style.zIndex     = 600;
map.getPane('coastPane').style.pointerEvents = 'none';

/* 海岸線 */
L.geoJSON(${_coastlineJson},{
  pane:'coastPane',
  style:{color:'#00cc44',weight:1.2,opacity:0.85,fill:false}
}).addTo(map);

/* ── 状態 ── */
var frames = [];      /* { time, ymdhms } */
var layers = { land:[], inund:[], flood_mesh:[], radar:[] };
var currentIdx = -1;
var timerId = null, playing = false, speedIdx = 1;
var isLoading = false;
var autoTimerId = null;
var latestBaseTime = null;

/* 各レイヤーの表示ON/OFF（初期: 土砂のみON） */
var visible = { land:true, inund:false, flood_mesh:false, radar:false };

/* ペイン対応 */
var PANE = { land:'landPane', inund:'inundPane', flood_mesh:'floodPane', radar:'radarPane' };

/* opacity */
var OPACITY = { land:0.8, inund:0.8, flood_mesh:0.8, radar:0.65 };

/* ── URL ── */
function riskUrl(type, ymdhms){
  return 'https://www.jma.go.jp/bosai/jmatile/data/risk/'+
    ymdhms+'/none/'+ymdhms+'/surf/'+type+'/{z}/{x}/{y}.png';
}
function radarUrl(ymdhms){
  return 'https://www.jma.go.jp/bosai/jmatile/data/nowc/'+
    ymdhms+'/none/'+ymdhms+'/surf/hrpns/{z}/{x}/{y}.png';
}
function probeUrl(ymdhms){
  /* 土砂タイルの存在確認（zoom=6, x=56, y=25: 東京付近）*/
  return 'https://www.jma.go.jp/bosai/jmatile/data/risk/'+
    ymdhms+'/none/'+ymdhms+'/surf/land/'+
    PROBE.z+'/'+PROBE.x+'/'+PROBE.y+'.png';
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

/* ── レイヤー作成 ── */
function makeTileLayer(type, ymdhms){
  var url  = (type==='radar') ? radarUrl(ymdhms) : riskUrl(type, ymdhms);
  var pane = PANE[type];
  var l = L.tileLayer(url,{
    minNativeZoom:4, maxNativeZoom:10,
    minZoom:4, maxZoom:14, opacity:0,
    updateWhenIdle:false, keepBuffer:4, pane:pane
  });
  if(type==='radar'){
    l.on('tileload',function(e){ e.tile.style.imageRendering='pixelated'; });
  }
  return l;
}

/* ── クリーンアップ ── */
function cleanup(){
  var types = Object.keys(layers);
  types.forEach(function(t){
    layers[t].forEach(function(l){ if(l) map.removeLayer(l); });
    layers[t] = [];
  });
  frames=[]; currentIdx=-1;
}

/* ── フレーム表示 ── */
function reapplyOpacity(){
  if(currentIdx<0) return;
  var types = Object.keys(layers);
  types.forEach(function(t){
    var arr = layers[t];
    if(!arr.length) return;
    /* 現フレームのみ表示、他は非表示 */
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

/* ── プローブ（土砂タイルの存在確認でフレームを絞り込む）── */
function probeFrames(candidates, onDone){
  var total=candidates.length, resolved=0, valid=[];
  function finish(){
    valid.sort(function(a,b){ return a.time-b.time; });
    onDone(valid);
  }
  candidates.forEach(function(f){
    var img=new Image(), done=false;
    function resolve(ok){
      if(done) return; done=true;
      if(ok) valid.push(f);
      resolved++;
      setLoadUI(resolved, total, '確認中 '+resolved+'/'+total);
      if(resolved===total) finish();
    }
    img.onload  = function(){ resolve(true); };
    img.onerror = function(){ resolve(false); };
    setTimeout(function(){ resolve(false); }, PROBE_TIMEOUT);
    img.src = probeUrl(f.ymdhms);
  });
}

/* ── 全レイヤーロード ── */
function loadAll(){
  if(!frames.length){ isLoading=false; elStatus.textContent='フレームなし'; return; }
  var types = Object.keys(layers);
  var total = frames.length * types.length;
  elSlider.max = String(frames.length-1);
  setLoadUI(0, total);

  types.forEach(function(t){ layers[t] = new Array(frames.length).fill(null); });

  var loaded=0;
  function onReady(){
    loaded++;
    setLoadUI(loaded, total);
    if(loaded===total){
      setTimeout(function(){
        isLoading=false; clearLoadUI();
        showFrame(frames.length-1);
        play();
      }, 300);
    }
  }

  frames.forEach(function(f,i){
    types.forEach(function(t){
      var l = makeTileLayer(t, f.ymdhms);
      l.addTo(map);
      layers[t][i] = l;
      var n=false;
      l.on('load', function(){ if(!n){n=true; onReady();} });
      setTimeout(function(){ if(!n){n=true; onReady();} }, LOAD_TIMEOUT);
    });
  });
}

/* ── フレーム構築 ── */
function buildFrames(){
  if(isLoading) return;
  isLoading=true; pause(); cleanup();
  elSlider.min='0'; elSlider.max='0'; elSlider.value='0';
  elLabel.textContent='0/0';

  var bt = getBaseTime(LEAD_SEC, INTERVAL_SEC);
  latestBaseTime = bt;

  var candidates=[];
  for(var i=FRAME_COUNT-1; i>=0; i--){
    var t = new Date(bt.getTime() - i*INTERVAL_SEC*1000);
    candidates.push({ time:t, ymdhms:fmtUtc(t) });
  }
  setLoadUI(0, candidates.length, '確認中…');
  probeFrames(candidates, function(valid){
    frames = valid;
    loadAll();
  });
}

/* ── 自動更新 ── */
function scheduleAuto(){
  clearTimeout(autoTimerId);
  autoTimerId = setTimeout(function(){
    var bt = getBaseTime(LEAD_SEC, INTERVAL_SEC);
    if(!latestBaseTime || bt.getTime()!==latestBaseTime.getTime()) buildFrames();
    scheduleAuto();
  }, AUTO_INTERVAL);
}

/* ── レイヤーON/OFF ── */
var BTN_IDS   = { land:'btnLand', inund:'btnInund', flood_mesh:'btnFlood', radar:'btnRadar' };
var BTN_CLASS = { land:'act-land', inund:'act-inund', flood_mesh:'act-flood', radar:'act-radar' };

window.toggleLayer = function(type){
  visible[type] = !visible[type];
  var btn = document.getElementById(BTN_IDS[type]);
  btn.className = visible[type] ? BTN_CLASS[type] : '';
  /* 現フレームのopacityを即時更新 */
  if(currentIdx>=0 && layers[type] && layers[type][currentIdx]){
    layers[type][currentIdx].setOpacity( visible[type] ? OPACITY[type] : 0 );
  }
  /* 凡例表示タイプを更新 */
  updateLegendType();
};

/* ── 凡例 ── */
var legendShown=false;
var legendType='land';

function updateLegendType(){
  var order=['land','inund','flood_mesh'];
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
  document.getElementById('legImg').src           = LEGEND[type].url;
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

/* ズーム後にopacity再適用 */
map.on('zoomend', function(){
  setTimeout(reapplyOpacity, 200);
});
map.on('moveend', function(){
  setTimeout(reapplyOpacity, 100);
});

/* ── 初期化 ── */
(function(){
  buildFrames();
  scheduleAuto();
  /* 安全網: 2秒ごとに現フレームのopacityを確認・修正 */
  setInterval(function(){
    if(!isLoading && currentIdx>=0) reapplyOpacity();
  }, 2000);
})();

})();
</script>
</body>
</html>`;
