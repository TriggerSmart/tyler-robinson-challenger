const map=L.map('routeMap',{preferCanvas:true}).setView([38.55,-112.7],7);
const base=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);
const satellite=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Tiles © Esri'});

const routes={};
const routeLayers=L.layerGroup().addTo(map);
const anchorLayer=L.layerGroup().addTo(map);
const flockLayer=L.layerGroup().addTo(map);
const otherLayer=L.layerGroup().addTo(map);
const nearLayer=L.layerGroup().addTo(map);
let cameras=[];

const C={morning:'#ff4b4b',quick:'#ff9a3d',return:'#66b3ff',reported:'#c47cff'};
const anchors={
 stGeorge:{name:'St. George residence identified in warrant',lat:37.051045,lon:-113.554703,address:'3419 S River Rd, St George, UT 84790'},
 uvu:{name:'Utah Valley University',lat:40.2783,lon:-111.7174,address:'800 W University Pkwy, Orem, UT 84058'},
 mountain:{name:'Mountain Shadows Shopping Center',lat:40.2960646,lon:-111.6949254,address:'Mountain Shadows Shopping Center, Orem, UT'},
 quick:{name:'Quick Quack — 855 N State St',lat:40.3115,lon:-111.6948,address:'855 N State St, Orem, UT 84057'},
 uvuNorth:{name:'UVU north / rifle-recovery neighborhood area',lat:40.2838,lon:-111.7208,address:'Campus Drive near 800 W, Orem, UT'},
 midnight:{name:'Campus Drive / 800 South Orem area',lat:40.2795,lon:-111.7218,address:'Campus Drive and 800 South, Orem, UT'},
 panguitch:{name:"Cowboy's Smokehouse",lat:37.8228,lon:-112.4352,address:'80 N Main St, Panguitch, UT 84759'},
 cedar:{name:'Maverik — Cedar City',lat:37.6568,lon:-113.0614,address:'1405 S Main St, Cedar City, UT 84720'}
};

function markerIcon(text,color){return L.divIcon({className:'',html:`<div class="route-label" style="border-color:${color}">${text}</div>`,iconAnchor:[0,0]});}
Object.entries(anchors).forEach(([k,a])=>{L.marker([a.lat,a.lon],{icon:markerIcon(a.name,k==='panguitch'||k==='cedar'?C.reported:'#60758d')}).bindPopup(`<b>${a.name}</b><br>${a.address||''}`).addTo(anchorLayer);});

async function geocodeAnchor(a){try{const u=`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(a.address)}`;const r=await fetch(u,{headers:{'Accept':'application/json'}});if(!r.ok)return a;const j=await r.json();if(j[0]){a.lat=+j[0].lat;a.lon=+j[0].lon;}return a;}catch(e){return a;}}

async function osrmRoute(points){const coords=points.map(p=>`${p.lon},${p.lat}`).join(';');const u=`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`;
 const r=await fetch(u);if(!r.ok)throw new Error('routing failed');const j=await r.json();if(!j.routes?.[0])throw new Error('no route');return j.routes[0].geometry;}

function fallbackLine(points){return {type:'LineString',coordinates:points.map(p=>[p.lon,p.lat])};}
async function buildRoute(id,label,points,color,dash){let geom;try{geom=await osrmRoute(points);}catch(e){geom=fallbackLine(points);}const layer=L.geoJSON(geom,{style:{color,weight:5,opacity:.92,dashArray:dash||null}}).bindPopup(`<b>${label}</b>`);routes[id]={id,label,geom,layer,color};routeLayers.addLayer(layer);return layer;}

async function initRoutes(){
 await Promise.all([geocodeAnchor(anchors.quick),geocodeAnchor(anchors.panguitch),geocodeAnchor(anchors.cedar)]);
 await buildRoute('morning','Morning court-described travel: St. George → UVU',[anchors.stGeorge,anchors.uvu],C.morning);
 await buildRoute('quick','12:46 stored Google Maps route: Mountain Shadows → Quick Quack',[anchors.mountain,anchors.quick],C.quick);
 await buildRoute('return','1:33 stored Google Maps route: UVU-area → St. George',[anchors.uvuNorth,anchors.stGeorge],C.return);
 await buildRoute('reported','Reported-location sequence: Quick Quack → Panguitch → Orem midnight area → Cedar City → St. George',[anchors.quick,anchors.panguitch,anchors.midnight,anchors.cedar,anchors.stGeorge],C.reported,'9 8');
 routes.reported.layer.remove();
 map.fitBounds(routes.morning.layer.getBounds().pad(.08));
 refreshNear();
}

function currentDisplayedRouteFeatures(){return Object.values(routes).filter(r=>map.hasLayer(r.layer)).map(r=>turf.feature(r.geom));}
function distanceToDisplayedRoutes(lat,lon){const p=turf.point([lon,lat]);let min=Infinity;for(const f of currentDisplayedRouteFeatures()){const d=turf.pointToLineDistance(p,f,{units:'meters'});if(d<min)min=d;}return min;}

