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
#controls{padding:4px 6px;background:#16213e;flex-shrink:0;display:flex;flex-direction:column;gap:4px}
.ctrl-row{display:flex;align-items:center;gap:4px;flex-wrap:wrap}
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

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
(function(){
'use strict';

/* ── 定数 ── */
var FRAME_COUNT    = 12;
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
  fd:{nativeZoom:5,interval:10*60, center:[26.2,127.7],zoom:5}
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

/* ── 海岸線（Natural Earth 50m）をCDNから非同期ロード ── */
fetch('https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_50m_coastline.geojson')
  .then(function(r){return r.json();})
  .then(function(data){
    L.geoJSON(data,{
      pane:'coastPane',
      style:{color:'#00cc44',weight:1.2,opacity:0.85,fill:false}
    }).addTo(map);
  })
  .catch(function(){});  /* オフライン時はサイレント失敗 */

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
    minZoom:4,maxZoom:12,opacity:0,
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
    showFrame((currentIdx+1)%satFrames.length);
    timerId=setTimeout(tick,SPEEDS[speedIdx]);
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
});
map.on('moveend',function(){saveState();setTimeout(reapplyOpacity,100);});

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
  if(!preserveView)map.setView(params.center,params.zoom);

  elSlider.min='0';elSlider.max='0';elSlider.value='0';
  elLabel.textContent='0/0';

  radarFrames=[];
  var bt=getBaseTime(LEAD_SEC,RADAR_INT);
  latestRadarTime=bt;
  for(var j=FRAME_COUNT-1;j>=0;j--)
    radarFrames.push({time:new Date(bt.getTime()-j*RADAR_INT*1000)});

  var satBt=getBaseTime(LEAD_SEC,params.interval);
  latestSatTime=satBt;
  var cands=[];
  for(var i=FRAME_COUNT-1;i>=0;i--)
    cands.push({time:new Date(satBt.getTime()-i*params.interval*1000),
                area:currentArea,nativeZoom:params.nativeZoom});

  setLoadUI(0,cands.length,'衛星確認中 0/'+cands.length);

  probe(currentArea,currentBand,cands,function(valid){
    satFrames=valid;
    if(!satFrames.length){
      isLoading=false;elStatus.textContent='有効な衛星フレームなし';return;
    }
    elStatus.textContent='有効 '+satFrames.length+'/'+cands.length+'  読込中…';
    loadAll(currentBand,currentArea);
  });
}

/* ── 自動更新ループ ── */
function autoLoop(){
  updateAutoUI();
  if(pauseAt>0&&Date.now()-pauseAt<PAUSE_DURATION){scheduleAuto();return;}
  if(pauseAt>0){pauseAt=0;updateAutoUI();}
  if(isLoading){scheduleAuto();return;}

  var params=AREA_PARAMS[currentArea];
  var newSat=getBaseTime(LEAD_SEC,params.interval);
  var satChanged=!latestSatTime||newSat.getTime()!==latestSatTime.getTime();
  var newR=getBaseTime(LEAD_SEC,RADAR_INT);
  var radarChanged=!latestRadarTime||newR.getTime()!==latestRadarTime.getTime();
  if(satChanged||radarChanged)buildFrames(true);
  scheduleAuto();
}
function scheduleAuto(){clearTimeout(autoTimerId);autoTimerId=setTimeout(autoLoop,AUTO_INTERVAL);}

/* ── UI操作 ── */
window.setArea=function(a,noRebuild){
  currentArea=a;
  document.getElementById('aJP').className=a==='jp'?'active':'';
  document.getElementById('aFD').className=a==='fd'?'active':'';
  document.getElementById('mBoth').disabled=false;
  document.getElementById('mRadar').disabled=false;
  latestSatTime=null;latestRadarTime=null;
  if(!noRebuild){saveState();buildFrames(true);}  /* ビュー位置を維持したまま再構築 */
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
  pauseAt=0;latestSatTime=null;latestRadarTime=null;
  clearTimeout(autoTimerId);
  buildFrames(false);scheduleAuto();updateAutoUI();
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

  /* ── opacity安全網: 2秒ごとに現フレームのopacityが0になっていたら修正 ── */
  setInterval(function(){
    if(!isLoading && currentIdx>=0) reapplyOpacity();
  }, 2000);
})();

})();
</script>
</body>
</html>`;
