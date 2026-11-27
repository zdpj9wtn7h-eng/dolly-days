'use strict';
const DURATION=2000;
// 第5帧从890ms开始，烟雾在此时达到最大覆盖；在该帧中段切换。
const SWITCH_AT=1000;
const game=document.querySelector('#game'),scene=document.querySelector('#scene'),tools=document.querySelector('#tools'),carried=document.querySelector('#carried'),next=document.querySelector('#next'),faceFx=document.querySelector('#faceFx'),barFx=document.querySelector('#barFx');
const face=[310,350,390,390];
// 用用户提供的13号底图原坐标显示空位，不重绘或修改原始图片。
const sourceCovers=document.createElement('div');sourceCovers.id='sourceCovers';Object.assign(sourceCovers.style,{position:'absolute',inset:'0',pointerEvents:'none'});game.insertBefore(sourceCovers,tools);
function clearSource(t){
 const[x,y,w,h]=t.box,pad=8,cover=document.createElement('div');
 Object.assign(cover.style,{position:'absolute',left:(x-pad)+'px',top:(y-pad)+'px',width:(w+pad*2)+'px',height:(h+pad*2)+'px',backgroundImage:'url("assets/13.png")',backgroundSize:'1512px 982px',backgroundPosition:`-${x-pad}px -${y-pad}px`,backgroundRepeat:'no-repeat'});
 sourceCovers.append(cover);
}
const sparkles=document.createElement('div');sparkles.id='sparkles';sparkles.setAttribute('aria-hidden','true');game.append(sparkles);
function showStars(t){
 sparkles.replaceChildren();sparkles.hidden=!t;if(!t)return;
 const[x,y,w,h]=t.box;Object.assign(sparkles.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'});
 [[-.03,.2],[.22,-.06],[.8,-.04],[1.04,.4],[.8,1.03],[.14,1.03]].forEach(([sx,sy],i)=>{const star=document.createElement('span');star.className='star';star.textContent='✦';Object.assign(star.style,{left:sx*w+'px',top:sy*h+'px',fontSize:(i%2?22:30)+'px',animationDelay:(-i*.19)+'s'});sparkles.append(star);});
}
// 原图只用 CSS 定位和裁切显示，不修改素材像素。
const pages=[[
 {name:'海绵',box:[860,307,155,167],clip:'polygon(10% 0,92% 0,98% 92%,92% 99%,5% 98%,2% 87%)',target:face,result:2},
 {name:'打磨机',box:[1040,296,204,201],clip:'polygon(21% 0,32% 2%,83% 63%,89% 80%,99% 93%,97% 99%,87% 94%,81% 85%,67% 86%,3% 29%,2% 19%)',target:face,result:3},
 {name:'刮刀',box:[836,530,411,35],clip:'polygon(0 65%,8% 20%,19% 23%,30% 3%,98% 4%,100% 27%,100% 70%,98% 87%,29% 87%,18% 70%,8% 79%)',target:[350,560,310,170],result:4},
 {name:'笔刷',box:[819,613,431,59],clip:'polygon(0 35%,3% 3%,9% 0,16% 28%,34% 30%,99% 29%,100% 70%,34% 75%,16% 74%,8% 98%,2% 82%)',target:face,result:5},
 {name:'喷罐',box:[1270,277,150,389],clip:'polygon(38% 0,62% 0,62% 9%,92% 20%,99% 23%,98% 98%,90% 100%,7% 99%,2% 97%,2% 24%,8% 20%,35% 10%)',target:face,result:5}
],[
 {name:'眼珠',box:[837,310,268,326],clip:'inset(0 round 45px)',target:[270,330,390,190],result:7},
 {name:'贴纸',box:[1158,328,215,285],clip:'inset(0 round 8px)',target:[270,515,390,215],result:8}
]];
let currentPage=0,currentStep=0,selectedTool=null,isAnimating=false,currentImage=1,scale=1;
const play=document.querySelector('#play'),complete=document.querySelector('#complete'),showcase=document.querySelector('#showcase');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function showPage(image,mode){
 currentImage=image;scene.src=`assets/${image}.png`;game.dataset.mode=mode;
 tools.replaceChildren();sourceCovers.replaceChildren();sparkles.hidden=true;selectedTool=null;carried.hidden=true;faceFx.hidden=true;barFx.hidden=true;showcase.hidden=true;next.hidden=true;
 game.dataset.held='false';isAnimating=mode==='movie'||mode==='reveal';game.dataset.busy=String(isAnimating);
 play.hidden=mode!=='start';complete.hidden=mode!=='end';
}
async function movie(src){
 showcase.className='';showcase.src=src+'?play='+Date.now();await showcase.decode();showcase.hidden=false;await wait(DURATION);
}
async function finalSequence(){
 showPage(14,'movie');await movie('assets/20-2s.gif');
 showcase.hidden=true;game.dataset.mode='reveal';faceFx.src='assets/9-2s.gif?play='+Date.now();await faceFx.decode();faceFx.hidden=false;
 setTimeout(()=>{currentImage=15;scene.src='assets/15.png';},SWITCH_AT);
 await wait(DURATION);faceFx.hidden=true;game.dataset.mode='movie';await movie('assets/21-2s.gif');
 showPage(16,'end');showcase.className='final';showcase.src='assets/22.gif?play='+Date.now();await showcase.decode();if(game.dataset.mode==='end')showcase.hidden=false;
}
function resetGame(){currentPage=0;currentStep=0;currentImage=1;carried.className='';showPage('00','start');}
play.onclick=e=>{e.stopPropagation();if(game.dataset.mode!=='start')return;play.hidden=true;game.dataset.mode='tools';currentImage=1;render();};
complete.onclick=e=>{e.stopPropagation();resetGame();};
function resize(){scale=Math.min(innerWidth/1512,innerHeight/982);game.style.transform=`scale(${scale})`;}
addEventListener('resize',resize);resize();
function styleCrop(el,t,image){let[x,y,w,h]=t.box;Object.assign(el.style,{width:w+'px',height:h+'px',backgroundImage:`url("assets/${image}.png")`,backgroundPosition:`-${x}px -${y}px`,clipPath:t.clip});}
function render(){
 game.dataset.mode='tools';next.hidden=false;
 scene.src=`assets/${currentImage}.png`;tools.replaceChildren();sourceCovers.replaceChildren();
 pages[currentPage].forEach((t,i)=>{
   // 眼珠盒在 P7/P8 中已由原始白盒替代，不叠加灰色盒子。
   if(currentPage===1&&i===0&&currentStep>0)return;
   if(i<currentStep){clearSource(t);return;}
   const b=document.createElement('button');b.className='tool '+(i<currentStep?'done':i===currentStep?'active':'');b.setAttribute('aria-label',t.name);b.disabled=i!==currentStep||isAnimating;styleCrop(b,t,currentImage);b.style.left=t.box[0]+'px';b.style.top=t.box[1]+'px';
   b.onclick=e=>{e.stopPropagation();if(selectedTool||isAnimating||i!==currentStep)return;selectedTool=t;game.dataset.held='true';sparkles.hidden=true;clearSource(t);b.hidden=true;carried.className='sprite';styleCrop(carried,t,currentImage);carried.hidden=false;move(e);};
   tools.append(b);
 });
 next.disabled=currentStep<pages[currentPage].length||isAnimating;
 showStars(pages[currentPage][currentStep]);
}
function point(e){const r=game.getBoundingClientRect();return[(e.clientX-r.left)/scale,(e.clientY-r.top)/scale];}
function move(e){if(!selectedTool||isAnimating)return;const[x,y]=point(e),w=selectedTool.box[2],h=selectedTool.box[3];carried.style.left=(x-w/2)+'px';carried.style.top=(y-h/2)+'px';}
game.addEventListener('pointermove',move);
game.addEventListener('click',async e=>{
 if(!selectedTool||isAnimating)return;
 const[x,y]=point(e),[tx,ty,tw,th]=selectedTool.target;if(x<tx||x>tx+tw||y<ty||y>ty+th)return;
 isAnimating=true;game.dataset.busy='true';next.disabled=true;carried.classList.add('working');
 // 每次从首帧播放；工作副本只调整 GIF 帧延时，总时长均为 2 秒。
 faceFx.src='assets/9-2s.gif?play='+Date.now();barFx.src='assets/10-2s.gif?play='+Date.now();
 await Promise.all([faceFx.decode(),barFx.decode()]);
 faceFx.hidden=false;barFx.hidden=false;
 setTimeout(()=>{currentImage=selectedTool.result;scene.src=`assets/${currentImage}.png`;carried.hidden=true;},SWITCH_AT);
 setTimeout(()=>{
   currentImage=selectedTool.result;currentStep++;selectedTool=null;isAnimating=false;carried.hidden=true;carried.className='';faceFx.hidden=true;barFx.hidden=true;game.dataset.held='false';game.dataset.busy='false';
   if(currentPage===1&&currentStep===pages[1].length){finalSequence().catch(e=>{console.error(e);alert('动画加载失败：'+e.message);});}else render();
 },DURATION);
});
next.onclick=e=>{e.stopPropagation();if(next.disabled||currentPage!==0)return;currentPage=1;currentStep=0;currentImage=6;render();};
// 预载两页及特效，避免操作时临时加载整页大图。
window.ready=false;
Promise.all([...Array.from({length:8},(_,i)=>`assets/${i+1}.png`),...['00','14','15','16','12','13'].map(n=>`assets/${n}.png`),'assets/9-2s.gif','assets/10-2s.gif','assets/20-2s.gif','assets/21-2s.gif','assets/22.gif'].map(src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=resolve;im.onerror=()=>reject(new Error('素材加载失败：'+src));im.src=src;}))).then(()=>{resetGame();window.ready=true;}).catch(e=>{console.error(e);alert(e.message);});