function cameraColor(cam){return (cam.tags?.manufacturer||'').toLowerCase().includes('flock')?'#ff3d3d':'#ffb343';}
function cameraPopup(cam,dist){const t=cam.tags||{};return `<b>${t.manufacturer||'ALPR camera'}</b><br>OSM node ${cam.id}<br>${t.operator?`Operator: ${t.operator}<br>`:''}${t.direction?`Facing: ${t.direction}°<br>`:''}${t.model?`Model: ${t.model}<br>`:''}${Number.isFinite(dist)?`Distance to displayed route: ${Math.round(dist)} m<br>`:''}<span style="color:#9faebe">Current community-mapped location; not a 2025 installation record.</span>`;}
function drawCameras(){flockLayer.clearLayers();otherLayer.clearLayers();nearLayer.clearLayers();let near=0;for(const cam of cameras){const dist=distanceToDisplayedRoutes(cam.lat,cam.lon);const isNear=dist<=500;if(isNear)near++;const color=cameraColor(cam);const circ=L.circleMarker([cam.lat,cam.lon],{radius:isNear?5:3,color:color,weight:isNear?2:1,fillColor:color,fillOpacity:isNear?.95:.65,opacity:.9}).bindPopup(cameraPopup(cam,dist));
 const isFlock=(cam.tags?.manufacturer||'').toLowerCase().includes('flock');(isFlock?flockLayer:otherLayer).addLayer(circ);
 if(isNear){L.circleMarker([cam.lat,cam.lon],{radius:9,color:'#ffe05c',weight:2,fill:false,opacity:.78,interactive:false}).addTo(nearLayer);} }
 document.getElementById('loadedCount').textContent=cameras.length.toLocaleString();document.getElementById('nearCount').textContent=near.toLocaleString();applyCameraToggles();}

function applyCameraToggles(){if(document.getElementById('toggleFlock').checked){if(!map.hasLayer(flockLayer))flockLayer.addTo(map);}else map.removeLayer(flockLayer);if(document.getElementById('toggleOther').checked){if(!map.hasLayer(otherLayer))otherLayer.addTo(map);}else map.removeLayer(otherLayer);if(document.getElementById('toggleNear').checked){if(!map.hasLayer(nearLayer))nearLayer.addTo(map);}else map.removeLayer(nearLayer);}
function refreshNear(){if(cameras.length)drawCameras();}

async function loadCameras(){const status=document.getElementById('cameraStatus');status.className='status-pill';status.textContent='Loading current Utah ALPR data…';const q='[out:json][timeout:90];node["man_made"="surveillance"]["surveillance:type"="ALPR"](36.95,-114.10,42.05,-109.00);out body;';const endpoints=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];let lastErr;for(const ep of endpoints){try{const r=await fetch(ep,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:'data='+encodeURIComponent(q)});if(!r.ok)throw new Error(`HTTP ${r.status}`);const j=await r.json();cameras=(j.elements||[]).filter(x=>x.type==='node'&&Number.isFinite(x.lat)&&Number.isFinite(x.lon));status.className='status-pill good';status.textContent=`Loaded ${cameras.length.toLocaleString()} current OSM/DeFlock ALPR points`;drawCameras();return;}catch(e){lastErr=e;}}
 status.className='status-pill warn';status.textContent='Live camera query failed; source links remain available below.';console.error(lastErr);}

function toggleRoute(id,checked){const r=routes[id];if(!r)return;if(checked){if(!map.hasLayer(r.layer))r.layer.addTo(map);}else map.removeLayer(r.layer);refreshNear();}
['Morning','Quick','Return','Reported'].forEach(n=>document.getElementById('toggle'+n).addEventListener('change',e=>toggleRoute(n.toLowerCase(),e.target.checked)));
['Flock','Other','Near'].forEach(n=>document.getElementById('toggle'+n).addEventListener('change',applyCameraToggles));
document.getElementById('reloadCameras').addEventListener('click',loadCameras);

function escXml(s){return String(s??'').replace(/[<>&'\"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','\"':'&quot;'}[c]));}
function routeKml(r){const coords=r.geom.coordinates.map(c=>`${c[0]},${c[1]},0`).join(' ');return `<Placemark><name>${escXml(r.label)}</name><Style><LineStyle><color>ff${r.color.slice(5,7)}${r.color.slice(3,5)}${r.color.slice(1,3)}</color><width>4</width></LineStyle></Style><LineString><tessellate>1</tessellate><coordinates>${coords}</coordinates></LineString></Placemark>`;}
function cameraKml(c){const t=c.tags||{};return `<Placemark><name>${escXml(t.manufacturer||'ALPR camera')}</name><description>${escXml(`OSM ${c.id}${t.operator?' | '+t.operator:''}${t.direction?' | facing '+t.direction+'°':''} | current community-mapped camera`)}</description><Point><coordinates>${c.lon},${c.lat},0</coordinates></Point></Placemark>`;}
function download(name,text,type){const b=new Blob([text],{type});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1200);}
document.getElementById('downloadKml').addEventListener('click',()=>{const rs=Object.values(routes).map(routeKml).join('');const cs=cameras.map(cameraKml).join('');const k=`<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>Challenger route and current Utah ALPR cameras</name>${rs}${cs}</Document></kml>`;download('challenger-route-and-current-alpr.kml',k,'application/vnd.google-earth.kml+xml');});
document.getElementById('downloadCsv').addEventListener('click',()=>{let s='name,latitude,longitude,manufacturer,operator,direction,osm_id\n';for(const c of cameras){const t=c.tags||{};const vals=[t.manufacturer||'ALPR',c.lat,c.lon,t.manufacturer||'',t.operator||'',t.direction||'',c.id].map(v=>'"'+String(v).replaceAll('"','""')+'"');s+=vals.join(',')+'\n';}download('current-utah-alpr-cameras.csv',s,'text/csv');});

L.control.layers({'OpenStreetMap':base,'Satellite imagery':satellite},{'Route anchors':anchorLayer,'Route lines':routeLayers,'Flock Safety ALPR':flockLayer,'Other ALPR':otherLayer,'Near-route highlight':nearLayer},{collapsed:true}).addTo(map);

initRoutes().then(loadCameras);
