export const radarHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no,minimum-scale=1,maximum-scale=1"/>
<title>レーダー+衛星</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{display:flex;flex-direction:column;height:100vh;height:100dvh;background:#1a1a2e;color:#e0e0e0;font-family:sans-serif;font-size:12px}
#header{padding:4px 8px;background:#0f3460;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
#header .title{font-weight:bold;font-size:13px}
#timeDisp{font-size:11px;color:#90caf9}
#controls{padding:4px 6px;background:#16213e;flex-shrink:0;display:flex;flex-direction:row;flex-wrap:wrap;align-items:center;gap:4px}
.ctrl-row{display:contents}
.btn-group{display:flex;gap:2px}
button{padding:4px 8px;border:1px solid #4a90e2;background:#1a3a5c;color:#e0e0e0;border-radius:4px;font-size:11px;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
button.active{background:#4a90e2;color:#fff;border-color:#4a90e2}
button:disabled{opacity:0.35;border-color:#555}
#autoStatus{font-size:10px;color:#81c784;margin-left:4px}
#autoStatus.paused{color:#ffb74d}
#map{flex:1;background:#000;touch-action:none}
#bottom{padding:4px 6px;background:#0f3460;flex-shrink:0}
#sliderRow{display:flex;align-items:center;gap:6px;margin-bottom:3px}
#frameSlider{flex:1;accent-color:#4a90e2;height:24px;cursor:pointer}
#frameLabel{font-size:10px;white-space:nowrap;color:#90caf9;min-width:36px;text-align:right}
#loadRow{display:flex;align-items:center;gap:6px;height:14px}
.load-bar{flex:1;height:4px;background:#333;border-radius:2px;overflow:hidden}
.load-bar-fill{height:100%;background:#4a90e2;transition:width 0.2s;width:0%}
#loadStatus{font-size:10px;color:#aaa;min-width:120px}
.sep{color:#555;font-size:10px}
select{padding:3px 4px;border:1px solid #4a90e2;background:#1a3a5c;color:#e0e0e0;border-radius:4px;font-size:11px}
#legendBtn.active{background:#4a90e2;color:#fff;border-color:#4a90e2}
#legendPanel{position:fixed;bottom:60px;left:6px;z-index:900;background:rgba(10,30,60,0.93);border:1px solid #4a90e2;border-radius:8px;padding:6px 8px;display:none}
.leg-title{font-size:11px;font-weight:bold;color:#90caf9;display:flex;justify-content:space-between;align-items:center;margin-bottom:3px}
.leg-unit{font-size:9px;color:#aaa;text-align:right;margin-bottom:2px}
.leg-row{display:flex;align-items:center;gap:5px;margin-bottom:1px}
.leg-sw{width:22px;height:13px;flex-shrink:0;border:1px solid rgba(255,255,255,0.2)}
.leg-lb{font-size:11px;color:#e0e0e0;min-width:24px}
</style>
</head>
<body>

<div id="header">
  <span class="title">🌧️🛰️ レーダー+衛星</span>
  <span id="timeDisp">-</span>
</div>

<div id="controls">
  <div class="ctrl-row">
    <div class="btn-group">
      <button id="aJP" class="active" onclick="setArea('jp')">日本域</button>
      <button id="aFD" onclick="setArea('fd')">全球</button>
    </div>
    <span class="sep">|</span>
    <div class="btn-group">
      <button id="bETC" class="active" onclick="setBand('ETC')">雲頂</button>
      <button id="bB13" onclick="setBand('B13')">赤外</button>
      <button id="bB03" onclick="setBand('B03')">可視</button>
      <button id="bB08" onclick="setBand('B08')">水蒸気</button>
    </div>
    <span class="sep">|</span>
    <button onclick="onBuild()">更新</button>
  </div>
  <div class="ctrl-row">
    <div class="btn-group">
      <button id="mBoth"  class="active" onclick="setMode('both')">重ね</button>
      <button id="mRadar" onclick="setMode('radar')">レーダー</button>
      <button id="mSat"   onclick="setMode('sat')">衛星</button>
    </div>
    <span class="sep">|</span>
    <label style="font-size:11px"><input type="checkbox" id="osmOn" onchange="toggleOsm(this.checked)"> OSM</label>
    <span class="sep">|</span>
    <select id="speedSelect" onchange="onSpeedChange(this.value)">
      <option value="0">遅い</option>
      <option value="1" selected>普通</option>
      <option value="2">速い</option>
      <option value="3">最速</option>
    </select>
    <span id="autoStatus">🔄 AUTO</span>
    <button id="legendBtn" onclick="toggleLegend()" title="降水強度凡例">凡</button>
  </div>
  <div class="ctrl-row">
    <div class="btn-group">
      <button id="t1h" onclick="setTimeRange(1)">1時間</button>
      <button id="t2h" class="active" onclick="setTimeRange(2)">2時間</button>
      <button id="t3h" onclick="setTimeRange(3)">3時間</button>
    </div>
    <span class="sep">|</span>
    <div class="btn-group">
      <button onclick="stepBack(300)">◀5h</button>
      <button onclick="stepBack(60)">◀1h</button>
      <button id="btnFwd" onclick="stepForward(60)" style="display:none">1h▶</button>
    </div>
    <button id="btnNow" onclick="goNow()" style="display:none;background:#c62828;border-color:#e53935;padding:4px 8px">▶現在</button>
    <span id="histLabel" style="font-size:10px;color:#ffb74d;margin-left:2px"></span>
  </div>
  <div class="ctrl-row">
    <button id="amedasBtn" onclick="toggleAmedas()">アメダス</button>
    <select id="amedasKind" onchange="onAmedasKindChange()">
      <option value="wind">矢羽（風）</option>
      <option value="temp">気温</option>
      <option value="dewPoint">露点温度</option>
      <option value="humidity">湿度</option>
      <option value="normalPressure">気圧</option>
      <option value="precipitation10m">10分雨量</option>
      <option value="precipitation1h">1h雨量</option>
      <option value="precipitation3h">3h雨量</option>
      <option value="precipitation24h">24h雨量</option>
      <option value="snow1h">1h降雪</option>
      <option value="snow6h">6h降雪</option>
      <option value="snow24h">24h降雪</option>
    </select>
    <span id="amedasStatus" style="font-size:10px;color:#aaa;margin-left:4px"></span>
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

<!-- 降水強度凡例パネル（凡ボタンで表示） -->
<div id="legendPanel">
  <div class="leg-title">降水強度
    <button onclick="toggleLegend()" style="padding:0 4px;border:none;background:none;color:#aaa;font-size:13px;cursor:pointer;line-height:1">✕</button>
  </div>
  <div class="leg-unit">mm/h</div>
  <div class="leg-row"><div class="leg-sw" style="background:rgb(180,0,104)"></div><span class="leg-lb">≥80</span></div>
  <div class="leg-row"><div class="leg-sw" style="background:rgb(255,40,0)"></div><span class="leg-lb">50</span></div>
  <div class="leg-row"><div class="leg-sw" style="background:rgb(255,153,0)"></div><span class="leg-lb">30</span></div>
  <div class="leg-row"><div class="leg-sw" style="background:rgb(255,245,0)"></div><span class="leg-lb">20</span></div>
  <div class="leg-row"><div class="leg-sw" style="background:rgb(0,65,255)"></div><span class="leg-lb">10</span></div>
  <div class="leg-row"><div class="leg-sw" style="background:rgb(33,140,255)"></div><span class="leg-lb">5</span></div>
  <div class="leg-row"><div class="leg-sw" style="background:rgb(160,210,255)"></div><span class="leg-lb">1</span></div>
  <div class="leg-row"><div class="leg-sw" style="background:rgb(242,242,255)"></div><span class="leg-lb">&lt;1</span></div>
</div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
(function(){
'use strict';

/* ── 定数 ── */
var FIXED_FRAME_COUNT = 12; /* フレーム数固定 — ステップ間隔で時間範囲を調整（レイヤ数一定でメモリ安全）*/
var LOAD_TIMEOUT   = 10000;
var PROBE_TIMEOUT  = 5000;
var SPEEDS         = [600,300,150,80];
var AUTO_INTERVAL  = 60*1000;
var PAUSE_DURATION = 10*60*1000;
var LEAD_SEC       = 12.5*60;
var RADAR_INT      = 5*60;

var PROBE = {
  fd:{zoom:5,x:28,y:12},
  jp:{zoom:6,x:56,y:24}
};
var SAT_SEG = {
  ETC:'SND/ETC', B13:'B13/TBB', B03:'B03/ALBD', B08:'B08/TBB'
};
var AREA_PARAMS = {
  jp:{nativeZoom:6,interval:2.5*60,center:[35.5,137.0],zoom:6},
  fd:{nativeZoom:5,interval:10*60, center:[0,140.7],zoom:3}
};

/* ── common.js インライン ── */
function pad2(n){ return n<10?'0'+n:''+n; }
function fmtUtc(d){
  return ''+d.getUTCFullYear()+pad2(d.getUTCMonth()+1)+pad2(d.getUTCDate())+
    pad2(d.getUTCHours())+pad2(d.getUTCMinutes())+pad2(d.getUTCSeconds());
}
function getBaseTime(leadSec,intervalSec){
  var t=Date.now()-leadSec*1000;
  t=t-(t%(intervalSec*1000));
  var d=new Date(t);
  return new Date(d.getFullYear(),d.getMonth(),d.getDate(),
    d.getHours(),d.getMinutes(),d.getSeconds());
}
/* 過去モード対応: historicalOffsetMin>0 なら offset分だけ過去に遡る */
function getHistoricalBaseTime(leadSec,intervalSec){
  var t=Date.now()-(isHistoricalMode()?historicalOffsetMin*60000:leadSec*1000);
  t=t-(t%(intervalSec*1000));
  var d=new Date(t);
  return new Date(d.getFullYear(),d.getMonth(),d.getDate(),
    d.getHours(),d.getMinutes(),d.getSeconds());
}
function fmtLocal(d){
  return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate())+' '+
    pad2(d.getHours())+':'+pad2(d.getMinutes())+' JST';
}

/* ── Leaflet 地図 ── */
var map=L.map('map',{
  zoomControl:true,
  scrollWheelZoom:true,
  fadeAnimation:false,
  zoomAnimation:false,
  tap:false
}).setView([35.5,137.0],6);
map.setMinZoom(4);map.setMaxZoom(12);

/* CartoDB Dark（常時表示ベースマップ）— ズーム中も黒画面にならない */
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',{
  maxZoom:19,
  subdomains:['a','b','c','d'],
  attribution:'© CartoDB'
}).addTo(map);

map.createPane('satPane');
map.createPane('radarPane');
map.createPane('coastPane');
map.getPane('satPane').style.zIndex   = 200;
map.getPane('radarPane').style.zIndex = 350;
map.getPane('coastPane').style.zIndex = 600;
/* coastPane はポインタイベントを透過させる */
map.getPane('coastPane').style.pointerEvents = 'none';

var osmLayer=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
  maxZoom:18,attribution:'© OpenStreetMap contributors'
});

/* ── 海岸線（GitHub Raw から fetch で動的取得）── */
(function(){
  var REPO='https://raw.githubusercontent.com/masauehr/iphone-weather-app/main/assets/geodata/';
  function addCoast(url,style){
    fetch(url).then(function(r){return r.json();})
      .then(function(data){L.geoJSON(data,{pane:'coastPane',style:style}).addTo(map);})
      .catch(function(){});
  }
  addCoast(REPO+'world_coastline.json',{color:'#00cc44',weight:0.8,opacity:0.72,fill:false});
  addCoast(REPO+'japan_coastline.json',{color:'#00cc44',weight:1.2,opacity:0.85,fill:false});
})();

/* ── 状態変数 ── */
var satFrames=[],radarFrames=[];
var satLayers=[],radarLayers=[];
var currentIdx=-1,prevRadarIdx=-1;
var timerId=null,playing=false,speedIdx=1;
var isLoading=false;
var autoTimerId=null,pauseAt=0;
var latestSatTime=null,latestRadarTime=null;
var currentArea='jp',currentBand='ETC',displayMode='both';
var _wasPlaying=false;
var currentNativeMax=10;
var timeRangeHours=2;
var historicalOffsetMin=0;
function isHistoricalMode(){return historicalOffsetMin>0;}

/* ── 表示位置の保存/復元（localStorage）── */
function saveState(){
  try{
    var c=map.getCenter();
    localStorage.setItem('radarState',JSON.stringify({
      lat:c.lat,lng:c.lng,zoom:map.getZoom(),
      area:currentArea,band:currentBand
    }));
  }catch(e){}
}
function loadState(){
  try{
    var s=localStorage.getItem('radarState');
    return s?JSON.parse(s):null;
  }catch(e){return null;}
}

/* ── DOM ── */
var elTime    =document.getElementById('timeDisp');
var elSlider  =document.getElementById('frameSlider');
var elLabel   =document.getElementById('frameLabel');
var elFill    =document.getElementById('loadBarFill');
var elStatus  =document.getElementById('loadStatus');
var elAuto    =document.getElementById('autoStatus');

/* ── URL生成 ── */
function satUrl(area,ymdhms,band){
  return 'https://www.jma.go.jp/bosai/himawari/data/satimg/'+
    ymdhms+'/'+area+'/'+ymdhms+'/'+SAT_SEG[band]+'/{z}/{x}/{y}.jpg';
}
function probeUrl(area,ymdhms,band){
  var p=PROBE[area];
  return 'https://www.jma.go.jp/bosai/himawari/data/satimg/'+
    ymdhms+'/'+area+'/'+ymdhms+'/'+SAT_SEG[band]+'/'+
    p.zoom+'/'+p.x+'/'+p.y+'.jpg';
}
function radarUrl(ymdhms){
  return 'https://www.jma.go.jp/bosai/jmatile/data/nowc/'+
    ymdhms+'/none/'+ymdhms+'/surf/hrpns/{z}/{x}/{y}.png';
}

/* ── 奇数ズーム対策: maxNativeZoom を偶数に丸める ── */
function getEffectiveRadarNativeMax(){
  var z=map.getZoom();
  var nMax=(z%2===1)?z-1:z;
  if(nMax<4)nMax=4;
  if(nMax>10)nMax=10;
  return nMax;
}

/* ── Layer生成 ── */
function makeSatLayer(f,band){
  var l=L.tileLayer(satUrl(f.area,fmtUtc(f.time),band),{
    minNativeZoom:f.nativeZoom,maxNativeZoom:f.nativeZoom,
    minZoom:2,maxZoom:12,opacity:0,
    updateWhenIdle:false,keepBuffer:6,pane:'satPane'
  });
  l.on('tileload',function(){reapplyOpacity();});
  l.on('load',function(){reapplyOpacity();});
  return l;
}
function makeRadarLayer(ymdhms,nMax){
  var l=L.tileLayer(radarUrl(ymdhms),{
    minNativeZoom:4,maxNativeZoom:nMax||10,
    minZoom:4,maxZoom:12,opacity:0,
    updateWhenIdle:false,keepBuffer:6,pane:'radarPane'
  });
  l.on('tileload',function(e){
    e.tile.style.imageRendering='pixelated';
    reapplyOpacity();
  });
  l.on('load',function(){reapplyOpacity();});
  return l;
}

/* ── ズーム変化時にレーダー全レイヤを再構築 ── */
function rebuildRadarLayersAtZoom(newMax){
  var oldIdx=prevRadarIdx;
  var i;
  for(i=0;i<radarLayers.length;i++){
    if(radarLayers[i])map.removeLayer(radarLayers[i]);
    radarLayers[i]=makeRadarLayer(fmtUtc(radarFrames[i].time),newMax);
    radarLayers[i].addTo(map);
  }
  currentNativeMax=newMax;
  prevRadarIdx=-1;
  if(oldIdx>=0&&radarLayers[oldIdx]){
    radarLayers[oldIdx].setOpacity(radarOpacity());
    prevRadarIdx=oldIdx;
  }
  reapplyOpacity();
  if(_wasPlaying)play();
}

/* ── クリーンアップ ── */
function cleanup(){
  var i;
  for(i=0;i<satLayers.length;i++)if(satLayers[i])map.removeLayer(satLayers[i]);
  for(i=0;i<radarLayers.length;i++)if(radarLayers[i])map.removeLayer(radarLayers[i]);
  satLayers=[];radarLayers=[];satFrames=[];radarFrames=[];
  currentIdx=-1;prevRadarIdx=-1;
}

/* ── ロードUI ── */
function setLoadUI(done,total,msg){
  elFill.style.width=(total>0?Math.round(done/total*100):0)+'%';
  elStatus.textContent=msg||('読込中 '+done+'/'+total);
}
function clearLoadUI(){elFill.style.width='0%';elStatus.textContent='';}

/* ── 自動更新インジケーター ── */
function updateAutoUI(){
  if(isHistoricalMode()){
    elAuto.textContent='⏮ 過去';elAuto.className='paused';return;
  }
  if(pauseAt>0&&Date.now()-pauseAt<PAUSE_DURATION){
    var rem=Math.ceil((PAUSE_DURATION-(Date.now()-pauseAt))/60000);
    elAuto.textContent='⏸ PAUSE '+rem+'分';elAuto.className='paused';
  } else {
    elAuto.textContent='🔄 AUTO';elAuto.className='';
  }
}

/* ── 最近接レーダーindex ── */
function closestRadar(satTime){
  var best=0,bestD=Infinity;
  for(var i=0;i<radarFrames.length;i++){
    var d=Math.abs(radarFrames[i].time-satTime);
    if(d<bestD){bestD=d;best=i;}
  }
  return best;
}

/* ── Opacity値 ── */
function satOpacity(){  return displayMode==='radar'?0:0.9; }
function radarOpacity(){return displayMode==='sat'?0:(displayMode==='radar'?0.9:0.6);}

/* ── opacity再適用（zoomend・tileload共用） ── */
function reapplyOpacity(){
  if(currentIdx>=0&&satLayers[currentIdx])
    satLayers[currentIdx].setOpacity(satOpacity());
  if(prevRadarIdx>=0&&radarLayers[prevRadarIdx])
    radarLayers[prevRadarIdx].setOpacity(radarOpacity());
}

/* ── フレーム表示 ── */
function showFrame(idx){
  if(!satFrames.length)return;
  idx=((idx%satFrames.length)+satFrames.length)%satFrames.length;
  if(currentIdx>=0&&satLayers[currentIdx])satLayers[currentIdx].setOpacity(0);
  currentIdx=idx;
  if(satLayers[idx])satLayers[idx].setOpacity(satOpacity());

  var hasRadar=radarLayers.length>0;
  if(hasRadar&&displayMode!=='sat'){
    var ri=closestRadar(satFrames[idx].time);
    if(ri!==prevRadarIdx){
      if(prevRadarIdx>=0&&radarLayers[prevRadarIdx])radarLayers[prevRadarIdx].setOpacity(0);
      if(radarLayers[ri])radarLayers[ri].setOpacity(radarOpacity());
      prevRadarIdx=ri;
    }
  } else {
    if(prevRadarIdx>=0&&radarLayers[prevRadarIdx])radarLayers[prevRadarIdx].setOpacity(0);
    prevRadarIdx=-1;
  }
  elSlider.value=String(idx);
  elLabel.textContent=(idx+1)+'/'+satFrames.length;
  elTime.textContent=fmtLocal(satFrames[idx].time);
  /* アメダス: 10分バケットが変わったときだけ更新（同バケットの連続フレームはスキップ） */
  if(amedasOn){
    var _jst=fmtJst(satFrames[idx].time);
    if(_jst!==lastAmedasJst) scheduleAmedasUpdate(50);
  }
}

/* ── 表示モード切替（現フレームに即反映） ── */
function applyMode(){
  if(currentIdx<0)return;
  if(satLayers[currentIdx])satLayers[currentIdx].setOpacity(satOpacity());
  var hasRadar=radarLayers.length>0;
  if(hasRadar){
    if(displayMode==='sat'){
      if(prevRadarIdx>=0&&radarLayers[prevRadarIdx])radarLayers[prevRadarIdx].setOpacity(0);
      prevRadarIdx=-1;
    } else {
      var ri=closestRadar(satFrames[currentIdx].time);
      if(prevRadarIdx>=0&&prevRadarIdx!==ri&&radarLayers[prevRadarIdx])
        radarLayers[prevRadarIdx].setOpacity(0);
      if(radarLayers[ri])radarLayers[ri].setOpacity(radarOpacity());
      prevRadarIdx=ri;
    }
  }
}

/* ── 再生制御 ── */
function play(){
  if(playing||!satFrames.length||isLoading)return;
  playing=true;
  (function tick(){
    if(!playing)return;
    var nextIdx=(currentIdx+1)%satFrames.length;
    showFrame(nextIdx);
    // 最新フレーム到達時は1秒停止してからループ
    var delay=nextIdx===satFrames.length-1?1000:SPEEDS[speedIdx];
    timerId=setTimeout(tick,delay);
  })();
}
function pause(){playing=false;clearTimeout(timerId);timerId=null;}

/* ── ズーム中はアニメーション停止・終了後に再開＋opacity再適用 ── */
map.on('zoomstart',function(){
  _wasPlaying=playing;
  pause();
});
map.on('zoomend',function(){
  saveState();
  /* レーダー: 奇数ズーム対策 — nativeMax が変化した場合は全レイヤ再構築 */
  if(currentArea==='jp'&&radarLayers.length>0){
    var newMax=getEffectiveRadarNativeMax();
    if(newMax!==currentNativeMax){
      rebuildRadarLayersAtZoom(newMax);
      return;
    }
  }
  reapplyOpacity();
  setTimeout(function(){reapplyOpacity();if(_wasPlaying)play();},300);
  if(amedasOn) scheduleAmedasUpdate(500);
});
map.on('moveend',function(){saveState();setTimeout(reapplyOpacity,100);if(amedasOn) scheduleAmedasUpdate(500);});

/* ── フェーズ1: 衛星プローブ ── */
function probe(area,band,candidates,onDone){
  var total=candidates.length,resolved=0,valid=[];
  function finish(){
    valid.sort(function(a,b){return a.time-b.time;});
    onDone(valid);
  }
  candidates.forEach(function(f){
    var ymdhms=fmtUtc(f.time);
    var img=new Image(),done=false;
    function resolve(ok){
      if(done)return;done=true;
      if(ok)valid.push(f);
      resolved++;
      setLoadUI(resolved,total,'衛星確認中 '+resolved+'/'+total+'（有効 '+valid.length+'）');
      if(resolved===total)finish();
    }
    img.onload=function(){resolve(true);};
    img.onerror=function(){resolve(false);};
    setTimeout(function(){resolve(false);},PROBE_TIMEOUT);
    img.src=probeUrl(area,ymdhms,band);
  });
}

/* ── レーダープローブ（nowcデータの存在確認）── */
function probeRadar(candidates,onDone){
  var total=candidates.length,resolved=0,valid=[];
  function finish(){
    valid.sort(function(a,b){return a.time-b.time;});
    onDone(valid);
  }
  var p=PROBE['jp'];
  candidates.forEach(function(f){
    var ymdhms=fmtUtc(f.time);
    var url='https://www.jma.go.jp/bosai/jmatile/data/nowc/'+
      ymdhms+'/none/'+ymdhms+'/surf/hrpns/'+
      p.zoom+'/'+p.x+'/'+p.y+'.png';
    var img=new Image(),done=false;
    function resolve(ok){
      if(done)return;done=true;
      if(ok)valid.push(f);
      resolved++;
      if(resolved===total)finish();
    }
    img.onload=function(){resolve(true);};
    img.onerror=function(){resolve(false);};
    setTimeout(function(){resolve(false);},PROBE_TIMEOUT);
    img.src=url;
  });
}

/* ── フェーズ2: 全レイヤープリロード ── */
function loadAll(band,area){
  var needRadar=true;
  var total=satFrames.length+(needRadar?radarFrames.length:0);
  if(!total){isLoading=false;elStatus.textContent='レイヤなし';return;}

  elSlider.max=String(satFrames.length-1);
  elSlider.value=String(satFrames.length-1);
  elLabel.textContent=satFrames.length+'/'+satFrames.length;
  setLoadUI(0,total);

  var loaded=0;
  function onReady(){
    loaded++;
    setLoadUI(loaded,total);
    if(loaded===total){
      setTimeout(function(){
        isLoading=false;clearLoadUI();
        showFrame(satFrames.length-1);play();
      },400);
    }
  }

  satLayers=new Array(satFrames.length).fill(null);
  satFrames.forEach(function(f,i){
    var l=makeSatLayer(f,band);
    l.addTo(map);satLayers[i]=l;
    var n=false;
    l.on('load',function(){if(!n){n=true;onReady();}});
    setTimeout(function(){if(!n){n=true;onReady();}},LOAD_TIMEOUT);
  });

  if(needRadar){
    currentNativeMax=getEffectiveRadarNativeMax();
    radarLayers=new Array(radarFrames.length).fill(null);
    radarFrames.forEach(function(f,i){
      var l=makeRadarLayer(fmtUtc(f.time),currentNativeMax);
      l.addTo(map);radarLayers[i]=l;
      var n=false;
      l.on('load',function(){if(!n){n=true;onReady();}});
      setTimeout(function(){if(!n){n=true;onReady();}},LOAD_TIMEOUT);
    });
  }
}

/* ── メイン: フレーム構築 ── */
function buildFrames(preserveView){
  if(isLoading)return;
  isLoading=true;pause();cleanup();

  var params=AREA_PARAMS[currentArea];
  /* 全球モードではズーム3まで引けるようにminZoomを調整 */
  map.setMinZoom(currentArea==='fd'?2:4);
  if(!preserveView)map.setView(params.center,params.zoom);

  elSlider.min='0';elSlider.max='0';elSlider.value='0';
  elLabel.textContent='0/0';

  var lead=isHistoricalMode()?0:LEAD_SEC;
  /* フレーム数固定・ステップ間隔を時間範囲に合わせて伸縮 → 総レイヤ数を12+12に保つ */
  var radarFactor=Math.max(1,Math.round(timeRangeHours*3600/(FIXED_FRAME_COUNT*RADAR_INT)));
  var radarStepSec=radarFactor*RADAR_INT;
  var satFactor=Math.max(1,Math.round(timeRangeHours*3600/(FIXED_FRAME_COUNT*params.interval)));
  var satStepSec=satFactor*params.interval;

  var bt=getHistoricalBaseTime(lead,radarStepSec);
  latestRadarTime=bt;
  var radarCands=[];
  for(var j=FIXED_FRAME_COUNT-1;j>=0;j--)
    radarCands.push({time:new Date(bt.getTime()-j*radarStepSec*1000)});

  var satBt=getHistoricalBaseTime(lead,satStepSec);
  latestSatTime=satBt;
  var satCands=[];
  for(var i=FIXED_FRAME_COUNT-1;i>=0;i--)
    satCands.push({time:new Date(satBt.getTime()-i*satStepSec*1000),
                area:currentArea,nativeZoom:params.nativeZoom});

  setLoadUI(0,satCands.length+radarCands.length,'確認中…');

  /* 衛星・レーダーを並行probeし、両方完了したらロード開始 */
  var satDone=false,radarDone=false,validSat=[],validRadar=[];
  function tryLoadAll(){
    if(!satDone||!radarDone)return;
    satFrames=validSat;
    radarFrames=validRadar;
    if(!satFrames.length){
      isLoading=false;elStatus.textContent='有効な衛星フレームなし';return;
    }
    elStatus.textContent='衛星'+satFrames.length+'/'+satCands.length+
      ' レーダー'+radarFrames.length+'/'+radarCands.length+'  読込中…';
    loadAll(currentBand,currentArea);
  }
  probe(currentArea,currentBand,satCands,function(valid){validSat=valid;satDone=true;tryLoadAll();});
  probeRadar(radarCands,function(valid){validRadar=valid;radarDone=true;tryLoadAll();});
}

/* ── 自動更新ループ ── */
function autoLoop(){
  if(isHistoricalMode()){scheduleAuto();return;}  /* 過去モード中は自動更新しない */
  updateAutoUI();
  if(pauseAt>0&&Date.now()-pauseAt<PAUSE_DURATION){scheduleAuto();return;}
  if(pauseAt>0){pauseAt=0;updateAutoUI();}
  if(isLoading){scheduleAuto();return;}

  var params=AREA_PARAMS[currentArea];
  var satFactor=Math.max(1,Math.round(timeRangeHours*3600/(FIXED_FRAME_COUNT*params.interval)));
  var newSat=getBaseTime(LEAD_SEC,satFactor*params.interval);
  var satChanged=!latestSatTime||newSat.getTime()!==latestSatTime.getTime();
  var radarFactor=Math.max(1,Math.round(timeRangeHours*3600/(FIXED_FRAME_COUNT*RADAR_INT)));
  var newR=getBaseTime(LEAD_SEC,radarFactor*RADAR_INT);
  var radarChanged=!latestRadarTime||newR.getTime()!==latestRadarTime.getTime();
  if(satChanged||radarChanged)buildFrames(true);
  scheduleAuto();
}
function scheduleAuto(){clearTimeout(autoTimerId);autoTimerId=setTimeout(autoLoop,AUTO_INTERVAL);}

/* ── UI操作 ── */
window.setArea=function(a,noRebuild){
  var areaChanged=(a!==currentArea);
  currentArea=a;
  document.getElementById('aJP').className=a==='jp'?'active':'';
  document.getElementById('aFD').className=a==='fd'?'active':'';
  document.getElementById('mBoth').disabled=false;
  document.getElementById('mRadar').disabled=false;
  latestSatTime=null;latestRadarTime=null;
  if(!noRebuild){saveState();buildFrames(!areaChanged);}
};

window.setBand=function(b){
  currentBand=b;
  ['ETC','B13','B03','B08'].forEach(function(x){
    document.getElementById('b'+x).className=x===b?'active':'';
  });
  latestSatTime=null;
  saveState();buildFrames(true);
};

window.setMode=function(m,noApply){
  displayMode=m;
  document.getElementById('mBoth').className=m==='both'?'active':'';
  document.getElementById('mRadar').className=m==='radar'?'active':'';
  document.getElementById('mSat').className=m==='sat'?'active':'';
  if(!noApply)applyMode();
};

window.toggleOsm=function(on){
  if(on){if(!map.hasLayer(osmLayer))osmLayer.addTo(map);}
  else{if(map.hasLayer(osmLayer))map.removeLayer(osmLayer);}
};

window.onBuild=function(){
  if(!isHistoricalMode()){
    pauseAt=0;latestSatTime=null;latestRadarTime=null;
    clearTimeout(autoTimerId);scheduleAuto();
  }
  buildFrames(false);updateAutoUI();
};

/* ── 時間範囲・過去モード UI更新 ── */
function updateHistoricalUI(){
  var btnNow=document.getElementById('btnNow');
  var btnFwd=document.getElementById('btnFwd');
  var histLabel=document.getElementById('histLabel');
  if(isHistoricalMode()){
    btnNow.style.display='';btnFwd.style.display='';
    var h=Math.floor(historicalOffsetMin/60),m=historicalOffsetMin%60;
    histLabel.textContent=(h>0?h+'時間':'')+(m>0?m+'分':'')+'前';
  }else{
    btnNow.style.display='none';btnFwd.style.display='none';
    histLabel.textContent='';
  }
  updateAutoUI();
}

window.setTimeRange=function(h){
  timeRangeHours=h;
  ['1','2','3'].forEach(function(x){
    document.getElementById('t'+x+'h').className=parseInt(x)===h?'active':'';
  });
  buildFrames(true);
};

window.stepBack=function(min){
  historicalOffsetMin+=min;
  updateHistoricalUI();
  buildFrames(true);
};

window.stepForward=function(min){
  historicalOffsetMin=Math.max(0,historicalOffsetMin-min);
  updateHistoricalUI();
  buildFrames(true);
};

window.goNow=function(){
  historicalOffsetMin=0;
  pauseAt=0;latestSatTime=null;latestRadarTime=null;
  updateHistoricalUI();
  clearTimeout(autoTimerId);
  buildFrames(true);  /* ビュー位置を維持したまま現在に戻る */
  scheduleAuto();updateAutoUI();
};

window.toggleLegend=function(){
  var panel=document.getElementById('legendPanel');
  var btn=document.getElementById('legendBtn');
  var shown=panel.style.display!=='none';
  panel.style.display=shown?'none':'block';
  btn.className=shown?'':'active';
};

/* ══════════════════════════════════════════════
   アメダス オーバーレイ
   ══════════════════════════════════════════════ */
var amedasOn=true;
var amedasKind='wind';
var amedasStations=null;
var amedasDataCache={};
var amedasCacheKeys=[];
var amedasMarkers=[];
var amedasTimer=null;
var lastAmedasJst='';
var AMEDAS_CACHE_MAX=30;

/* 風向コード(1-16)→矢印回転角（SVG上向き基準 + 270° = 吹先方向） */
var WIND_ROTATE=[0,202.5,225,247.5,270,292.5,315,337.5,0,22.5,45,67.5,90,112.5,135,157.5,180];

/* 青系カラー(暗い青)→白縁取り、それ以外→黒縁取り */
var BLUE_FILL={'rgb(0,32,128)':1,'rgb(0,65,255)':1,'rgb(0,150,255)':1,
  'rgb(33,140,255)':1,'rgb(0,114,154)':1,'rgb(0,75,150)':1,'rgb(1,31,125)':1};
function outlineColor(c){return BLUE_FILL[c]?'#fff':'#000';}

/* カラースケール定義（JMA配色準拠） */
var AMEDAS_SCALES={
  wind:{th:[0,5,10,15,20,25],
    cl:['rgb(242,242,255)','rgb(0,65,255)','rgb(250,245,0)','rgb(255,153,0)','rgb(255,40,0)','rgb(180,0,104)']},
  temp:{th:[-50,-5,0,5,10,15,20,25,30,35],
    cl:['rgb(0,32,128)','rgb(0,65,255)','rgb(0,150,255)','rgb(185,235,255)','rgb(255,255,240)',
        'rgb(255,255,150)','rgb(250,245,0)','rgb(255,153,0)','rgb(255,40,0)','rgb(180,0,104)']},
  precip_10m:{th:[0,1,3,5,10,15,20,30],
    cl:['rgb(242,242,255)','rgb(160,210,255)','rgb(33,140,255)','rgb(0,65,255)',
        'rgb(250,245,0)','rgb(255,153,0)','rgb(255,40,0)','rgb(180,0,104)']},
  precip_1h:{th:[0,1,5,10,20,30,50,80],
    cl:['rgb(242,242,255)','rgb(160,210,255)','rgb(33,140,255)','rgb(0,65,255)',
        'rgb(250,245,0)','rgb(255,153,0)','rgb(255,40,0)','rgb(180,0,104)']},
  precip_3h:{th:[0,20,40,60,80,100,120,150],
    cl:['rgb(242,242,255)','rgb(160,210,255)','rgb(33,140,255)','rgb(0,65,255)',
        'rgb(250,245,0)','rgb(255,153,0)','rgb(255,40,0)','rgb(180,0,104)']},
  precip_24h:{th:[0,50,80,100,150,200,250,300],
    cl:['rgb(242,242,255)','rgb(160,210,255)','rgb(33,140,255)','rgb(0,65,255)',
        'rgb(250,245,0)','rgb(255,153,0)','rgb(255,40,0)','rgb(180,0,104)']},
  humidity:{th:[0,10,20,30,40,50,60,70,80,90,100],
    cl:['rgb(84,6,0)','rgb(118,17,0)','rgb(171,74,1)','rgb(231,135,7)',
        'rgb(255,200,70)','rgb(255,255,240)','rgb(128,248,231)',
        'rgb(31,194,211)','rgb(0,114,154)','rgb(0,75,150)','rgb(1,31,125)']},
  pressure:{th:[800,988,992,996,1000,1004,1008,1012,1016,1020,1024],
    cl:['rgb(84,6,0)','rgb(118,17,0)','rgb(171,74,1)','rgb(231,135,7)',
        'rgb(255,200,70)','rgb(255,255,240)','rgb(128,248,231)',
        'rgb(31,194,211)','rgb(0,114,154)','rgb(0,75,150)','rgb(1,31,125)']},
  snow:{th:[0,1,5,10,15,20,30,50],
    cl:['rgb(242,242,255)','rgb(160,210,255)','rgb(33,140,255)','rgb(0,65,255)',
        'rgb(250,245,0)','rgb(255,153,0)','rgb(255,40,0)','rgb(180,0,104)']}
};
function amedasColor(scaleName,val){
  var s=AMEDAS_SCALES[scaleName]||AMEDAS_SCALES.precip_1h;
  var c=s.cl[0];
  for(var i=0;i<s.th.length;i++){if(val>=s.th[i])c=s.cl[i];}
  return c;
}

/* AMeDAS種別設定 */
var AMEDAS_TYPES={
  wind:{isArrow:true,scale:'wind',
    getDir:function(d){return d.windDirection?d.windDirection[0]:0;},
    getVal:function(d){return d.wind?d.wind[0]:null;},
    fmt:function(v){return v.toFixed(0);}},
  temp:{scale:'temp',
    getVal:function(d){return d.temp?d.temp[0]:null;},
    fmt:function(v){return v.toFixed(1);}},
  dewPoint:{scale:'temp',
    getVal:function(d){
      var t=d.temp?d.temp[0]:null,rh=d.humidity?d.humidity[0]:null;
      if(t==null||rh==null||rh<=0)return null;
      var g=Math.log(rh/100)+17.62*t/(243.12+t);
      return 243.12*g/(17.62-g);
    },
    fmt:function(v){return v.toFixed(1);}},
  humidity:{scale:'humidity',
    getVal:function(d){return d.humidity?d.humidity[0]:null;},
    fmt:function(v){return v.toFixed(0);}},
  normalPressure:{scale:'pressure',
    getVal:function(d){return d.normalPressure?d.normalPressure[0]:null;},
    fmt:function(v){return v.toFixed(0);}},
  precipitation10m:{scale:'precip_10m',
    getVal:function(d){return d.precipitation10m?d.precipitation10m[0]:null;},
    fmt:function(v){return v.toFixed(1);}},
  precipitation1h:{scale:'precip_1h',
    getVal:function(d){return d.precipitation1h?d.precipitation1h[0]:null;},
    fmt:function(v){return v.toFixed(1);}},
  precipitation3h:{scale:'precip_3h',
    getVal:function(d){return d.precipitation3h?d.precipitation3h[0]:null;},
    fmt:function(v){return v.toFixed(1);}},
  precipitation24h:{scale:'precip_24h',
    getVal:function(d){return d.precipitation24h?d.precipitation24h[0]:null;},
    fmt:function(v){return v.toFixed(1);}},
  snow1h:{scale:'snow',
    getVal:function(d){return d.snow1h?d.snow1h[0]:null;},
    fmt:function(v){return v.toFixed(0);}},
  snow6h:{scale:'snow',
    getVal:function(d){return d.snow6h?d.snow6h[0]:null;},
    fmt:function(v){return v.toFixed(0);}},
  snow24h:{scale:'snow',
    getVal:function(d){return d.snow24h?d.snow24h[0]:null;},
    fmt:function(v){return v.toFixed(0);}}
};

/* フレーム時刻(Date) → アメダスURL用JST文字列(10分丸め) */
function fmtJst(d){
  var t=d.getTime()+9*3600*1000;
  t=t-(t%(10*60*1000));
  var j=new Date(t);
  return ''+j.getUTCFullYear()+pad2(j.getUTCMonth()+1)+pad2(j.getUTCDate())+
    pad2(j.getUTCHours())+pad2(j.getUTCMinutes())+'00';
}

/* テキストラベルHTML（青系→白縁取り、それ以外→黒縁取り） */
function styledText(txt,color){
  var oc=outlineColor(color);
  var sh='-1px 0 '+oc+',0 1px '+oc+',1px 0 '+oc+',0 -1px '+oc+
         ',-1px -1px 0 '+oc+',1px -1px 0 '+oc+',-1px 1px 0 '+oc+',1px 1px 0 '+oc;
  return '<div style="font-size:13px;font-weight:bold;color:'+color+
    ';text-shadow:'+sh+';white-space:nowrap;line-height:1.1">'+txt+'</div>';
}
/* アメダスリンク付きラベル: ホバーで地点名、ダブルクリックで気象庁観測ページを開く */
function amedasLink(inner,stationCode,stationName){
  var url='https://www.jma.go.jp/bosai/amedas/#area_type=offices&amdno='+stationCode;
  return '<span ondblclick="window.open(\\''+url+'\\',\\'_blank\\')" title="'+stationName+'"'+
    ' style="text-decoration:none;cursor:pointer;display:inline-block">'+inner+'</span>';
}

function clearAmedasMarkers(){
  for(var i=0;i<amedasMarkers.length;i++) map.removeLayer(amedasMarkers[i]);
  amedasMarkers=[];
}

function renderAmedas(data){
  clearAmedasMarkers();
  if(!amedasStations||!data) return;
  var z=map.getZoom();
  if(z<6){document.getElementById('amedasStatus').textContent='ズーム6以上で表示';return;}
  document.getElementById('amedasStatus').textContent='';
  var b=map.getBounds(),sw=b.getSouthWest(),ne=b.getNorthEast();
  var cfg=AMEDAS_TYPES[amedasKind];
  if(!cfg) return;

  /* ズームアウト時の間引き: 湿度観測局を優先してセルごとに1点 */
  var THIN={6:1.0,7:0.5,8:0.2};
  var gridDeg=THIN[z]||0;
  var selectedCodes=null;
  if(gridDeg>0){
    var cellBest={};
    for(var c0 in data){
      var s0=amedasStations[c0];
      if(!s0) continue;
      var la0=s0.lat[0]+s0.lat[1]/60,lo0=s0.lon[0]+s0.lon[1]/60;
      if(la0<sw.lat-0.1||la0>ne.lat+0.1||lo0<sw.lng-0.1||lo0>ne.lng+0.1) continue;
      var ck=Math.floor(la0/gridDeg)+'_'+Math.floor(lo0/gridDeg);
      var hasH=!!(data[c0].humidity);
      if(!cellBest[ck]||(!cellBest[ck].h&&hasH)) cellBest[ck]={code:c0,h:hasH};
    }
    selectedCodes={};
    for(var ck2 in cellBest) selectedCodes[cellBest[ck2].code]=1;
  }

  for(var code in data){
    var st=amedasStations[code];
    if(!st) continue;
    var lat=st.lat[0]+st.lat[1]/60;
    var lon=st.lon[0]+st.lon[1]/60;
    if(lat<sw.lat-0.1||lat>ne.lat+0.1||lon<sw.lng-0.1||lon>ne.lng+0.1) continue;
    if(selectedCodes&&!selectedCodes[code]) continue;
    var d=data[code];
    var html='',ax=0,ay=0;
    var stName=(st.kjName||'')+(st.knName?'('+st.knName+')':'');

    if(cfg.isArrow){
      /* 矢羽（風向風速） */
      var spd=cfg.getVal(d);
      var dir=cfg.getDir(d);
      if(spd===null||spd===undefined) continue;
      var c=amedasColor(cfg.scale,spd);
      var arrowStroke=BLUE_FILL[c]?'rgba(255,255,255,0.9)':'rgba(0,0,0,0.85)';
      var textOc=outlineColor(c);
      var textSh='-1px 0 '+textOc+',0 1px '+textOc+',1px 0 '+textOc+',0 -1px '+textOc;
      if(dir>0&&dir<=16){
        var rot=WIND_ROTATE[dir];
        var inner='<div style="text-align:center">'+
          '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="28" viewBox="0 0 12 20"'+
          ' style="transform-origin:center;transform:rotate('+rot+'deg);display:block;margin:auto">'+
          '<polygon points="6,0 0,20 6,15 12,20" stroke="'+arrowStroke+'" stroke-width="1.5" fill="'+c+'"/></svg>'+
          '<div style="font-size:13px;font-weight:bold;color:'+c+';text-shadow:'+textSh+';line-height:1">'+spd.toFixed(0)+'</div>'+
          '</div>';
        html=amedasLink(inner,code,stName);
        ax=9;ay=14;
      }else{
        /* 静穏 */
        var inner='<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10">'+
          '<circle cx="5" cy="5" r="4" stroke="rgba(0,0,0,0.7)" stroke-width="1" fill="rgb(160,210,255)"/></svg>';
        html=amedasLink(inner,code,stName);
        ax=5;ay=5;
      }
    }else{
      /* 数値ラベル */
      var val=cfg.getVal(d);
      if(val===null||val===undefined) continue;
      var c=amedasColor(cfg.scale,val);
      html=amedasLink(styledText(cfg.fmt(val),c),code,stName);
      ax=14;ay=7;
    }
    if(!html) continue;
    var icon=L.divIcon({html:html,className:'',iconSize:[0,0],iconAnchor:[ax,ay]});
    var mk=L.marker([lat,lon],{icon:icon,keyboard:false});
    mk.addTo(map);
    amedasMarkers.push(mk);
  }
}

function scheduleAmedasUpdate(delay){
  clearTimeout(amedasTimer);
  amedasTimer=setTimeout(doUpdateAmedas,delay||500);
}

function doUpdateAmedas(){
  var idx=currentIdx>=0?currentIdx:satFrames.length-1;
  if(idx<0||!satFrames[idx]) return;
  var jst=fmtJst(satFrames[idx].time);
  lastAmedasJst=jst;
  var elS=document.getElementById('amedasStatus');
  elS.textContent='取得中…';

  function afterStations(){
    if(amedasDataCache[jst]){renderAmedas(amedasDataCache[jst]);return;}
    var xhr=new XMLHttpRequest();
    xhr.open('GET','https://www.jma.go.jp/bosai/amedas/data/map/'+jst+'.json');
    xhr.onload=function(){
      if(xhr.status===200){
        var data=JSON.parse(xhr.responseText);
        if(amedasCacheKeys.length>=AMEDAS_CACHE_MAX){
          delete amedasDataCache[amedasCacheKeys.shift()];
        }
        amedasDataCache[jst]=data;
        amedasCacheKeys.push(jst);
        renderAmedas(data);
      }else{elS.textContent='取得失敗';}
    };
    xhr.onerror=function(){elS.textContent='取得失敗';};
    xhr.send();
  }

  if(amedasStations){afterStations();return;}
  var xhr2=new XMLHttpRequest();
  xhr2.open('GET','https://www.jma.go.jp/bosai/amedas/const/amedastable.json');
  xhr2.onload=function(){
    if(xhr2.status===200){amedasStations=JSON.parse(xhr2.responseText);afterStations();}
    else{elS.textContent='局情報取得失敗';}
  };
  xhr2.onerror=function(){elS.textContent='局情報取得失敗';};
  xhr2.send();
}

window.toggleAmedas=function(){
  amedasOn=!amedasOn;
  document.getElementById('amedasBtn').className=amedasOn?'active':'';
  if(amedasOn){scheduleAmedasUpdate();}
  else{clearAmedasMarkers();document.getElementById('amedasStatus').textContent='';}
};

window.onAmedasKindChange=function(){
  amedasKind=document.getElementById('amedasKind').value;
  if(amedasOn) scheduleAmedasUpdate();
};

window.onPlay=play;
window.onPause=pause;

window.onSpeedChange=function(v){
  speedIdx=parseInt(v,10);
  if(playing){pause();play();}
};

window.onSlider=function(v){
  pause();pauseAt=Date.now();updateAutoUI();
  showFrame(parseInt(v,10));
};

/* ── 初期化: 前回の表示状態を復元 ── */
(function(){
  var s=loadState();
  if(s){
    /* area/band を UI に反映（rebuild なし） */
    if(s.area)setArea(s.area,true);
    if(s.band){
      currentBand=s.band;
      ['ETC','B13','B03','B08'].forEach(function(x){
        document.getElementById('b'+x).className=x===s.band?'active':'';
      });
    }
    /* 前回の位置・ズームを復元 */
    if(s.lat!=null&&s.zoom!=null)map.setView([s.lat,s.lng],s.zoom);
  }
  buildFrames(true);  /* 常に現在のビューを維持して構築 */
  updateAutoUI();
  scheduleAuto();
  /* アメダスデフォルトON: ボタンをアクティブに */
  document.getElementById('amedasBtn').className='active';

  /* ── opacity安全網: 2秒ごとに現フレームのopacityが0になっていたら修正 ── */
  setInterval(function(){
    if(!isLoading && currentIdx>=0) reapplyOpacity();
  }, 2000);
})();

})();
</script>
</body>
</html>`;
