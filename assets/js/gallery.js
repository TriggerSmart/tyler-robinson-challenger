
const modal=document.getElementById('viewerModal');
const osdEl=document.getElementById('osdViewer');
const fb=document.getElementById('fallbackViewer');
const fbImg=document.getElementById('fallbackImg');
const titleEl=document.getElementById('viewerTitle');
const blurSlider=document.getElementById('blurSlider');
const blurValue=document.getElementById('blurValue');
let currentBlur=0;
let viewer=null,currentIndex=-1;let items=[];
let fbScale=1,fbX=0,fbY=0,drag=false,lastX=0,lastY=0;

function applyBlur(){
  const v = Number(currentBlur)||0;
  if(blurValue) blurValue.textContent = `${v.toFixed(v % 1 ? 2 : 0).replace(/\.00$/, '')} px`;
  const osdCanvas = osdEl.querySelector('.openseadragon-canvas');
  if(osdCanvas){ osdCanvas.style.filter = `blur(${v}px)`; }
  osdEl.querySelectorAll('.openseadragon-canvas canvas, .openseadragon-canvas img').forEach(el=>{ el.style.filter = `blur(${v}px)`; });
  if(fbImg){ fbImg.style.filter = `blur(${v}px)`; }
}
function setBlur(v){
  currentBlur = Math.max(0, Math.min(20, Number(v)||0));
  if(blurSlider) blurSlider.value = String(currentBlur);
  applyBlur();
}
function resetBlur(){ setBlur(0); }

function initItems(){items=[...document.querySelectorAll('.card[data-src]')];items.forEach((el,i)=>el.addEventListener('click',()=>openImage(i)));}
function openImage(i){currentIndex=i;const el=items[i];const src=el.dataset.src;const title=el.dataset.title||'';titleEl.textContent=title;modal.classList.add('open');document.body.style.overflow='hidden';
 resetBlur();
 if(window.OpenSeadragon){fb.style.display='none';osdEl.style.display='block';if(viewer){viewer.destroy();viewer=null;} viewer=OpenSeadragon({id:'osdViewer',showNavigationControl:false,showHomeControl:false,showFullPageControl:false,showRotationControl:false,showSequenceControl:false,gestureSettingsMouse:{clickToZoom:false,dblClickToZoom:true,scrollToZoom:true},gestureSettingsTouch:{pinchToZoom:true,flickEnabled:true},maxZoomPixelRatio:16,minZoomImageRatio:.6,visibilityRatio:.05,constrainDuringPan:false,animationTime:.25,blendTime:.05,tileSources:{type:'image',url:src,buildPyramid:true}}); viewer.addHandler('open',()=>{setTimeout(applyBlur,0);}); viewer.addHandler('animation',applyBlur); viewer.addHandler('update-viewport',applyBlur);
 } else {osdEl.style.display='none';fb.style.display='block';resetFallback();fbImg.src=src; setTimeout(applyBlur,0);}
}
function closeViewer(){modal.classList.remove('open');document.body.style.overflow='';if(viewer){viewer.destroy();viewer=null;}}
function zoomBy(f){if(viewer){viewer.viewport.zoomBy(f);viewer.viewport.applyConstraints();}else{fbScale=Math.max(.1,Math.min(64,fbScale*f));applyFb();}}
function resetViewer(){if(viewer)viewer.viewport.goHome(true);else resetFallback();}
function rotateViewer(){if(viewer)viewer.viewport.setRotation((viewer.viewport.getRotation()+90)%360);else{fbImg.dataset.rot=((+fbImg.dataset.rot||0)+90)%360;applyFb();}}
function fullViewer(){const el=document.getElementById('viewerModal');if(!document.fullscreenElement)el.requestFullscreen?.();else document.exitFullscreen?.();}
function nav(delta){if(!items.length)return;let i=(currentIndex+delta+items.length)%items.length;openImage(i);}
function resetFallback(){fbScale=1;fbX=0;fbY=0;fbImg.dataset.rot='0';fbImg.onload=()=>{const r=fb.getBoundingClientRect();const s=Math.min(r.width/fbImg.naturalWidth,r.height/fbImg.naturalHeight)*.94;fbScale=s;applyFb();applyBlur();};applyFb();applyBlur();}
function applyFb(){const rot=+fbImg.dataset.rot||0;fbImg.style.transform=`translate(-50%,-50%) translate(${fbX}px,${fbY}px) scale(${fbScale}) rotate(${rot}deg)`;}
fb.addEventListener('wheel',e=>{e.preventDefault();zoomBy(e.deltaY<0?1.25:.8);},{passive:false});
fb.addEventListener('pointerdown',e=>{drag=true;lastX=e.clientX;lastY=e.clientY;fb.setPointerCapture(e.pointerId);fb.style.cursor='grabbing'});fb.addEventListener('pointermove',e=>{if(!drag)return;fbX+=e.clientX-lastX;fbY+=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;applyFb();});fb.addEventListener('pointerup',()=>{drag=false;fb.style.cursor='grab'});
document.addEventListener('keydown',e=>{if(!modal.classList.contains('open'))return;if(e.key==='Escape')closeViewer();if(e.key==='ArrowRight')nav(1);if(e.key==='ArrowLeft')nav(-1);if(e.key==='+'||e.key==='=')zoomBy(1.4);if(e.key==='-')zoomBy(.72);if(e.key==='0')resetViewer();});
document.addEventListener('DOMContentLoaded',initItems);

if(blurSlider){blurSlider.addEventListener('input',e=>setBlur(e.target.value));}
