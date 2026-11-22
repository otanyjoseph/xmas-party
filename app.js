/* Christmas Potluck & White Elephant — app logic
   Runs in two modes:
   • Demo mode  – firebase-config.js not filled in yet: data lives only in this browser (localStorage).
   • Live mode  – Firebase configured: everyone sees the same dishes in real time. */
"use strict";
var $=function(i){return document.getElementById(i)};
var CATS=[['app','Appetizers','Add a starter'],['main','Mains','Add a main'],['drink','Drinks','Add a drink'],['dessert','Desserts','Add a dessert']];
var KINDS={app:['veg','nonveg'],main:['nonveg','veg'],dessert:['veg','nonveg'],drink:['alc','non']};
var LBL={veg:'Veg',nonveg:'Non-Veg',alc:'Alcoholic',non:'Non-alcoholic'};
var DEFAULT_CFG={app:{veg:2,nonveg:1},main:{nonveg:2,veg:2},drink:{alc:1,non:1},dessert:{veg:2,nonveg:1}};
var DEMO_DIS=[{id:'s1',c:'main',k:'nonveg',n:'Butter Chicken',b:'Alex & Priya',note:''},{id:'s2',c:'main',k:'veg',n:'Veg Biryani',b:'Rosina & Tany',note:''},{id:'s3',c:'main',k:'veg',n:'Paneer Butter Masala',b:'Meera & Sam',note:''}];
var DIS=[],CFG=JSON.parse(JSON.stringify(DEFAULT_CFG)),FB=null,LIVE=false;
var filled=function(c,k){return DIS.filter(function(d){return d.c==c&&d.k==k}).length};
// Slot counts: fill in any missing keys, and never show fewer slots than dishes already claimed.
function normCfg(){CATS.forEach(function(x){var c=x[0];CFG[c]=CFG[c]||{};KINDS[c].forEach(function(k){var v=+CFG[c][k];CFG[c][k]=Math.max(isNaN(v)?DEFAULT_CFG[c][k]:v,filled(c,k))})})}
function toast(m){var t=$('toast');t.textContent=m;t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(function(){t.hidden=true},4500)}

