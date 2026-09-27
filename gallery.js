
(()=>{
'use strict';
const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
const byId=id=>document.getElementById(id);
const modal=byId('viewerModal');
const workspace=byId('compareWorkspace');
const titleEl=byId('viewerTitle');
const tray=byId('compareTray');
const trayText=byId('compareTrayText');
if(!modal||!workspace){console.error('Gallery viewer markup is incomplete.');return;}
let items=[];
let comparePick=null;
let replaceSide=null;
let mode='left';
const makeState=side=>({side,index:null,viewer:null,adjust:{blur:0,brightness:100,contrast:100,sharpen:0},fb:{scale:1,x:0,y:0,drag:false,lastX:0,lastY:0,rot:0}});
const panes={left:makeState('left'),right:makeState('right')};
const cardTitle=i=>items[i]?.dataset.title||'Image';
function setTray(text){if(trayText)trayText.textContent=text;if(tray)tray.classList.add('show');}
function hideTray(){if(tray)tray.classList.remove('show');comparePick=null;replaceSide=null;}
function safeText(selector,text){const el=q(selector);if(el)el.textContent=text;}

function initItems(){
 items=qa('.card[data-src]');
 items.forEach((el,i)=>{
   el.style.cursor='pointer';
   el.addEventListener('click',()=>openSingle(i));
   const cap=q('.cap',el);
   if(cap&&!q('.cardActions',cap)){
     const row=document.createElement('div');row.className='cardActions';
     const open=document.createElement('button');open.type='button';open.className='miniBtn';open.textContent='Open';
     open.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openSingle(i);});
     const cmp=document.createElement('button');cmp.type='button';cmp.className='miniBtn compare';cmp.textContent='Compare';
     cmp.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();chooseForCompare(i);});
     row.append(open,cmp);cap.append(row);
   }
 });
}
function chooseForCompare(i){
 if(replaceSide){const side=replaceSide;replaceSide=null;if(tray)tray.classList.remove('show');setPaneImage(side,i,true);openModal();setMode(panes.left.index!=null&&panes.right.index!=null?'split':side);return;}
 if(comparePick===null){comparePick=i;setTray(`A: ${cardTitle(i)} — choose Compare on a second image.`);return;}
 if(comparePick===i){setTray(`A: ${cardTitle(i)} — choose a different image for B.`);return;}
 const first=comparePick;comparePick=null;if(tray)tray.classList.remove('show');setPaneImage('left',first,true);setPaneImage('right',i,true);openModal();setMode('split');
}
function openSingle(i){hideTray();setPaneImage('left',i,true);panes.right.index=null;destroyPaneViewer('right');openModal();setMode('left');}
function openModal(){modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';}
function closeViewer(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.style.overflow='';destroyPaneViewer('left');destroyPaneViewer('right');}
function setMode(next){
 if(next==='split'&&(panes.left.index==null||panes.right.index==null))return;
 if(next==='right'&&panes.right.index==null)return;
 mode=next;workspace.className=`compareWorkspace ${next==='split'?'split-mode':next==='right'?'single-right':'single-left'}`;
 qa('.modeBtn').forEach(b=>b.classList.remove('active'));
 const active=byId(next==='split'?'splitBtn':next==='right'?'singleRightBtn':'singleLeftBtn');if(active)active.classList.add('active');
 if(titleEl)titleEl.textContent=next==='split'?`${cardTitle(panes.left.index)} ↔ ${cardTitle(panes.right.index)}`:cardTitle(panes[next==='right'?'right':'left'].index);
 setTimeout(()=>Object.values(panes).forEach(p=>{try{p.viewer?.viewport?.resize?.();p.viewer?.viewport?.applyConstraints?.();}catch(_){}}),50);
}
function setPaneImage(side,i,reset=true){
 const p=panes[side];if(!items[i])return;p.index=i;
 safeText(`#${side}PaneTitle`,cardTitle(i));
 if(reset)resetAdjustments(side);
 destroyPaneViewer(side);
 const src=items[i].dataset.src,osd=byId(`${side}Osd`),fb=byId(`${side}Fallback`),img=byId(`${side}FallbackImg`);
 if(!osd||!fb||!img)return;
 if(window.OpenSeadragon){
   fb.style.display='none';osd.style.display='block';
   try{
    p.viewer=OpenSeadragon({id:`${side}Osd`,showNavigationControl:false,showHomeControl:false,showFullPageControl:false,showRotationControl:false,showSequenceControl:false,gestureSettingsMouse:{clickToZoom:false,dblClickToZoom:true,scrollToZoom:true},gestureSettingsTouch:{pinchToZoom:true,flickEnabled:true},maxZoomPixelRatio:16,minZoomImageRatio:.6,visibilityRatio:.05,constrainDuringPan:false,animationTime:.25,blendTime:.05,tileSources:{type:'image',url:src,buildPyramid:true}});
    p.viewer.addHandler('open',()=>applyAdjustments(side));
   }catch(err){console.error('OpenSeadragon failed, using fallback viewer',err);osd.style.display='none';fb.style.display='block';resetFallback(side);img.src=src;}
 } else {osd.style.display='none';fb.style.display='block';resetFallback(side);img.src=src;}
}
function destroyPaneViewer(side){const p=panes[side];if(p.viewer){try{p.viewer.destroy();}catch(_){}p.viewer=null;}}
function applyAdjustments(side){
 const p=panes[side],a=p.adjust,filter=byId(`${side}FilterStage`),sharp=byId(`${side}SharpenStage`),matrix=byId(`gallerySharpenMatrix${side==='left'?'Left':'Right'}`);
 if(filter){filter.style.filter=`brightness(${a.brightness}%) contrast(${a.contrast}%) blur(${a.blur}px)`;filter.style.webkitFilter=filter.style.filter;}
 const s=Number(a.sharpen)||0,center=1+4*s;if(matrix)matrix.setAttribute('kernelMatrix',`0 ${-s} 0 ${-s} ${center} ${-s} 0 ${-s} 0`);
 if(sharp){sharp.style.filter=s>0?`url(#gallerySharpenFilter${side==='left'?'Left':'Right'})`:'none';sharp.style.webkitFilter=sharp.style.filter;}
 safeText(`[data-side="${side}"][data-value="blur"]`,`${a.blur%1?a.blur.toFixed(2):a.blur} px`);
 safeText(`[data-side="${side}"][data-value="brightness"]`,`${Math.round(a.brightness)}%`);
 safeText(`[data-side="${side}"][data-value="contrast"]`,`${Math.round(a.contrast)}%`);
 safeText(`[data-side="${side}"][data-value="sharpen"]`,a.sharpen.toFixed(2));
}
function resetAdjustments(side){const p=panes[side];p.adjust={blur:0,brightness:100,contrast:100,sharpen:0};qa(`input[data-side="${side}"][data-adjustment]`).forEach(inp=>{const k=inp.dataset.adjustment;inp.value=(k==='blur'||k==='sharpen')?'0':'100';});applyAdjustments(side);}
function paneAction(side,action){
 const p=panes[side];if(p.index==null)return;
 if(action==='prev'||action==='next'){const d=action==='prev'?-1:1;setPaneImage(side,(p.index+d+items.length)%items.length,true);setMode(mode);return;}
 if(p.viewer){try{if(action==='zoom-in')p.viewer.viewport.zoomBy(1.5);if(action==='zoom-out')p.viewer.viewport.zoomBy(.67);if(action==='reset-view')p.viewer.viewport.goHome(true);if(action==='rotate')p.viewer.viewport.setRotation((p.viewer.viewport.getRotation()+90)%360);p.viewer.viewport.applyConstraints();}catch(_){}}
 else{if(action==='zoom-in')p.fb.scale*=1.5;if(action==='zoom-out')p.fb.scale*=.67;if(action==='reset-view')resetFallback(side);if(action==='rotate')p.fb.rot=(p.fb.rot+90)%360;applyFallback(side);}
}
function resetFallback(side){const p=panes[side],fb=byId(`${side}Fallback`),img=byId(`${side}FallbackImg`);if(!fb||!img)return;p.fb={scale:1,x:0,y:0,drag:false,lastX:0,lastY:0,rot:0};img.onload=()=>{const r=fb.getBoundingClientRect();if(img.naturalWidth&&img.naturalHeight)p.fb.scale=Math.min(r.width/img.naturalWidth,r.height/img.naturalHeight)*.94;applyFallback(side);applyAdjustments(side);};applyFallback(side);}
function applyFallback(side){const p=panes[side],img=byId(`${side}FallbackImg`);if(img)img.style.transform=`translate(-50%,-50%) translate(${p.fb.x}px,${p.fb.y}px) scale(${p.fb.scale}) rotate(${p.fb.rot}deg)`;}
function beginCompareFromViewer(){const base=mode==='right'&&panes.right.index!=null?panes.right.index:panes.left.index;if(base==null)return;comparePick=base;closeViewer();setTray(`A: ${cardTitle(base)} — choose Compare on a second image.`);}
function changeImage(side){replaceSide=side;closeViewer();setTray(`Choose Compare on the replacement image for ${side==='left'?'Left':'Right'}.`);}
function setupFallbackPointer(side){const fb=byId(`${side}Fallback`),p=panes[side];if(!fb)return;fb.addEventListener('wheel',e=>{e.preventDefault();p.fb.scale=Math.max(.1,Math.min(64,p.fb.scale*(e.deltaY<0?1.25:.8)));applyFallback(side);},{passive:false});fb.addEventListener('pointerdown',e=>{p.fb.drag=true;p.fb.lastX=e.clientX;p.fb.lastY=e.clientY;try{fb.setPointerCapture(e.pointerId);}catch(_){} });fb.addEventListener('pointermove',e=>{if(!p.fb.drag)return;p.fb.x+=e.clientX-p.fb.lastX;p.fb.y+=e.clientY-p.fb.lastY;p.fb.lastX=e.clientX;p.fb.lastY=e.clientY;applyFallback(side);});fb.addEventListener('pointerup',()=>p.fb.drag=false);fb.addEventListener('pointercancel',()=>p.fb.drag=false);}
function bindClick(id,fn){const el=byId(id);if(el)el.addEventListener('click',fn);}
function boot(){
 initItems();setupFallbackPointer('left');setupFallbackPointer('right');
 bindClick('closeViewerBtn',closeViewer);
 bindClick('fullscreenViewerBtn',()=>{if(!document.fullscreenElement)modal.requestFullscreen?.();else document.exitFullscreen?.();});
 bindClick('singleLeftBtn',()=>setMode('left'));bindClick('splitBtn',()=>setMode('split'));bindClick('singleRightBtn',()=>setMode('right'));bindClick('startCompareBtn',beginCompareFromViewer);bindClick('compareTrayCancel',hideTray);
 qa('.changeImageBtn').forEach(b=>b.addEventListener('click',()=>changeImage(b.dataset.side)));
 qa('.paneToolBtn,.paneNavBtn').forEach(b=>b.addEventListener('click',()=>paneAction(b.dataset.side,b.dataset.action)));
 qa('input[data-adjustment]').forEach(inp=>inp.addEventListener('input',e=>{const side=e.currentTarget.dataset.side,key=e.currentTarget.dataset.adjustment;if(!panes[side]||!key)return;panes[side].adjust[key]=Number(e.currentTarget.value);applyAdjustments(side);}));
 qa('.resetPaneAdjustments').forEach(b=>b.addEventListener('click',()=>resetAdjustments(b.dataset.side)));
 document.addEventListener('keydown',e=>{if(!modal.classList.contains('open'))return;if(e.key==='Escape')closeViewer();if(e.key==='1')setMode('left');if(e.key==='2')setMode('split');if(e.key==='3')setMode('right');});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
