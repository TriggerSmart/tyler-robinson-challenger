const modal=document.getElementById('viewerModal');
const osdEl=document.getElementById('osdViewer');
const fb=document.getElementById('fallbackViewer');
const fbImg=document.getElementById('fallbackImg');
const titleEl=document.getElementById('viewerTitle');
const blurSlider=document.getElementById('blurSlider'),blurValue=document.getElementById('blurValue');
const brightnessSlider=document.getElementById('brightnessSlider'),brightnessValue=document.getElementById('brightnessValue');
const contrastSlider=document.getElementById('contrastSlider'),contrastValue=document.getElementById('contrastValue');
const sharpenSlider=document.getElementById('sharpenSlider'),sharpenValue=document.getElementById('sharpenValue');
const sharpenMatrix=document.getElementById('gallerySharpenMatrix');
let viewer=null,currentIndex=-1,items=[];let fbScale=1,fbX=0,fbY=0,drag=false,lastX=0,lastY=0;
let adjustments={blur:0,brightness:100,contrast:100,sharpen:0};
function initItems(){items=[...document.querySelectorAll('.card[data-src]')];items.forEach((el,i)=>el.addEventListener('click',()=>openImage(i)));}
function updateSharpenKernel(){const s=Number(adjustments.sharpen)||0;if(!sharpenMatrix)return;const center=1+(4*s);sharpenMatrix.setAttribute('kernelMatrix',`0 ${-s} 0 ${-s} ${center} ${-s} 0 ${-s} 0`);}
function filterString(){return `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) blur(${adjustments.blur}px)${adjustments.sharpen>0?' url(#gallerySharpenFilter)':''}`;}
function updateLabels(){blurValue.textContent=`${Number(adjustments.blur).toFixed(adjustments.blur%1?2:0)} px`;brightnessValue.textContent=`${Math.round(adjustments.brightness)}%`;contrastValue.textContent=`${Math.round(adjustments.contrast)}%`;sharpenValue.textContent=Number(adjustments.sharpen).toFixed(2);}
function applyAdjustments(){updateSharpenKernel();updateLabels();const f=filterString();const osdCanvas=osdEl.querySelector('.openseadragon-canvas');if(osdCanvas)osdCanvas.style.filter=f;osdEl.querySelectorAll('.openseadragon-canvas canvas,.openseadragon-canvas img').forEach(el=>el.style.filter=f);fbImg.style.filter=f;}
function setAdjustment(name,value){adjustments[name]=Number(value);applyAdjustments();}
function resetImageAdjustments(){adjustments={blur:0,brightness:100,contrast:100,sharpen:0};blurSlider.value='0';brightnessSlider.value='100';contrastSlider.value='100';sharpenSlider.value='0';applyAdjustments();}
function openImage(i){currentIndex=i;const el=items[i],src=el.dataset.src,title=el.dataset.title||'';titleEl.textContent=title;modal.classList.add('open');document.body.style.overflow='hidden';resetImageAdjustments();if(window.OpenSeadragon){fb.style.display='none';osdEl.style.display='block';if(viewer){viewer.destroy();viewer=null;}viewer=OpenSeadragon({id:'osdViewer',showNavigationControl:false,showHomeControl:false,showFullPageControl:false,showRotationControl:false,showSequenceControl:false,gestureSettingsMouse:{clickToZoom:false,dblClickToZoom:true,scrollToZoom:true},gestureSettingsTouch:{pinchToZoom:true,flickEnabled:true},maxZoomPixelRatio:16,minZoomImageRatio:.6,visibilityRatio:.05,constrainDuringPan:false,animationTime:.25,blendTime:.05,tileSources:{type:'image',url:src,buildPyramid:true}});viewer.addHandler('open',()=>setTimeout(applyAdjustments,0));viewer.addHandler('animation',applyAdjustments);viewer.addHandler('update-viewport',applyAdjustments);}else{osdEl.style.display='none';fb.style.display='block';resetFallback();fbImg.src=src;setTimeout(applyAdjustments,0);}}
function closeViewer(){modal.classList.remove('open');document.body.style.overflow='';if(viewer){viewer.destroy();viewer=null;}}
function zoomBy(f){if(viewer){viewer.viewport.zoomBy(f);viewer.viewport.applyConstraints();}else{fbScale=Math.max(.1,Math.min(64,fbScale*f));applyFb();}}
function resetViewer(){if(viewer)viewer.viewport.goHome(true);else resetFallback();}
function rotateViewer(){if(viewer)viewer.viewport.setRotation((viewer.viewport.getRotation()+90)%360);else{fbImg.dataset.rot=((+fbImg.dataset.rot||0)+90)%360;applyFb();}}
function fullViewer(){const el=document.getElementById('viewerModal');if(!document.fullscreenElement)el.requestFullscreen?.();else document.exitFullscreen?.();}
function nav(delta){if(!items.length)return;openImage((currentIndex+delta+items.length)%items.length);}
function resetFallback(){fbScale=1;fbX=0;fbY=0;fbImg.dataset.rot='0';fbImg.onload=()=>{const r=fb.getBoundingClientRect();fbScale=Math.min(r.width/fbImg.naturalWidth,r.height/fbImg.naturalHeight)*.94;applyFb();applyAdjustments();};applyFb();applyAdjustments();}
function applyFb(){const rot=+fbImg.dataset.rot||0;fbImg.style.transform=`translate(-50%,-50%) translate(${fbX}px,${fbY}px) scale(${fbScale}) rotate(${rot}deg)`;}
fb.addEventListener('wheel',e=>{e.preventDefault();zoomBy(e.deltaY<0?1.25:.8);},{passive:false});fb.addEventListener('pointerdown',e=>{drag=true;lastX=e.clientX;lastY=e.clientY;fb.setPointerCapture(e.pointerId);fb.style.cursor='grabbing'});fb.addEventListener('pointermove',e=>{if(!drag)return;fbX+=e.clientX-lastX;fbY+=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;applyFb();});fb.addEventListener('pointerup',()=>{drag=false;fb.style.cursor='grab'});
blurSlider?.addEventListener('input',e=>setAdjustment('blur',e.target.value));brightnessSlider?.addEventListener('input',e=>setAdjustment('brightness',e.target.value));contrastSlider?.addEventListener('input',e=>setAdjustment('contrast',e.target.value));sharpenSlider?.addEventListener('input',e=>setAdjustment('sharpen',e.target.value));
document.addEventListener('keydown',e=>{if(!modal.classList.contains('open'))return;if(e.key==='Escape')closeViewer();if(e.key==='ArrowRight')nav(1);if(e.key==='ArrowLeft')nav(-1);if(e.key==='+'||e.key==='=')zoomBy(1.4);if(e.key==='-')zoomBy(.72);if(e.key==='0')resetViewer();});document.addEventListener('DOMContentLoaded',initItems);