// ---- Data layer: Firestore when configured, otherwise localStorage ----
function initFirebase(){
 var c=window.FIREBASE_CONFIG;
 if(!c||!c.apiKey||/^YOUR/i.test(c.apiKey))return Promise.resolve(null);
 var B='https://www.gstatic.com/firebasejs/10.14.1/';
 return Promise.all([import(B+'firebase-app.js'),import(B+'firebase-firestore.js'),import(B+'firebase-auth.js')]).then(function(m){
  var app=m[0].initializeApp(c);
  return {fs:m[1],au:m[2],db:m[1].getFirestore(app),auth:m[2].getAuth(app)};
 }).catch(function(e){console.error('Firebase failed to load',e);return null});
}
function saveDish(d){
 if(!LIVE){var i=DIS.findIndex(function(x){return x.id==d.id});if(i<0)DIS.push(d);else DIS[i]=d;try{localStorage.setItem('pp-dis',JSON.stringify(DIS))}catch(e){}normCfg();render();return}
 var o={c:d.c,k:d.k,n:d.n,b:d.b,note:d.note||'',ts:d.ts||Date.now()};
 FB.fs.setDoc(FB.fs.doc(FB.db,'dishes',d.id),o).catch(function(e){console.error(e);toast('Couldn’t save that — check your connection and try again.')});
}
function removeDish(id){
 if(!LIVE){DIS=DIS.filter(function(x){return x.id!=id});try{localStorage.setItem('pp-dis',JSON.stringify(DIS))}catch(e){}normCfg();render();return}
 FB.fs.deleteDoc(FB.fs.doc(FB.db,'dishes',id)).catch(function(e){console.error(e);toast('Couldn’t delete that — try again.')});
}
function saveCfg(cfg){
 if(!LIVE){CFG=cfg;try{localStorage.setItem('pp-cfg',JSON.stringify(CFG))}catch(e){}normCfg();render();return Promise.resolve()}
 return FB.fs.setDoc(FB.fs.doc(FB.db,'config','slots'),cfg);
}
var el=function(c,t,x){var e=document.createElement(t||'div');e.className=c;if(x!=null)e.textContent=x;return e};
var rng=function(s){return function(){s|=0;s=s+0x6D2B79F5|0;var t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
var $s=function(e,o){for(var k in o)e.style.setProperty(k,o[k])};
function slots(c){var f=[],o=[];KINDS[c].forEach(function(k){var l=DIS.filter(function(d){return d.c==c&&d.k==k});f=f.concat(l);for(var i=l.length;i<CFG[c][k];i++)o.push({k:k,open:1})});return f.concat(o)}
function mark(e,d){e.dataset.id=d.id;e.dataset.c=d.c;e.dataset.k=d.k;e.tabIndex=0;e.setAttribute('role','button');e.setAttribute('aria-label','Edit '+d.n);return e}
function plate(d,sm){var p=mark(el('plate'+(sm?' sm':'')+(d.c=='app'?' pa':d.c=='dessert'?' pd':'')),d),n=el('nm','div',d.n);n.dataset.b=sm?(d.c=='app'?16:17):24;p.appendChild(n);p.appendChild(el('by','div','by '+d.b));p.appendChild(el('tag '+d.k,'span',LBL[d.k]));return p}
function cloche(d,c,sm,lab){var b=el('cl hang m'+(sm?' sm':''),'button','+ '+lab);b.type='button';b.dataset.c=c;b.dataset.k=d.k;b.appendChild(el('tag '+d.k,'span',LBL[d.k]));return b}
function tray(d){var p=mark(el('plat dish hang'),d),n=el('nm','div',d.n);n.dataset.b=20;p.appendChild(n);p.appendChild(el('by','div','by '+d.b));p.appendChild(el('tag '+d.k,'span',LBL[d.k]));return p}
var PAT=['pp','t','p','t','pp','p','t'];
var PATS={app:['pp','p','pp','p','p','pp'],dessert:['p','pp','pp','p','pp','p']};
function units(L,P){P=P||PAT;var u=[],i=0,j=0;while(i<L.length){var m=P[j++%P.length];if(m=='pp'&&i==L.length-1)m='p';var n=m=='pp'?2:1;u.push({m:m,it:L.slice(i,i+n)});i+=n}return u}
function cutlery(r,q){[['fork',[6,20]],['nap',[18,36]],['nap r',[18,36]],['knife',[6,20]]].forEach(function(s){if(q()<.2)return;var e=el(s[0]+' side'),x=Math.round(s[1][0]+q()*(s[1][1]-s[1][0])),o={'--dy':Math.round(q()*64-32),'--rot':Math.round(q()*22-11)};o[s[0]=='fork'||s[0]=='nap'?'left':'right']='calc(var(--u)*'+x+')';$s(e,o);r.appendChild(e)})}
function sprigs(r,q,tr){var n=q()<.6?1:(q()<.35?2:0);for(var i=0;i<n;i++){var w=Math.round(32+q()*26),s=el((q()<.5?'hs':'gs')+' sc'),side=q(),x=side<.45?2+q()*28:side<.9?428-w-q()*28:120+q()*120;if(tr&&side>=.9)x=4;
 $s(s,{width:'calc(var(--u)*'+w+')',left:'calc(var(--u)*'+Math.round(x)+')',top:side>=.9&&!tr?'calc(100% - var(--u)*14)':'calc(var(--u)*'+Math.round(q()*100-10)+')',transform:'scaleX('+(q()<.5?-1:1)+') rotate('+Math.round(q()*50-25)+'deg)'});r.appendChild(s)}}
function layout(c,x,L,host){var pc=0;var sm=c!='main'?1:0;units(L,PATS[c]).forEach(function(U,i){var q=rng(c.charCodeAt(0)*131+i*977),r=el('row'+(U.m=='t'?' tr':'')),t=U.m=='t';
 U.it.forEach(function(d){r.appendChild(d.open?cloche(d,c,sm,x[2]):t?tray(d):plate(d,sm))});
 if(c!='main'){r.style.marginBottom='calc(var(--u)*18)';var sd=q()<.5?-1:1;[].forEach.call(r.children,function(ch,j){var x=U.m=='p'?sd*Math.round(24+q()*40):Math.round(q()*16-8),y=Math.round(q()*12-6),rt=(q()*5-2.5).toFixed(1);ch.style.transform='translate(calc(var(--u)*'+x+'),calc(var(--u)*'+y+')) rotate('+rt+'deg)'})}
 else if(U.m=='p'){pc++;r.firstChild.style.transform='translateX(calc(var(--u)*'+(pc%2?-1:1)*Math.round(26+q()*16)+'))'}
 if(!t)cutlery(r,q);else if(q()<.55){var e=el('nap side'+(q()<.5?'':' r')),o={'--dy':Math.round(q()*50-25),'--rot':Math.round(q()*22-11)};o[e.className.indexOf(' r')>0?'right':'left']='calc(var(--u)*6)';$s(e,o);r.appendChild(e)}
 sprigs(r,q,t);host.appendChild(r)})}
function banner(t){var h=el('ban','h2'),s=el('fab','span',t);h.appendChild(s);return h}
function render(){var p=$('potluck');p.textContent='';
 CATS.forEach(function(x){var c=x[0];p.appendChild(banner(x[1]));
  if(c=='drink'){slots(c).forEach(function(d){var t=el('tray hang');
   // Non-alcoholic tray: cocoa mugs only (no wine bottle or glass)
   (d.k=='non'?['mug l','mug m3','mug','mug m2']:['bot','gl','mug','mug m2']).forEach(function(k){t.appendChild(el(k))});
   if(d.open){var b=el('addb add','button','+ Add a drink');b.type='button';b.dataset.c=c;b.dataset.k=d.k;t.appendChild(b)}
   else{mark(t,d);var q=el('dtxt'),n=el('nm','div',d.n);n.dataset.b=20;q.appendChild(n);q.appendChild(el('by','div','by '+d.b));t.appendChild(q)}
   t.appendChild(el('tag '+d.k,'span',LBL[d.k]));p.appendChild(t)});return}
  layout(c,x,slots(c),p)});
 p.removeAttribute('aria-busy');fit()}
function fit(){var u=document.getElementById('page').clientWidth/430;document.querySelectorAll('.nm').forEach(function(n){var f=+n.dataset.b*u;n.style.fontSize=f+'px';while(n.scrollHeight>n.clientHeight+1&&f>9){f-=1;n.style.fontSize=f+'px'}})}
document.querySelectorAll('.tab').forEach(function(t){t.addEventListener('click',function(){document.querySelectorAll('.tab').forEach(function(o){var on=o===t;o.setAttribute('aria-selected',on);o.classList.toggle('tabon',on);o.classList.toggle('taboff',!on);document.getElementById(o.getAttribute('aria-controls')).hidden=!on})})});
var adm=$('adm'),draft,cur='app',msg=$('amsg'),lastFocus=null;
function lock(on){$('page').inert=on;document.documentElement.style.overflow=on?'hidden':''}
function closeA(){adm.hidden=true;lock(false);if(LIVE&&FB.auth.currentUser)FB.au.signOut(FB.auth);$('dogbtn').focus()}
function showControls(){draft=JSON.parse(JSON.stringify(CFG));$('alogin').hidden=true;$('amain').hidden=false;msg.textContent=LIVE?'':'Demo mode: changes stay in this browser only.';adminView()}
$('dogbtn').onclick=function(){$('perr').textContent='';$('pw').value='';adm.hidden=false;lock(true);
 if(!LIVE){showControls();return}          // demo mode has nothing to protect
 $('alogin').hidden=false;$('amain').hidden=true;($('em').value?$('pw'):$('em')).focus()};
$('pcancel').onclick=$('acancel').onclick=closeA;
addEventListener('keydown',function(e){if(e.key=='Escape'){if(!adm.hidden)closeA();else if(!dlg.hidden)closeD()}});
function unlockA(e){if(e)e.preventDefault();var em=$('em').value.trim(),pw=$('pw').value;
 if(!em||!pw){$('perr').textContent='Enter your email and password.';return}
 $('punlock').disabled=true;
 FB.au.signInWithEmailAndPassword(FB.auth,em,pw).then(function(){$('pw').value='';showControls()})
  .catch(function(){$('perr').textContent='That email or password isn’t right.'})
  .then(function(){$('punlock').disabled=false})}
$('alogin').onsubmit=unlockA;$('punlock').onclick=unlockA;

function adminView(){var tb=$('atabs');tb.textContent='';CATS.forEach(function(x){var b=el('atab','button',x[1]);b.type='button';b.setAttribute('role','tab');b.setAttribute('aria-selected',x[0]==cur);b.onclick=function(){cur=x[0];msg.textContent='';adminView()};tb.appendChild(b)});
 var R=$('arows');R.textContent='';KINDS[cur].forEach(function(k){var f=filled(cur,k),row=el('arow'),l=el('');l.appendChild(el('tag '+k,'span',LBL[k]));if(f)l.appendChild(el('','small',f+' already filled'));row.appendChild(l);
  var s=el('step'),m=el('','button','−'),o=el('','output',draft[cur][k]),pl=el('','button','+');m.type=pl.type='button';m.setAttribute('aria-label','Fewer '+LBL[k]);pl.setAttribute('aria-label','More '+LBL[k]);
  if(draft[cur][k]<=f)m.setAttribute('aria-disabled','true');
  m.onclick=function(){if(draft[cur][k]<=f){msg.textContent=f+' already filled, so '+LBL[k]+' can’t go lower.';return}draft[cur][k]--;msg.textContent='';adminView()};
  pl.onclick=function(){if(draft[cur][k]<12)draft[cur][k]++;msg.textContent='';adminView()};
  s.append(m,o,pl);row.appendChild(s);R.appendChild(row)})}
$('asave').onclick=function(){var b=this;b.disabled=true;
 Promise.resolve(saveCfg(draft)).then(function(){if(!LIVE)CFG=draft;closeA()})
  .catch(function(){msg.textContent='Couldn’t save. Are you signed in as the admin?'})
  .then(function(){b.disabled=false})};

var dlg=$('dlg'),ctx=null,arm=0,NOUN={app:'starter',main:'main',drink:'drink',dessert:'dessert'},KW={veg:'veg',nonveg:'non-veg',alc:'alcoholic',non:'non-alcoholic'};
function openDlg(c,k,id){var d=id?DIS.filter(function(x){return x.id==id})[0]:null;ctx={c:c,k:k,id:d&&d.id};arm=0;
 var dt=$('dt');dt.textContent='';dt.append(d?'Edit this ':'Add '+(k=='alc'?'an ':'a '),el('kw '+k,'span',KW[k]),' '+NOUN[c]);$('d-nl').textContent=c=='drink'?'Drink':'Dish';$('d-n').placeholder=c=='drink'?'What are you pouring?':'What are you bringing?';$('d-n').removeAttribute('aria-invalid');$('d-by').removeAttribute('aria-invalid');
 $('d-by').value=d?d.b:'';$('d-n').value=d?d.n:'';$('d-note').value=d?d.note||'':'';$('derr').textContent='';
 var del=$('ddel');del.hidden=!d;del.textContent='Delete';del.classList.remove('pri');dlg.hidden=false;lock(true);$('d-n').focus()}
function closeD(){dlg.hidden=true;lock(false)}
$('potluck').addEventListener('click',function(e){var t=e.target.closest('[data-c]');if(t)openDlg(t.dataset.c,t.dataset.k,t.dataset.id)});
$('potluck').addEventListener('keydown',function(e){var t=e.target;if((e.key=='Enter'||e.key==' ')&&t.dataset&&t.dataset.id&&t.tagName!='BUTTON'){e.preventDefault();openDlg(t.dataset.c,t.dataset.k,t.dataset.id)}});
$('dcancel').onclick=closeD;
function saveD(e){if(e)e.preventDefault();var b=$('d-by').value.trim(),n=$('d-n').value.trim(),o=$('d-note').value.trim();
 if(!b||!n){$('derr').textContent='Add the '+(ctx.c=='drink'?'drink':'dish')+' and who’s bringing it.';$('d-n').setAttribute('aria-invalid',!n);$('d-by').setAttribute('aria-invalid',!b);(n?$('d-by'):$('d-n')).focus();return}
 var old=ctx.id&&DIS.filter(function(x){return x.id==ctx.id})[0];
 saveDish({id:old?old.id:'d'+Date.now()+Math.floor(Math.random()*1e4),c:ctx.c,k:ctx.k,n:n,b:b,note:o,ts:old?old.ts:Date.now()});
 closeD()}
$('dform').onsubmit=saveD;$('dsave').onclick=saveD;
$('dform').addEventListener('keydown',function(e){if(e.key=='Enter'&&e.target.tagName=='INPUT'){e.preventDefault();saveD()}});
$('ddel').onclick=function(){if(!arm){arm=1;this.textContent='Tap again to delete';this.classList.add('pri');return}
 removeDish(ctx.id);closeD()};

// ---- Start up ----
// White Elephant tab switches to the illustrated look once all six PNGs are present in /assets
(function(){var f=['we-banner','we-card','we-footer','gift-red','gift-cream','gift-green'],n=0;
 f.forEach(function(x){var i=new Image();i.onload=function(){if(++n==f.length)$('we').classList.add('art')};i.src='assets/'+x+'.webp'})})();
$('potluck').setAttribute('aria-busy','true');
addEventListener('resize',fit);if(document.fonts)document.fonts.ready.then(fit);
initFirebase().then(function(fb){
 FB=fb;LIVE=!!fb;
 if(!LIVE){ // demo mode
  DIS=DEMO_DIS;
  try{var sc=JSON.parse(localStorage.getItem('pp-cfg'));if(sc)CFG=sc;var sd=localStorage.getItem('pp-dis');if(sd!==null)DIS=JSON.parse(sd)}catch(e){}
  normCfg();render();return}
 var first=0,go=function(){normCfg();render()};
 FB.fs.onSnapshot(FB.fs.collection(FB.db,'dishes'),function(s){
  DIS=s.docs.map(function(d){var x=d.data();x.id=d.id;return x}).sort(function(a,b){return(a.ts||0)-(b.ts||0)});go()},
  function(e){console.error(e);toast('Couldn’t load the dish list.')});
 FB.fs.onSnapshot(FB.fs.doc(FB.db,'config','slots'),function(s){
  if(s.exists())CFG=s.data();go()},function(e){console.error(e)});
 setTimeout(function(){if($('potluck').getAttribute('aria-busy'))go()},4000); // never leave the page blank
});
