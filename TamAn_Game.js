/* ================================================================
   HÀNH TRÌNH TÂM AN — lớp game "buổi đầu" (v7.57, 28/11/2026 — tích hợp vào app thật)
   • Nạp SAU toàn bộ script của app (thẻ <script src> trước </body>). Không sửa hàm gốc: chỉ bọc + bắt click.
   • MỌI tài khoản đều có thẻ Hành trình (6 chương · 20 bước). Bước nào dữ liệu đã có → tự tick; có nút Bỏ qua.
   • KHOÁ mở dần CHỈ áp cho tài khoản tạo từ GM_FROM. Tài khoản cũ: không khoá bất kỳ tính năng nào.
   • Game KHÔNG ghi vào dữ liệu nghiệp vụ. Chỉ ghi: _prefs.gm (tiến độ riêng) + publicClubs/{uid}.gamePub
     (chương, số bước, ngày tốt nghiệp — để tuyến trên thấy, cùng kênh với skillPub v7.23).
   • Huy hiệu Người dẫn tính từ cây của người xem: F1 = ID có "Bảo trợ (F1 của ai)" là mình (gộp ID 2+ theo người).
   ================================================================ */
(function(){
'use strict';
var GM_FROM='2026-11-28';
var prefsReady=false,G=null,_saveT=null,_secDirty=0;
function $(s,r){return (r||document).querySelector(s);}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
function esc(s){try{return escHtml(s);}catch(e){return String(s||'');}}
function toast(m){try{showToast(m);}catch(e){}}
function realNodes(){try{return _realTreeNodes()||[];}catch(e){return (window.treeNodes||[]);}}
function realMembers(){return (window.dreamMode&&window._dreamSaved)?(_dreamSaved.members||[]):(window.members||[]);}
function realRoot(){return realNodes().find(function(n){return !n.parentId;})||null;}
function dreamNodes(){try{return dreamMode?treeNodes:loadDreamTree().nodes;}catch(e){return [];}}
function flag(k){return function(){return !!(G&&G.flags&&G.flags[k]);};}


/* ---------- Ai được chơi, ai bị khoá ---------- */
function isNewAcct(){ // tài khoản tạo từ GM_FROM → có khoá mở dần
  try{var c=fbUser&&fbUser.metadata&&fbUser.metadata.creationTime;if(!c)return false;return new Date(c).getTime()>=new Date(GM_FROM+'T00:00:00').getTime();}catch(e){return false;}
}
function eligible(){return !!(window.fbUser&&!window.viewOnlyMode);}
function active(){return !!(prefsReady&&G&&eligible());}
function isOpen(c){return !c||!G||!G.lock||G.openAll||!!G.grad||c<=G.ch;}

/* ---------- 6 chương · 20 bước ---------- */
var CH=[
  {n:'Tôi là ai',q:'Mình đứng ở đâu trong app này?',open:'Sơ đồ, Hướng dẫn, Đo DISC'},
  {n:'Vì sao tôi làm',q:'Mình làm việc này để đổi lấy điều gì?',open:'Mục tiêu → La bàn'},
  {n:'Đích đến bằng con số',q:'Muốn có ước mơ đó, đội của mình cần ra sao?',open:'🌠 Cây mơ ước, 🎯 Gợi ý đặt cây, Mục tiêu → Mục tiêu'},
  {n:'Gặp ai, nói gì, đưa đi đâu',q:'Mình chia sẻ với ai, bằng gì, rồi mời họ tới đâu?',open:'DS Tiềm năng, Kỹ năng, Kết quả SK, Vị trí các CLB, MagnoSeek'},
  {n:'Hôm nay làm gì',q:'Ngay hôm nay mình bắt đầu từ đâu?',open:'Hành động: Hôm nay, Điểm danh, Lịch 168'},
  {n:'Khép ngày và báo tin',q:'Hôm nay mình học được gì, và ai cần biết?',open:'Nhật ký, 6 Cái Lọ'}
];
var ST=[
 {id:'root',ch:1,m:2,noSkip:1,t:'Nhập ID Gốc và Mã ID',why:'Để tên bạn lên cây và tuyến trên nhận ra bạn.',how:'Mã ID lấy trên web PRIFE. Điền tên, Mã ID rồi bấm Lưu.',
   ok:function(){var r=realRoot();return !!(r&&String(r.idCode||'').trim());},go:goRoot},
 {id:'self',ch:1,m:1,t:'Mở Sơ đồ, bấm vào ô của chính mình',why:'Biết chỗ xem và sửa thông tin của mình.',how:'Ô có viền sáng là bạn. Bấm vào để xem, rồi đóng lại.',
   ok:flag('self'),go:goSelf},
 {id:'disc',ch:1,m:6,t:'Đo DISC',why:'Biết cách mình nói chuyện tự nhiên. Chương 4 sẽ dùng tới.',how:'Mỗi nhóm chọn câu giống bạn nhất. Không có đáp án đúng sai.',
   ok:function(){var r=realRoot();return !!(r&&String(r.disc||'').trim());},go:goDisc},
 {id:'nd',ch:1,m:1,t:'Khai tháng đóng Năng động gần nhất',why:'Để app nhắc bạn đóng đúng hạn, giữ trọn quyền lợi.',how:'Chọn tháng và năm bạn đóng gần nhất.',
   ok:function(){try{var nd=loadNangDong();return !!(nd&&nd.m);}catch(e){return false;}},go:goNd},
 {id:'wheel',ch:2,m:3,t:'Chấm Bánh xe cuộc đời 8 mảng',why:'Thấy mảng đời nào đang thiếu nhất.',how:'Chấm mỗi mảng từ 1 đến 10 theo cảm nhận hôm nay.',
   ok:function(){try{return Object.keys(loadWheel()).length>0;}catch(e){return false;}},go:function(){goTp('tp:laban');spot('#life-wheel-content');}},
 {id:'dreams',ch:2,m:3,t:'Viết 3 ước mơ',why:'Ước mơ lớn nhất sẽ là đích đến ở chương 3.',how:'Ví dụ: Đưa bố mẹ đi Nhật · Có 1 CLB của riêng mình · Mỗi tháng dư 20 triệu.',
   ok:function(){return (window._dreamList||[]).length>=3;},go:function(){goTp('tp:laban');spot('#dream-list-content');}},
 {id:'dtree',ch:3,m:4,t:'Vẽ Cây mơ ước: đặt ít nhất 1 người mỗi bên',why:'Có số cặp để app ước tính thu nhập.',how:'Bấm 📋 Chép từ Nhị phân làm nền để có ô của bạn, rồi bấm dấu + ở bên Trái và bên Phải. Đây là cây kế hoạch, không ảnh hưởng cây thật.',
   ok:function(){var ns=dreamNodes(),r=ns.find(function(n){return !n.parentId;});if(!r)return false;var k=ns.filter(function(n){return n.parentId===r.id;});return k.some(function(n){return n.side==='L';})&&k.some(function(n){return n.side==='R';});},go:goDream},
 {id:'po',ch:3,m:2,t:'Bấm 🎯 Gợi ý đặt cây, đọc ước tính',why:'Thấy con số mỗi tháng từ cây kế hoạch của bạn.',how:'Con số là ước tính theo kế hoạch trả thưởng, không phải cam kết.',
   ok:flag('po'),go:goPo},
 {id:'ann',ch:3,m:3,t:'Đặt mục tiêu 12 tháng',why:'App tự chia mục tiêu ra từng tháng.',how:'Ví dụ: Thu nhập 12 tháng 240 triệu. Có thể dùng số bạn vừa thấy ở Gợi ý đặt cây.',
   ok:function(){try{return loadAnn().items.some(function(it){return parseFloat(String(it.annual||'').replace(/[^\d.]/g,''))>0;});}catch(e){return false;}},go:function(){goTp('tp:goals');spot('#annplan-content');}},
 {id:'pareto',ch:3,m:3,t:'Kế hoạch 20/80: gõ số người vào ID bạn muốn trong tháng',why:'App tính ngược ra mỗi ngày cần trò chuyện mấy người.',how:'Ví dụ: 2. App tự vẽ phễu và việc cần làm mỗi ngày.',
   ok:function(){try{return loadParetoGoal()>0;}catch(e){return false;}},go:function(){goTp('tp:goals');spot('#pareto-content');}},
 {id:'prosp',ch:4,m:5,t:'Thêm 3 người vào DS kim cương Tiềm năng',why:'Có tên người cho việc hôm nay.',how:'Nghĩ theo vòng: gia đình, bạn cũ, đồng nghiệp, hàng xóm, người hay than mệt.',
   ok:function(){return (window._prospectsAll||[]).length>=3;},go:function(){goMain('prospect');spot('[data-prospect-action="add"]');}},
 {id:'skill',ch:4,m:3,t:'Mở Kỹ năng, bấm tên mình, xem bài Mời khách 6 bước',why:'Biết cách mời đúng chuẩn của đội.',how:'Bấm thẻ có tên bạn. Có 🔗 tài liệu thì bấm để đọc.',
   ok:flag('skill'),go:function(){goMain('kynang');spot('#list-kn .dd-center .mc-hd, #list-kn .dd-center, #list-kn');}},
 {id:'sk',ch:4,m:3,t:'Trong Kết quả SK, chọn 1 tình trạng người quen đang gặp',why:'Có câu chuyện thật để kể khi chia sẻ.',how:'Ví dụ: huyết áp, mất ngủ, đau khớp. Đọc các ca và mục 💡 Cách hỗ trợ.',
   ok:flag('sk'),go:function(){goMain('sk');spot('#page-sk button[onclick^="skPickChipIdx"]');}},
 {id:'map',ch:4,m:3,t:'Tìm CLB gần mình, xem Quy trình gửi khách',why:'Biết đưa khách tới đâu và gửi khách thế nào.',how:'Bấm 📍 Định vị để thấy CLB quanh bạn, hoặc bấm vào 1 CLB trong danh bạ. Quy trình gửi khách nằm ở đầu trang.',
   ok:flag('map'),go:function(){goMain('map');spot(['[data-map-action="locate-me"]','[data-map-action="map-locate"]','[data-map-action="focus-club"]','#guestproc-content']);}},
 {id:'acts',ch:5,m:2,t:'Ghi 3 việc hôm nay, mỗi việc gắn 1 tên người',why:'Biến kế hoạch thành việc làm ngay.',how:'Ví dụ: Gọi chị Lan hỏi thăm giấc ngủ · Nhắn anh Tùng hẹn ghé CLB · Dự Zoom tối.',
   ok:function(){try{return dayActs().length>=3;}catch(e){return false;}},go:function(){goTp('tp:actions','act:today');spot('[data-ac-input]');}},
 {id:'eq',ch:5,m:1,t:'Xếp 1 việc vào ô Eisenhower',why:'Biết làm việc nào trước.',how:'Bấm 🔲 Xếp Eisenhower dưới một việc, rồi chọn ô: Làm ngay, Lên lịch, Giao bớt hoặc Bỏ bớt.',
   ok:function(){try{return dayActs().some(function(x){return !!x.eq;});}catch(e){return false;}},go:function(){goTp('tp:actions','act:today');spot(['[data-ac-eqpick]','[data-ac-eqid]','[data-ac-view="matrix"]']);}},
 {id:'att',ch:5,m:1,t:'Điểm danh cho chính mình hôm nay',why:'Chuỗi ngày có mặt bắt đầu đếm.',how:'Ở thẻ có tên bạn (dòng 👑), bấm vào buổi bạn đã dự: Sáng, Trưa hoặc Tối, cho tới khi hiện ✓.',
   ok:selfAttended,go:function(){goTp('tp:actions','act:ngay');spot('#list-ngay .dd-center');}},
 {id:'jr',ch:6,m:2,t:'Viết nhật ký 1 câu bài học',why:'Bài học gom lại thành nguyên tắc của bạn.',how:'Ví dụ: Hôm nay mình biết mỗi ngày cần trò chuyện 2 người để tới ước mơ.',
   ok:function(){try{var j=dayJournal();return !!(j.obs||j.ana||j.syn||j.win||j.warn||(j.next&&j.next.length));}catch(e){return false;}},go:function(){goTp('tp:actions','act:journal');spot('#journal');}},
 {id:'jars',ch:6,m:1,t:'Ghi thu nhập hôm nay vào 6 Cái Lọ',why:'Bắt đầu thói quen giữ tiền.',how:'0 đồng cũng được, bấm Lưu hôm nay.',
   ok:function(){try{return !!loadJars().entries[_jarToday()];}catch(e){return false;}},go:function(){goTp('tp:actions','act:journal');spot('#jar-income-inp, #jars-content');}},
 {id:'report',ch:6,m:1,t:'Copy tin báo đã xong, gửi người giới thiệu',why:'Tuyến trên biết để chúc mừng bạn.',how:'Bấm nút bên dưới rồi dán vào Zalo gửi người giới thiệu.',
   ok:flag('report'),copy:1}
];
var MAIN_CH={home:1,tree:1,guide:1,disc:1,tp:2,prospect:4,kynang:4,sk:4,map:4,mg:4};
var SUB_CH={'tp:laban':2,'tp:goals':3,'tp:overview':5,'tp:actions':5,'act:today':5,'act:ngay':5,'act:lich168':5,'act:journal':6,'tp:results':7};
var BTN_CH={'#btn-fullscreen':1,'[data-treemode="star"]':1,'#btn-legend':1,'#btn-nangdong':1,'#btn-tzoom-in':1,'#btn-tzoom-out':1,
  '[data-treemode="dream"]':3,'#btn-incprobe':3,'#btn-myids':3,'#btn-placeopt':3,'#btn-thangtien':3,
  '#btn-export-branch':7,'#btn-import-branch':7,'#btn-idstats':7,'#fab-att':7,'#btn-gm-team':7};
var MAP_FLAG={'locate-me':1,'map-locate':1,'focus-club':1,'dir-to':1,'gp-view':1,'set-radius':1,'map-dir-ab':1};

function selfAttended(){
  try{var r=realRoot();if(!r)return false;var m=realMembers().find(function(x){return x.name===r.name;});if(!m)return false;
    return ['sang','trua','toi'].some(function(t){var v=dGet(m.id,t);return v==='yes'||v==='late';});}catch(e){return false;}
}

/* ---------- Trạng thái ---------- */
function blank(){return {v:2,uid:(window.fbUser&&fbUser.uid)||'',lock:isNewAcct(),seeded:false,start:new Date().toISOString(),done:{},skip:{},flags:{},sec:{},chAt:{},grad:'',openAll:false,min:false,ch:1};}
function loadState(){
  var g=(window._prefs&&_prefs.gm&&typeof _prefs.gm==='object')?_prefs.gm:null;
  if(g&&!(window.fbUser&&g.uid===fbUser.uid))g=null; // _prefs có bản sao trên máy: không nhận tiến độ của tài khoản khác cùng máy
  G=g||blank();['done','skip','flags','sec','chAt'].forEach(function(k){if(!G[k]||typeof G[k]!=='object')G[k]={};});
  if(typeof G.lock!=='boolean')G.lock=isNewAcct();
  if(!G.ch)G.ch=1;
  if(!g)save(true);
}
function save(now){
  if(!G||!window._prefs)return;_prefs.gm=G;
  if(_saveT){clearTimeout(_saveT);_saveT=null;}
  if(now){try{savePrefs();}catch(e){}return;}
  _saveT=setTimeout(function(){_saveT=null;try{savePrefs();}catch(e){}},1200);
}
function setFlag(k){if(!active()||G.flags[k])return;G.flags[k]=new Date().toISOString();save();setTimeout(tick,50);}
function stepState(s){return G.done[s.id]?'done':(G.skip[s.id]?'skip':'todo');}
function calcCh(){for(var c=1;c<=6;c++){if(ST.some(function(s){return s.ch===c&&stepState(s)==='todo';}))return c;}return 7;}
function curStep(){return ST.find(function(s){return s.ch===G.ch&&stepState(s)==='todo';})||null;}
function doneCount(){return ST.filter(function(s){return G.done[s.id];}).length;}
function stepNo(s){return ST.indexOf(s)+1;}
function chSteps(c){return ST.filter(function(s){return s.ch===c;});}

/* ---------- Vòng kiểm tra (mỗi 1,5 giây) ---------- */
function tick(){
  if(!active()){render();if(document.querySelector('.gm-locked'))applyLocks();return;} // QTV đang xem tài khoản khác / đã thoát: ẩn thẻ, gỡ khoá
  var changed=false,now=new Date().toISOString();
  if(!G.seeded){ // lần đầu: bước nào dữ liệu đã có thì tick im lặng (người cũ không bị dội thông báo)
    var pre=0;
    ST.forEach(function(s){if(G.done[s.id])return;var ok=false;try{ok=!!s.ok();}catch(e){}if(ok){G.done[s.id]=now;pre++;}});
    G.seeded=true;G.ch=calcCh();if(!G.chAt[1])G.chAt[1]=G.start;if(G.ch<=6&&!G.chAt[G.ch])G.chAt[G.ch]=now;
    if(G.ch===7&&!G.grad)G.grad=now;
    save(true);pubSchedule();
    if(pre>0&&!G.lock)setTimeout(function(){toast('🎯 Hành trình Tâm An: bạn đã có sẵn '+pre+'/'+ST.length+' bước từ dữ liệu đang dùng.');},1500);
  }
  ST.forEach(function(s){
    if(G.done[s.id])return;
    var ok=false;try{ok=!!s.ok();}catch(e){}
    if(ok){G.done[s.id]=now;delete G.skip[s.id];changed=true;G.min=false;toast('✓ Xong bước '+stepNo(s)+': '+s.t);}
  });
  var c=calcCh();
  if(c!==G.ch){
    var old=G.ch;G.ch=c;changed=true;
    if(c<=6){G.chAt[c]=G.chAt[c]||now;if(c>old)setTimeout(function(){toast('🎉 Xong chương '+old+'!'+(G.lock?' Đã mở: '+CH[c-1].open:''));},900);}
    if(c===7&&!G.grad){G.grad=now;setTimeout(showGrad,700);}
    G.min=false;pubSchedule();
  }
  if(changed)save();
  applyLocks();fixSub();render();
}
function heartbeat(){
  if(!active()||document.hidden||G.ch>6)return;
  G.sec[G.ch]=Math.round(((G.sec[G.ch]||0)+5)*10)/10;
  if(++_secDirty>=24){_secDirty=0;save();} // ghi thời gian chơi mỗi 2 phút (đỡ tốn lượt ghi)
}

/* ---------- Khoá / mở (chỉ tài khoản mới) ---------- */
function mark(el,lock,c){
  if(lock){el.classList.add('gm-locked');el.setAttribute('data-gm-ch',c>=7?'TN':c);}
  else if(el.classList.contains('gm-locked')){el.classList.remove('gm-locked');el.removeAttribute('data-gm-ch');}
}
function applyLocks(){
  var on=active()&&G.lock;
  $$('.mtab[data-main], .home-card[data-main]').forEach(function(b){var c=MAIN_CH[b.getAttribute('data-main')];mark(b,on&&!!c&&!isOpen(c),c);});
  $$('.stab[data-sub]').forEach(function(b){var c=SUB_CH[b.getAttribute('data-sub')];mark(b,on&&!!c&&!isOpen(c),c);});
  Object.keys(BTN_CH).forEach(function(sel){$$(sel).forEach(function(b){mark(b,on&&!isOpen(BTN_CH[sel]),BTN_CH[sel]);});});
}
function fixSub(){
  if(!active()||!G.lock)return;
  var pg=$('#page-tp');if(!pg||!pg.classList.contains('on'))return;
  var a=$('.stab.on[data-sub^="tp:"]');
  if(a&&a.classList.contains('gm-locked')){
    var order=['tp:laban','tp:goals','tp:actions','tp:overview'];
    for(var i=0;i<order.length;i++){var b=$('.stab[data-sub="'+order[i]+'"]');if(b&&!b.classList.contains('gm-locked')){b.click();break;}}
  }
  var a2=$('.stab.on[data-sub^="act:"]');
  if(a2&&a2.classList.contains('gm-locked')){var b2=$('.stab[data-sub="act:today"]');if(b2&&!b2.classList.contains('gm-locked'))b2.click();}
}
function lockMsg(c){return c==='TN'||c>=7?'🔒 Phần này mở khi bạn xong buổi đầu. Hoặc bấm "Mở tất cả" trong thẻ Hành trình.':'🔒 Phần này mở ở chương '+c+'. Làm tiếp "Việc tiếp theo", hoặc bấm "Mở tất cả".';}
document.addEventListener('click',function(e){
  if(!active()||!e.target||!e.target.closest)return;
  if(G.lock){
    var t=e.target.closest('.gm-locked');
    if(t){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();toast(lockMsg(t.getAttribute('data-gm-ch')));return;}
    var a=e.target.closest('[data-add-pid]');
    if(a&&!window.dreamMode&&!isOpen(7)){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();toast('🔒 Thêm người lên cây thật mở khi bạn xong buổi đầu. Bây giờ bạn tập trên 🌠 Cây mơ ước.');return;}
  }
  if(e.target.closest('.tnode-box.root-box')&&!window.dreamMode)setFlag('self');
  if(e.target.closest('#btn-placeopt'))setFlag('po');
  var ma=e.target.closest('[data-map-action]');if(ma&&MAP_FLAG[ma.getAttribute('data-map-action')])setFlag('map');
  if(e.target.closest('.sk-link, [data-skmedia-view], [data-open-type="kn"]'))setFlag('skill');
  var mt=e.target.closest('.mtab[data-main="tp"], .home-card[data-main="tp"]');if(mt)setTimeout(fixSub,90);
},true);

/* ---------- Đưa tôi tới đó ---------- */
function goMain(id){var b=$('.mtab[data-main="'+id+'"]');if(b)b.click();}
function goTp(sub,sub2){goMain('tp');setTimeout(function(){var b=$('.stab[data-sub="'+sub+'"]');if(b)b.click();if(sub2){var c=$('.stab[data-sub="'+sub2+'"]');if(c)c.click();}},80);}
function leaveDream(){if(window.dreamMode){var b=$('[data-treemode="binary"]');if(b)b.click();}}
function visible(el){var r=el.getBoundingClientRect();return r.width>0&&r.height>0;}
function spot(sel,delay){
  setTimeout(function(){
    var list=Array.isArray(sel)?sel:[sel],el=null; // nhiều lựa chọn: ưu tiên theo thứ tự
    for(var i=0;i<list.length&&!el;i++)el=$$(list[i]).filter(visible)[0]||null;
    if(!el)return;
    try{el.scrollIntoView({behavior:'smooth',block:'center'});}catch(e){el.scrollIntoView();}
    el.classList.add('gm-spot');setTimeout(function(){el.classList.remove('gm-spot');},6500);
  },delay||380);
}
function goRoot(){goMain('tree');leaveDream();setTimeout(function(){try{_openRootGateForm();}catch(e){}spot('#nf-idcode',300);},150);}
function goSelf(){goMain('tree');setTimeout(function(){leaveDream();if(window.currentTreeMode!=='binary'){var b=$('[data-treemode="binary"]');if(b)b.click();}spot('.tnode-box.root-box',450);},120);}
function goDisc(){var r=realRoot();if(!r){goRoot();return;}leaveDream();try{discFromNode(r.id);}catch(e){goMain('disc');}}
function goNd(){goMain('tree');setTimeout(function(){leaveDream();var b=$('#btn-nangdong');if(b)b.click();},150);}
function goDream(){
  goMain('tree');
  setTimeout(function(){
    if(!window.dreamMode){var d=$('[data-treemode="dream"]');if(d)d.click();}
    var hasRoot=dreamNodes().some(function(n){return !n.parentId;});
    spot(hasRoot?'.tn-add':'[data-dream-copy]',450);
  },120);
}
function goPo(){
  goMain('tree');
  setTimeout(function(){if(!window.dreamMode){var d=$('[data-treemode="dream"]');if(d)d.click();}spot('#btn-placeopt',400);},120);
}

/* ---------- Tin nhắn copy ---------- */
function totalMin(){var s=0;for(var k in G.sec)s+=G.sec[k]||0;return Math.max(1,Math.round(s/60));}
function myName(){var r=realRoot();return (r&&r.name)||(window._meName)||'';}
function myCode(){var r=realRoot();return (r&&r.idCode)||'';}
function appUrl(){return location.origin+location.pathname.replace(/TamAn_Demo\.html$/,'TamAn_Master.html');}
function reportText(){
  var n=doneCount()+(G.done.report?0:1); // +1: chính bước gửi tin này
  if(!G.lock)return '🎉 Mình đã đi xong Hành trình Tâm An trên app ('+n+'/'+ST.length+' bước)!\n'
    +'• Tên: '+myName()+(myCode()?'\n• Mã ID: '+myCode():'')+'\n'
    +'Giờ mình sẽ kèm tuyến dưới cùng đi Hành trình để cả nhánh dùng thạo app.';
  return '🎉 Em đã đi xong buổi đầu Hành trình Tâm An trên app!\n'
    +'• Tên: '+myName()+(myCode()?'\n• Mã ID: '+myCode():'')+'\n'
    +'• Xong '+n+'/'+ST.length+' bước, khoảng '+totalMin()+' phút.\n'
    +'Em cảm ơn đã giới thiệu em. Ngày mai em bắt đầu 30 ngày thực chiến ạ!';
}
function fmtT(iso){if(!iso)return '—';var d=new Date(iso);if(isNaN(d.getTime()))return '—';return d.getDate()+'/'+(d.getMonth()+1)+' '+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);}
function fmtD(iso){if(!iso)return '';var d=new Date(iso);if(isNaN(d.getTime()))return '';return d.getDate()+'/'+(d.getMonth()+1);}
function testText(){
  var L=['KẾT QUẢ · Hành trình Tâm An','Người chơi: '+myName()+(myCode()?' · '+myCode():''),
    'Bắt đầu: '+fmtT(G.start)+' · Xong: '+(G.grad?fmtT(G.grad):'chưa xong')+(G.openAll?' · đã bấm Mở tất cả':''),
    'Thiết bị: '+(/Mobi|Android|iPhone/i.test(navigator.userAgent)?'điện thoại':'máy tính'),''];
  CH.forEach(function(c,i){
    var ss=chSteps(i+1),d=ss.filter(function(s){return G.done[s.id];}).length;
    L.push('Chương '+(i+1)+' · '+c.n+': '+d+'/'+ss.length+' bước · '+Math.round((G.sec[i+1]||0)/60)+' phút');
    ss.forEach(function(s){var st=stepState(s);if(st!=='done')L.push('   '+(st==='skip'?'⏭ Bỏ qua':'○ Chưa làm')+' bước '+stepNo(s)+': '+s.t);});
  });
  L.push('','Tổng thời gian chơi: khoảng '+totalMin()+' phút');
  return L.join('\n');
}

/* ================================================================
   ĐỘI & HUY HIỆU NGƯỜI DẪN
   • Mỗi tài khoản đẩy tiến độ lên publicClubs/{uid}.gamePub khi đổi chương / tốt nghiệp (ít lượt ghi).
   • Người xem tải danh sách gamePub (tối đa 1 lần / 2 giờ, nút 🔄 tối đa 1 lần / phút), khớp vào cây của mình
     theo Mã ID (không có Mã ID mới khớp tên duy nhất), gộp ID 2+ theo người (enOwnerOf của v7.55).
   ================================================================ */
var TIER=[{i:'',n:''},{i:'🥉',n:'Người dẫn Đồng'},{i:'🥈',n:'Người dẫn Bạc'},{i:'🥇',n:'Người dẫn Vàng'},{i:'💎',n:'Người dẫn Kim cương'}];
var CH_BADGE=['🌱','💧','🌿','🍃','🌼','🎓'];
var _pubT=null,_pubLast='';
function pubSchedule(){clearTimeout(_pubT);_pubT=setTimeout(pubPush,3000);}
async function pubPush(){
  if(!G||!window.fbDb||!window.fbUser||window.viewOnlyMode||SB_ON)return;
  var r=realRoot();
  var pub={v:1,c:String((r&&r.idCode)||'').trim(),n:(r&&r.name)||'',done:doneCount(),ch:G.ch,grad:G.grad||'',start:G.start||'',at:new Date().toISOString()};
  var sig=JSON.stringify([pub.c,pub.n,pub.ch,pub.grad]);if(sig===_pubLast)return;
  try{
    var m=await import(FB_STORE);
    var name=(fbUser.displayName)||((fbUser.email||'').split('@')[0])||'';
    await m.setDoc(m.doc(fbDb,'publicClubs',fbUser.uid),{uid:fbUser.uid,name:name,gamePub:pub,updatedAt:pub.at},{merge:true}); // merge: giữ clubs/health/support/skillPub
    _pubLast=sig;
  }catch(e){/* thiếu quyền / mất mạng → lần đổi chương sau đẩy lại */}
}
var TEAM={at:0,list:null,loading:false,ver:0};
function teamCacheLoad(){try{var s=acctGet('gmteam');var o=s?JSON.parse(s):null;if(o&&Array.isArray(o.list)){TEAM.list=o.list;TEAM.at=+o.at||0;TEAM.ver++;}}catch(e){}}
async function teamFetch(force){
  if(!window.fbDb||!window.fbUser||window.viewOnlyMode||SB_ON||TEAM.loading)return TEAM.list;
  var age=Date.now()-TEAM.at;
  if(!force&&TEAM.list&&age<2*3600e3)return TEAM.list;
  if(force&&age<60e3)return TEAM.list;
  TEAM.loading=true;
  try{
    var m=await import(FB_STORE),snap;
    try{snap=await m.getDocs(m.query(m.collection(fbDb,'publicClubs'),m.where('gamePub.v','==',1)));}
    catch(e1){snap=await m.getDocs(m.collection(fbDb,'publicClubs'));}
    var list=[];
    snap.forEach(function(d){var g=(d.data()||{}).gamePub;if(g&&g.v===1)list.push({uid:d.id,c:String(g.c||''),n:String(g.n||''),done:+g.done||0,ch:+g.ch||1,grad:g.grad||'',start:g.start||''});});
    TEAM.list=list;TEAM.at=Date.now();TEAM.ver++;
    try{acctSet('gmteam',JSON.stringify({at:TEAM.at,list:list}));}catch(e2){}
  }catch(e){}finally{TEAM.loading=false;}
  return TEAM.list;
}
function nrm(s){s=String(s||'').trim();try{return noAccent(s).toLowerCase();}catch(e){return s.toLowerCase();}}
var _calc=null,_calcKey='';
function calcTeam(){
  if(window.dreamMode)return _calc; // cây mơ ước không phải người thật
  var nodes=window.treeNodes||[];
  var meUid=(window.fbUser&&fbUser.uid)||'';
  var key=[TEAM.ver,nodes.length,G?G.ch:0,G?G.grad:'',window.viewOnlyMode?1:0,Math.floor(Date.now()/30000)].join('|');
  if(_calc&&key===_calcKey)return _calc;
  var byCode={},byName={},nameCnt={};
  (TEAM.list||[]).forEach(function(e){if(e.uid===meUid&&!window.viewOnlyMode)return;var c=nrm(e.c);if(c)byCode[c]=e;var nn=nrm(e.n);if(nn){byName[nn]=e;nameCnt[nn]=(nameCnt[nn]||0)+1;}});
  var root=nodes.find(function(n){return !n.parentId;})||null;
  function stOf(n){
    if(!n)return null;
    if(root&&n.id===root.id&&G&&!window.viewOnlyMode)return {done:doneCount(),ch:G.ch,grad:G.grad,start:G.start,me:1};
    var c=nrm(n.idCode);if(c)return byCode[c]||null;
    var nn=nrm(n.name);return (nn&&nameCnt[nn]===1)?byName[nn]:null;
  }
  var mt=null;try{mt=_enMineTop();}catch(e){}
  var byId={},nodeByName={};nodes.forEach(function(n){byId[n.id]=n;if(n.name&&!nodeByName[n.name])nodeByName[n.name]=n;});
  function ownerId(n){try{var o=enOwnerOf(n,mt);return (o&&o.id)||n.id;}catch(e){return n.id;}}
  var P={},own={};
  nodes.forEach(function(n){var pid=ownerId(n);own[n.id]=pid;var p=P[pid]||(P[pid]={pid:pid,ids:[],st:null,f1:{},tier:0,fast:0});p.ids.push(n.id);
    var s=stOf(n);if(s&&(!p.st||(s.grad&&!p.st.grad)||(+s.done||0)>(+p.st.done||0)))p.st=s;});
  Object.keys(P).forEach(function(pid){P[pid].node=byId[pid]||byId[P[pid].ids[0]];});
  nodes.forEach(function(n){
    if(!n.f1of)return;var sp=nodeByName[n.f1of];if(!sp)return;
    var a=own[sp.id],b=own[n.id];if(!a||!b||a===b)return;P[a].f1[b]=1;
  });
  function baseTier(p){
    if(!p.st||!p.st.grad)return 0; // biết dùng mới dẫn: chính mình phải xong Hành trình
    var ks=Object.keys(p.f1),acc=0,gr=0,fast=0;
    ks.forEach(function(k){var s=P[k]&&P[k].st;if(!s)return;acc++;if(s.grad){gr++;var t0=new Date(s.start).getTime(),t1=new Date(s.grad).getTime();if(t0&&t1&&t1-t0<=48*3600e3)fast++;}});
    p.f1n=ks.length;p.f1acc=acc;p.f1grad=gr;p.fast=fast;
    var r=acc?gr/acc:0;
    if(gr>=5&&r>=0.7)return 3;if(gr>=3&&r>=0.5)return 2;if(gr>=1)return 1;return 0;
  }
  Object.keys(P).forEach(function(pid){var p=P[pid];p.f1n=Object.keys(p.f1).length;p.f1acc=0;p.f1grad=0;p.tier=baseTier(p);});
  Object.keys(P).forEach(function(pid){var p=P[pid];if(p.tier>=2){var lead=Object.keys(p.f1).filter(function(k){return P[k]&&P[k].tier>=1;}).length;p.f1lead=lead;if(lead>=2)p.tier=4;}});
  _calc={P:P,own:own,root:root,mePid:root?own[root.id]:null};_calcKey=key;
  return _calc;
}
function tierOf(p){return TIER[(p&&p.tier)||0];}
function nextTierText(p){
  if(!p||!p.st||!p.st.grad)return 'Xong Hành trình của bạn trước: biết dùng mới dẫn. Khi đó F1 nào tốt nghiệp đều được tính.';
  var gr=p.f1grad||0,acc=p.f1acc||0,pct=acc?Math.round(gr/acc*100):0;
  if(p.tier===0)return 'Lên 🥉 Đồng: cần 1 F1 tốt nghiệp Hành trình.';
  if(p.tier===1)return 'Lên 🥈 Bạc: cần 3 F1 tốt nghiệp và từ 50% F1 đã vào app (hiện '+gr+' người, '+pct+'%).';
  if(p.tier===2)return 'Lên 🥇 Vàng: cần 5 F1 tốt nghiệp và từ 70% (hiện '+gr+' người, '+pct+'%). Hoặc 💎 Kim cương: có 2 F1 đạt từ 🥉 Đồng trở lên.';
  if(p.tier===3)return 'Lên 💎 Kim cương: có 2 F1 của bạn cũng đạt từ 🥉 Đồng trở lên (nhân bản 2 tầng).';
  return 'Bạn đã ở bậc cao nhất. Tiếp tục giúp F1 của mình lên huy hiệu.';
}
function stText(s){
  if(!s)return 'Chưa vào Hành trình';
  if(s.grad)return '🎓 Tốt nghiệp '+fmtD(s.grad);
  return 'Chương '+Math.min(6,s.ch||1)+'/6 · '+(s.done||0)+'/'+ST.length+' bước';
}
function stuck(s){if(!s||s.grad)return false;var t=new Date(s.start).getTime();return t&&Date.now()-t>3*864e5;}
function personName(p){return (p&&p.node&&p.node.name)||'';}
function nudgeText(p){
  var nm=personName(p),s=p.st;
  if(!s)return 'Chào '+nm+', app Tâm An giờ có Hành trình 20 bước: khoảng 50 phút là dùng thạo cả app, bước nào cũng có nút "Đưa tôi tới đó" chỉ đúng chỗ.\nMở app: '+appUrl()+'\nChưa có tài khoản thì nhắn mình để lấy mã mời nhé!';
  var left=Math.max(0,ST.length-(s.done||0)),c=Math.min(6,s.ch||1);
  return 'Chào '+nm+', mình thấy bạn đang ở Chương '+c+' · '+CH[c-1].n+' của Hành trình Tâm An. Còn '+left+' bước nữa là xong, mỗi bước chỉ 1–5 phút.\nMở app, bấm "Đưa tôi tới đó" là app chỉ đúng chỗ. Kẹt chỗ nào nhắn mình, mình làm cùng bạn!';
}
function congratsText(p){return '🎉 Chúc mừng '+personName(p)+' đã tốt nghiệp Hành trình Tâm An! Giờ bạn dùng được cả app rồi. Bước tiếp theo: kèm F1 của bạn cùng đi để nhận huy hiệu Người dẫn 🥉 nhé!';}
var _teamRows=[];

/* ---------- Giao diện ---------- */
var CSS='\
.gm-card{position:fixed;left:10px;bottom:10px;z-index:450;width:340px;max-width:calc(100vw - 20px);background:#fff;color:#16302F;border:2px solid #0F766E;border-radius:14px;box-shadow:0 8px 28px rgba(0,0,0,.18);font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;padding:12px 14px}\
.gm-hd{display:flex;align-items:center;gap:8px;margin-bottom:6px}\
.gm-hd b{flex:1;font-size:14px}\
.gm-demo{font-size:10px;font-weight:800;letter-spacing:.06em;background:#F07B30;color:#fff;border-radius:5px;padding:1px 6px}\
.gm-x{border:none;background:#EEF5F3;color:#16302F;border-radius:8px;width:28px;height:28px;font-size:16px;cursor:pointer}\
.gm-chp{font-size:12px;color:#4A6766;margin-bottom:4px}\
.gm-bar{height:7px;background:#E2EEEB;border-radius:5px;overflow:hidden;margin-bottom:10px}\
.gm-bar i{display:block;height:100%;background:#0F766E;border-radius:5px;transition:width .4s}\
.gm-no{font-size:12px;color:#4A6766}\
.gm-t{font-weight:700;font-size:15px;margin:1px 0 3px}\
.gm-why{font-size:13px;color:#2F4B4A}\
.gm-how{font-size:12.5px;color:#4A6766;background:#F3F8F7;border-radius:8px;padding:6px 8px;margin-top:6px}\
.gm-acts{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}\
.gm-go{flex:1;border:none;background:#0F766E;color:#fff;font-weight:700;border-radius:9px;padding:9px 12px;cursor:pointer;font-size:14px}\
.gm-sk{border:1px solid #C9DCD8;background:#fff;color:#4A6766;border-radius:9px;padding:8px 12px;cursor:pointer;font-size:13px}\
.gm-links{display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:8px}\
.gm-links button{border:none;background:none;color:#1D63B8;padding:0;cursor:pointer;font-size:12.5px;text-decoration:underline}\
.gm-pill{position:fixed;left:10px;bottom:10px;z-index:450;border:2px solid #0F766E;background:#fff;color:#0F766E;font-weight:800;border-radius:22px;padding:8px 14px;box-shadow:0 6px 20px rgba(0,0,0,.18);cursor:pointer;font-size:13.5px;max-width:calc(100vw - 20px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\
.gm-locked{opacity:.45!important;filter:grayscale(1);outline:1.5px dashed #8FA9A6;outline-offset:-3px}\
.mtab.gm-locked::after,.stab.gm-locked::after,.tbtn.gm-locked::after{content:" 🔒"}\
.home-card.gm-locked::after{content:"🔒 Mở ở chương " attr(data-gm-ch);display:block;font-size:11.5px;font-weight:700;color:#4A6766;margin-top:4px}\
.home-card.gm-locked[data-gm-ch="TN"]::after{content:"🔒 Mở khi xong buổi đầu"}\
.gm-spot{outline:3px solid #F07B30!important;outline-offset:3px;animation:gmPulse 1s ease-in-out 6;position:relative;z-index:5}\
@keyframes gmPulse{0%,100%{box-shadow:0 0 0 0 rgba(240,123,48,.55)}50%{box-shadow:0 0 0 10px rgba(240,123,48,0)}}\
@media (prefers-reduced-motion:reduce){.gm-spot{animation:none}}\
.gm-ov{position:fixed;inset:0;z-index:2500;background:rgba(10,30,30,.5);display:flex;align-items:center;justify-content:center;padding:14px}\
.gm-box{background:#fff;color:#16302F;border-radius:16px;max-width:520px;width:100%;max-height:88vh;overflow:auto;padding:18px;font:14px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif}\
.gm-box.wide{max-width:680px}\
.gm-box h3{margin:0 0 4px;font-size:18px}\
.gm-box h4{margin:16px 0 6px;font-size:15px}\
.gm-chl{border-top:1px solid #E2EEEB;padding:10px 0}\
.gm-chl b{display:block}\
.gm-row{display:flex;gap:8px;font-size:13px;padding:2px 0}\
.gm-row span:first-child{width:20px;text-align:center}\
.gm-row.done{color:#4A6766}\
.gm-row.cur{font-weight:700;color:#0F766E}\
.gm-foot{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}\
.gm-foot button{border:1px solid #C9DCD8;background:#fff;color:#16302F;border-radius:9px;padding:8px 12px;cursor:pointer;font-size:13px}\
.gm-foot .pri{background:#0F766E;border-color:#0F766E;color:#fff;font-weight:700}\
.gm-big{font-size:46px;text-align:center;line-height:1.1}\
.gm-badges{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}\
.gm-badges span{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:#E9F6F3;font-size:18px}\
.gm-badges span.off{filter:grayscale(1);opacity:.35}\
.gm-tier{border:1.5px solid #E6C96B;background:#FFF9E8;border-radius:10px;padding:10px 12px;margin-top:8px}\
.gm-tier b{font-size:15px}\
.gm-tbl{width:100%;border-collapse:collapse;font-size:13px}\
.gm-tbl td{padding:6px 4px;border-bottom:1px solid #E2EEEB;vertical-align:middle}\
.gm-tbl td:last-child{text-align:right;white-space:nowrap}\
.gm-tbl button{border:1px solid #C9DCD8;background:#fff;border-radius:7px;padding:3px 8px;cursor:pointer;font-size:12px}\
.gm-warn{color:#B45309;font-size:11.5px}\
.gm-stat{display:flex;flex-wrap:wrap;gap:8px}\
.gm-stat div{flex:1;min-width:92px;background:#F3F8F7;border-radius:9px;padding:8px;text-align:center}\
.gm-stat b{display:block;font-size:18px}\
.gm-rules{font-size:12.5px;color:#3E5857;padding-left:18px;margin:4px 0}\
.gm-nb{position:absolute;left:2px;bottom:1px;font-size:14px;line-height:1;pointer-events:none;z-index:4;letter-spacing:-1px;text-shadow:0 0 2px #fff}\
#gm-sb-box{padding-bottom:0}\
.gm-sb-card{border:2px solid #0F766E;background:#E9F6F3;color:#16302F;border-radius:12px;padding:12px 14px;margin-top:12px}\
#gm-sb-btn{margin-top:10px;border:none;background:#0F766E;color:#fff;font-weight:800;font-size:14px;border-radius:10px;padding:10px 16px;cursor:pointer}\
.gm-sb-note{font-size:12.5px;color:#3E5857;margin-top:6px}\
.gm-sbline{font-size:12px;color:#8A4B00;background:#FFF4E5;border-radius:7px;padding:4px 8px;margin-bottom:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}\
.gm-sbline button{border:none;background:none;color:#1D63B8;text-decoration:underline;cursor:pointer;font-size:12px;padding:0}\
html.gm-sb #tab-admin,html.gm-sb .home-card[data-main="admin"]{display:none!important}\
';
function ensureUi(){
  if(!$('#gm-style')){var st=document.createElement('style');st.id='gm-style';st.textContent=CSS;document.head.appendChild(st);}
  if(!$('#gm-root')){var d=document.createElement('div');d.id='gm-root';document.body.appendChild(d);d.addEventListener('click',onUi);}
}
function myTierIcon(){try{var c=calcTeam();var p=c&&c.P[c.mePid];return p?tierOf(p).i:'';}catch(e){return '';}}
var _lastHtml='';
function render(){
  ensureUi();
  var root=$('#gm-root');
  if(!active()){if(_lastHtml){$$('.gm-card, .gm-pill',root).forEach(function(x){x.remove();});_lastHtml='';}return;}
  var h='',n=doneCount(),pct=Math.round(n/ST.length*100),teamOk=isOpen(7);
  var teamLink=teamOk?'<button data-gm="team">🏅 Hành trình đội</button>':'';
  if(G.ch>6){
    var ti=myTierIcon();
    h=G.min?'<button class="gm-pill" data-gm="max">🎓'+(ti?' '+ti:'')+' Hành trình đội</button>'
      :'<div class="gm-card" role="region" aria-label="Hành trình Tâm An"><div class="gm-hd">'+badge()+'<b>Hành trình Tâm An</b><button class="gm-x" data-gm="min" aria-label="Thu nhỏ">–</button></div>'
      +sbLine()+'<div class="gm-bar"><i style="width:100%"></i></div><div class="gm-t">🎓 Bạn đã xong Hành trình'+(ti?' · '+ti:'')+'</div><div class="gm-why">Giờ là lúc kèm F1 của bạn cùng đi. Mỗi F1 tốt nghiệp đưa bạn lên huy hiệu Người dẫn.</div>'
      +'<div class="gm-acts"><button class="gm-go" data-gm="team">🏅 Hành trình đội</button></div><div class="gm-links"><button data-gm="list">Cả hành trình</button><button data-gm="min">Thu nhỏ</button></div></div>';
  }else{
    var s=curStep();if(!s)return; // chương vừa xong: lượt kiểm tra kế tiếp sẽ chuyển chương
    if(G.min)h='<button class="gm-pill" data-gm="max">'+(SB_ON?'🧪 ':'')+'🎯 Bước '+stepNo(s)+'/'+ST.length+' · '+esc(s.t)+'</button>';
    else{
      h='<div class="gm-card" role="region" aria-label="Hành trình Tâm An"><div class="gm-hd">'+badge()+'<b>Hành trình Tâm An</b><button class="gm-x" data-gm="min" aria-label="Thu nhỏ">–</button></div>'
       +sbLine()+'<div class="gm-chp">Chương '+G.ch+'/6 · '+esc(CH[G.ch-1].n)+' · '+n+'/'+ST.length+' bước</div><div class="gm-bar"><i style="width:'+pct+'%"></i></div>'
       +'<div class="gm-no">Việc tiếp theo · bước '+stepNo(s)+' · khoảng '+s.m+' phút</div><div class="gm-t">'+esc(s.t)+'</div>'
       +'<div class="gm-why">'+esc(s.why)+'</div><div class="gm-how">'+esc(s.how)+'</div>'
       +'<div class="gm-acts">'+(s.copy?'<button class="gm-go" data-gm="report">📋 Copy tin báo</button>':'<button class="gm-go" data-gm="go">Đưa tôi tới đó</button>')
       +(s.noSkip?'':'<button class="gm-sk" data-gm="skip">Bỏ qua</button>')+'</div>'
       +'<div class="gm-links"><button data-gm="list">Cả hành trình</button>'+teamLink+(G.lock&&!G.openAll?'<button data-gm="all">Mở tất cả</button>':'')+'</div></div>';
    }
  }
  if(h!==_lastHtml){
    $$('.gm-card, .gm-pill',root).forEach(function(x){x.remove();}); // giữ nguyên hộp thoại #gm-ov nếu đang mở
    root.insertAdjacentHTML('afterbegin',h);_lastHtml=h;
  }
}
function badge(){return SB_ON?'<span class="gm-demo">CHƠI THỬ</span>':'';}
function sbLine(){return SB_ON?'<div class="gm-sbline">🧪 Tài khoản giả lập · chỉ lưu trên máy này <button data-gm="sbreset">Làm lại từ đầu</button></div>':'';}
function closeOv(){var o=$('#gm-ov');if(o)o.remove();}
function chBadgesHtml(done,ch,grad){
  var h='<div class="gm-badges">';
  CH_BADGE.forEach(function(b,i){var ok=grad||(ch>i+1);h+='<span class="'+(ok?'':'off')+'" title="Chương '+(i+1)+' · '+esc(CH[i].n)+'">'+b+'</span>';});
  return h+'</div>';
}
function showList(){
  closeOv();
  var h='<div class="gm-ov" id="gm-ov"><div class="gm-box" role="dialog" aria-label="Cả hành trình"><h3>Hành trình Tâm An</h3><div class="gm-no">'+doneCount()+'/'+ST.length+' bước · đã chơi khoảng '+totalMin()+' phút</div>'+chBadgesHtml(doneCount(),G.ch,G.grad);
  CH.forEach(function(c,i){
    var cn=i+1;h+='<div class="gm-chl"><b>'+CH_BADGE[i]+' Chương '+cn+' · '+esc(c.n)+(isOpen(cn)?'':' 🔒')+'</b><div class="gm-no">"'+esc(c.q)+'"</div>';
    chSteps(cn).forEach(function(s){
      var st=stepState(s),cur=(G.ch===cn&&curStep()===s);
      h+='<div class="gm-row '+(st==='done'?'done':cur?'cur':'')+'"><span>'+(st==='done'?'✅':st==='skip'?'⏭':cur?'👉':'○')+'</span><span>'+stepNo(s)+'. '+esc(s.t)+(st==='skip'?' <button class="gm-sk" style="padding:1px 8px;font-size:12px" data-gm="unskip" data-gm-id="'+s.id+'">Làm lại</button>':'')+'</span></div>';
    });
    h+='</div>';
  });
  h+='<div class="gm-foot"><button class="pri" data-gm="close">Đóng</button><button data-gm="test">📋 Copy kết quả</button>'+(isOpen(7)?'<button data-gm="team">🏅 Hành trình đội</button>':'')+(SB_ON?'<button data-gm="sbreset">🧪 Làm lại từ đầu</button>':'')+(G.lock&&!G.openAll&&!G.grad?'<button data-gm="all">Mở tất cả</button>':'')+'</div></div></div>';
  $('#gm-root').insertAdjacentHTML('beforeend',h);
}
function showGrad(){
  closeOv();
  var h='<div class="gm-ov" id="gm-ov"><div class="gm-box" role="dialog" aria-label="Tốt nghiệp Hành trình"><div class="gm-big">🎓</div><h3 style="text-align:center">Chúc mừng '+esc(myName())+'!</h3>'
   +'<p style="text-align:center">Bạn đã đi xong Hành trình: '+doneCount()+'/'+ST.length+' bước. '+(G.lock?'<b>Toàn bộ app đã mở.</b>':'')+'</p>'+chBadgesHtml(ST.length,7,true)
   +'<p class="gm-how">Bước tiếp theo: kèm F1 của bạn cùng đi Hành trình. Mỗi F1 tốt nghiệp đưa bạn lên huy hiệu Người dẫn 🥉 🥈 🥇 💎.</p>'
   +'<div class="gm-foot" style="justify-content:center"><button class="pri" data-gm="team">🏅 Hành trình đội</button><button data-gm="close">Vào app</button></div></div></div>';
  $('#gm-root').insertAdjacentHTML('beforeend',h);
}
function showTeam(){
  closeOv();ensureUi();
  if(!TEAM.list&&!SB_ON&&window.fbDb&&!TEAM.loading){ // tải 1 lần; chỉ vẽ lại khi THỰC SỰ có số liệu mới (tránh vòng lặp vẽ lại khi mất mạng)
    var v0=TEAM.ver;teamFetch(false).then(function(){if(TEAM.ver!==v0&&$('#gm-ov[data-team]'))showTeam();});
  }
  var c=calcTeam()||{P:{}},me=c.P[c.mePid]||null,t=tierOf(me),isQtv=!!window.isBranchAdmin;
  var h='<div class="gm-ov" id="gm-ov" data-team="1"><div class="gm-box wide" role="dialog" aria-label="Hành trình đội"><h3>🏅 Hành trình đội</h3>';
  if(window.dreamMode)h+='<p class="gm-how">Bạn đang mở 🌠 Cây mơ ước. Chuyển về cây Nhị phân để xem số liệu đội thật.</p>';
  h+='<div class="gm-no">Hành trình của tôi: '+(G?doneCount():0)+'/'+ST.length+' bước'+(G&&G.grad?' · 🎓 tốt nghiệp '+fmtD(G.grad):'')+'</div>'+chBadgesHtml(G?doneCount():0,G?G.ch:1,G&&G.grad);
  h+='<div class="gm-tier"><b>'+(t.i?t.i+' '+t.n:'Chưa có huy hiệu Người dẫn')+'</b>'
    +(me&&me.st&&me.st.grad?'<div class="gm-no">F1 tốt nghiệp: '+(me.f1grad||0)+' / '+(me.f1acc||0)+' F1 đã vào Hành trình ('+(me.f1n||0)+' F1 trên cây)'+(me.fast>=3?' · ⚡ Dẫn nhanh':'')+'</div>':'')
    +'<div class="gm-no" style="margin-top:4px">'+esc(nextTierText(me))+'</div></div>';
  // F1 của tôi
  var f1=me?Object.keys(me.f1).map(function(k){return c.P[k];}).filter(Boolean):[];
  f1.sort(function(a,b){var sa=a.st,sb=b.st;var va=sa?(sa.grad?2:1):0,vb=sb?(sb.grad?2:1):0;if(va!==vb)return va-vb;return personName(a).localeCompare(personName(b));});
  _teamRows=f1;
  h+='<h4>F1 của tôi · '+f1.length+' người</h4>';
  if(!f1.length)h+='<p class="gm-no">Chưa có ID nào ghi "Bảo trợ (F1 của ai)" là bạn trên cây. Khi bạn bảo trợ người mới và điền đúng ô này, họ sẽ hiện ở đây.</p>';
  else{
    h+='<table class="gm-tbl">';
    f1.forEach(function(p,i){var s=p.st,ti2=tierOf(p).i;
      h+='<tr><td><b>'+esc(personName(p))+'</b>'+(ti2?' '+ti2:'')+'<br><span class="gm-no">'+esc(stText(s))+'</span>'+(stuck(s)?' <span class="gm-warn">· đã quá 3 ngày</span>':'')+'</td>'
        +'<td>'+(s&&s.grad?'<button data-gm="cg" data-gm-i="'+i+'">🎉 Chúc mừng</button>':'<button data-gm="nudge" data-gm-i="'+i+'">📋 Nhắc</button>')+'</td></tr>';});
    h+='</table>';
  }
  // Cả nhánh
  var all=Object.keys(c.P).map(function(k){return c.P[k];}).filter(function(p){return p.pid!==c.mePid;});
  var inJ=all.filter(function(p){return p.st;}).length,gr=all.filter(function(p){return p.st&&p.st.grad;}).length,stk=all.filter(function(p){return stuck(p.st);}).length,leaders=all.filter(function(p){return p.tier>0;}).length;
  h+='<h4>Cả nhánh trên cây của tôi</h4><div class="gm-stat"><div><b>'+all.length+'</b>người</div><div><b>'+inJ+'</b>đã vào Hành trình</div><div><b>'+gr+'</b>tốt nghiệp'+(all.length?' ('+Math.round(gr/all.length*100)+'%)':'')+'</div><div><b>'+stk+'</b>quá 3 ngày chưa xong</div><div><b>'+leaders+'</b>có huy hiệu Người dẫn</div></div>';
  if(isQtv){
    var hon=all.concat(me?[me]:[]).filter(function(p){return p.tier>0;}).sort(function(a,b){return b.tier-a.tier||personName(a).localeCompare(personName(b));});
    h+='<h4>Vinh danh Người dẫn (QTV)</h4>';
    if(!hon.length)h+='<p class="gm-no">Chưa có ai đạt huy hiệu Người dẫn.</p>';
    else{h+='<table class="gm-tbl">';hon.forEach(function(p){h+='<tr><td>'+tierOf(p).i+' <b>'+esc(personName(p))+'</b><br><span class="gm-no">'+tierOf(p).n+' · '+(p.f1grad||0)+' F1 tốt nghiệp'+(p.fast>=3?' · ⚡ Dẫn nhanh':'')+'</span></td><td></td></tr>';});h+='</table>';}
  }
  h+='<h4>Cách lên huy hiệu</h4><ul class="gm-rules"><li>Chính bạn phải xong Hành trình trước: biết dùng mới dẫn.</li><li>🥉 Đồng: 1 F1 tốt nghiệp · 🥈 Bạc: 3 F1 và từ 50% · 🥇 Vàng: 5 F1 và từ 70%.</li><li>💎 Kim cương: từ Bạc trở lên và có 2 F1 cũng đạt huy hiệu Người dẫn (nhân bản 2 tầng).</li><li>⚡ Dẫn nhanh: 3 F1 tốt nghiệp trong 48 giờ kể từ lúc họ bắt đầu.</li><li>F1 = ID trên cây có ô "Bảo trợ (F1 của ai)" là bạn. Nhiều ID của cùng một người tính là một người. % tính trên F1 đã vào Hành trình.</li></ul>';
  h+='<div class="gm-foot"><button class="pri" data-gm="close">Đóng</button>'+(isQtv&&!SB_ON?'<button data-gm="honor">📋 Copy bảng vinh danh</button>':'')+(SB_ON?'':'<button data-gm="tref">🔄 Cập nhật</button>')+'<span class="gm-no" style="align-self:center">'+(SB_ON?'Chế độ chơi thử không có dữ liệu đội.':(TEAM.at?'Số liệu lúc '+fmtT(new Date(TEAM.at).toISOString()):(TEAM.loading?'Đang tải…':'')))+'</span></div></div></div>';
  $('#gm-root').insertAdjacentHTML('beforeend',h);
}
function honorText(){
  var c=calcTeam();if(!c)return '';
  var hon=Object.keys(c.P).map(function(k){return c.P[k];}).filter(function(p){return p.tier>0;}).sort(function(a,b){return b.tier-a.tier||personName(a).localeCompare(personName(b));});
  var L=['🏅 VINH DANH NGƯỜI DẪN · Hành trình Tâm An ('+fmtD(new Date().toISOString())+')',''];
  [4,3,2,1].forEach(function(t){var g=hon.filter(function(p){return p.tier===t;});if(!g.length)return;L.push(TIER[t].i+' '+TIER[t].n+': '+g.map(function(p){return personName(p)+(p.fast>=3?' ⚡':'');}).join(', '));});
  if(L.length===2)L.push('Chưa có ai đạt huy hiệu. Cùng kèm F1 đi Hành trình nhé!');
  L.push('','Cảm ơn các anh chị đã kèm tuyến dưới dùng thạo app 💚');
  return L.join('\n');
}
/* Huy hiệu trên ô ID trong cây (🎓 đã tốt nghiệp · 🥉🥈🥇💎 Người dẫn) */
function decorateTree(){
  if(!window.fbUser||window.dreamMode)return;
  var pg=$('#page-tree');if(!pg||!pg.classList.contains('on'))return;
  var c=calcTeam();if(!c)return;
  var ver=_calcKey;
  $$('.tnode-box[data-node-id]').forEach(function(box){
    if(box.getAttribute('data-gmv')===ver)return;box.setAttribute('data-gmv',ver);
    var old=box.querySelector('.gm-nb');
    var pid=c.own[box.getAttribute('data-node-id')],p=pid&&c.P[pid];
    var txt=p?((p.st&&p.st.grad?'🎓':'')+tierOf(p).i):'';
    if(!txt){if(old)old.remove();return;}
    if(!old){old=document.createElement('span');old.className='gm-nb';if(getComputedStyle(box).position==='static')box.style.position='relative';box.appendChild(old);}
    old.textContent=txt;old.title=(p.st&&p.st.grad?'Đã tốt nghiệp Hành trình':'')+(p.tier?(p.st&&p.st.grad?' · ':'')+tierOf(p).n:'');
  });
}
function teamButton(){
  var anchor=$('#btn-myids');if(!anchor||$('#btn-gm-team'))return;
  var b=document.createElement('button');b.className='tbtn';b.id='btn-gm-team';b.type='button';b.textContent='🏅 Hành trình đội';
  b.addEventListener('click',function(){if(!active())return;showTeam();});
  anchor.parentNode.insertBefore(b,anchor.nextSibling);
}
function onUi(e){
  var b=e.target.closest('[data-gm]');
  if(!b){if(e.target.id==='gm-ov')closeOv();return;}
  var a=b.getAttribute('data-gm'),i=+b.getAttribute('data-gm-i');
  if(a==='min'){G.min=true;save();render();}
  else if(a==='max'){G.min=false;save();render();}
  else if(a==='go'){var s=curStep();if(s&&s.go){if(window.innerWidth<700){G.min=true;save();render();}try{s.go();}catch(err){}}} // điện thoại: thu thẻ để thấy chỗ cần làm
  else if(a==='skip'){var s2=curStep();if(s2&&!s2.noSkip){G.skip[s2.id]=1;save();toast('⏭ Đã bỏ qua. Bước này vẫn nằm trong "Cả hành trình" để làm lại.');tick();}}
  else if(a==='unskip'){delete G.skip[b.getAttribute('data-gm-id')];save();closeOv();tick();toast('👉 Bước này đã quay lại hàng chờ.');}
  else if(a==='report'){try{copyText(reportText());}catch(err){}if(!G.flags.report){G.flags.report=new Date().toISOString();save();}setTimeout(tick,60);}
  else if(a==='test'){try{copyText(testText());}catch(err){}}
  else if(a==='team'){showTeam();}
  else if(a==='nudge'){if(_teamRows[i])try{copyText(nudgeText(_teamRows[i]));}catch(err){}}
  else if(a==='cg'){if(_teamRows[i])try{copyText(congratsText(_teamRows[i]));}catch(err){}}
  else if(a==='honor'){try{copyText(honorText());}catch(err){}}
  else if(a==='tref'){toast('⏳ Đang cập nhật số liệu đội…');teamFetch(true).then(function(){_calc=null;if($('#gm-ov[data-team]'))showTeam();});}
  else if(a==='sbreset'){closeOv();sbReset();}
  else if(a==='list'){showList();}
  else if(a==='close'){closeOv();}
  else if(a==='all'){if(confirm('Mở tất cả tính năng ngay? Thẻ Hành trình vẫn ở đây để bạn đi tiếp nếu muốn.')){G.openAll=true;save(true);closeOv();applyLocks();render();toast('🔓 Đã mở tất cả tính năng');}}
}

/* ---------- Móc vào app (không sửa code gốc) ---------- */
function wrap(name,fn){var o=window[name];if(typeof o!=='function')return;window[name]=fn(o);}
wrap('startOnboarding',function(o){return async function(){
  prefsReady=false;
  try{return await o.apply(this,arguments);}
  finally{
    prefsReady=true;G=null;_lastHtml='';_calc=null;TEAM.list=null;TEAM.at=0;_pubLast='';
    if(eligible()){loadState();teamCacheLoad();tick();setTimeout(function(){teamFetch(false);},20000);}else render();
  }
};});
wrap('checkTutorial',function(o){return function(next){
  if(window.fbUser&&!window.viewOnlyMode&&isNewAcct()){_prefs.tutSeen=1;try{savePrefs();}catch(e){}(next||function(){})();return;}
  return o.apply(this,arguments);};});
wrap('checkWhatsNew',function(o){return function(next){
  if(window.fbUser&&!window.viewOnlyMode&&isNewAcct()){
    var seen=((_prefs&&_prefs.wnSeen)||[]).slice();(window.WHATS_NEW||[]).forEach(function(it){if(seen.indexOf(it.id)<0)seen.push(it.id);});
    _prefs.wnSeen=seen;try{savePrefs();}catch(e){}
    try{(next||checkRequiredUpdates)();}catch(e){}return Promise.resolve();}
  return o.apply(this,arguments);};});
wrap('renderHomePage',function(o){return function(){var r=o.apply(this,arguments);try{applyLocks();}catch(e){}return r;};});
wrap('openModal',function(o){return function(mid,type){var r=o.apply(this,arguments);if(type==='kn')setFlag('skill');return r;};});
wrap('skSelectCond',function(o){return function(v){var r=o.apply(this,arguments);if(v)setFlag('sk');return r;};});

/* ---------- CHẾ ĐỘ CHƠI THỬ — CHỈ QTV: tài khoản giả lập trên máy, không cần email ----------
   • Chỉ QTV đang đăng nhập (isBranchAdmin) mới thấy nút, ở đầu tab ⚙️ Quản trị.
   • Bấm → lưu cờ gắn với uid của QTV rồi tải lại trang. Lúc app đăng nhập lại, thay vì vào tài khoản thật,
     app vào tài khoản giả lập (không nạp dữ liệu thật). Tài khoản QTV KHÔNG bị đăng xuất.
   • Tắt hẳn Firestore (fbDb=null) → không đọc/ghi gì lên hệ thống; dữ liệu chơi thử chỉ nằm trong localStorage máy này.
   • Nút "Thoát" của app bị chặn (để không đăng xuất tài khoản thật) → thoát chơi thử, quay về tài khoản QTV. */
var SB_KEY='ta_sandbox',SB_ON=false,SB_USER=null,_sbEntered=false,_origEnter=window.enterAppFirebase;
function sbLoad(){try{var o=JSON.parse(localStorage.getItem(SB_KEY)||'null');return (o&&o.uid)?o:null;}catch(e){return null;}}
function sbSave(o){try{localStorage.setItem(SB_KEY,JSON.stringify(o));}catch(e){}}
function sbNewFor(owner){var id=('thu'+Date.now().toString(36)+Math.random().toString(36).slice(2,10)).slice(0,20);var o={uid:id,created:new Date().toISOString(),on:false,owner:owner||''};sbSave(o);return o;}
function sbUserOf(o){return {uid:o.uid,email:'choi-thu@may-nay',displayName:'Người chơi thử',emailVerified:true,isAnonymous:true,providerData:[],metadata:{creationTime:o.created,lastSignInTime:new Date().toISOString()}};}
function sbEnter(){
  if(_sbEntered)return;
  var o=sbLoad();if(!o)return;
  SB_ON=true;SB_USER=sbUserOf(o);_sbEntered=true;
  document.documentElement.classList.add('gm-sb');
  window.fbDb=null;window.fbUser=SB_USER;
  try{_origEnter.call(window,SB_USER);}catch(e){try{console.error(e);}catch(e2){}}
}
function sbGuard(){if(SB_ON){if(window.fbDb)window.fbDb=null;if(window.fbUser!==SB_USER)window.fbUser=SB_USER;}}
function sbExit(){var o=sbLoad();if(o){o.on=false;sbSave(o);}location.reload();}
function sbStart(){
  if(!(window.isBranchAdmin&&window.fbUser&&!window.viewOnlyMode&&!SB_ON)){toast('Chỉ QTV mới dùng được chế độ chơi thử.');return;}
  if(!confirm('Vào chế độ chơi thử bằng một tài khoản giả lập? Tài khoản QTV của bạn vẫn giữ đăng nhập; bấm Thoát lúc chơi thử là quay về.'))return;
  var o=sbLoad();if(!o||o.owner!==fbUser.uid)o=sbNewFor(fbUser.uid);
  o.on=true;sbSave(o);location.reload();
}
function sbReset(){
  if(!confirm('Làm lại từ đầu? Toàn bộ dữ liệu chơi thử trên máy này sẽ bị xoá và tạo người chơi mới.'))return;
  var o=sbLoad();
  if(o){var pfx='ta_'+o.uid.slice(0,16)+'_',ks=[];for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf(pfx)===0)ks.push(k);}ks.forEach(function(k){try{localStorage.removeItem(k);}catch(e){}});}
  var n=sbNewFor(o&&o.owner);n.on=true;sbSave(n);location.reload();
}
if(typeof _origEnter==='function'){
  window.enterAppFirebase=function(user){
    if(SB_ON){sbGuard();return;}
    var o=sbLoad();
    if(o&&o.on&&o.owner&&user&&user.uid===o.owner){sbEnter();return;} // QTV đã bật chơi thử trên máy này → vào tài khoản giả lập
    return _origEnter.apply(this,arguments);
  };
}
function sbAdminBox(){
  var pg=$('#page-admin');if(!pg)return;
  var show=!!(window.isBranchAdmin&&window.fbUser&&!window.viewOnlyMode&&!SB_ON),box=$('#gm-sb-box');
  if(!show){if(box)box.remove();return;}
  if(box)return;
  box=document.createElement('div');box.id='gm-sb-box';box.className='content';
  box.innerHTML='<div class="gm-sb-card"><b>🧪 Chơi thử như người mới · chỉ QTV</b>'
    +'<div class="gm-sb-note">Vào app bằng một tài khoản giả lập mới tạo, đi Hành trình buổi đầu đúng như thành viên mới. Không cần email. Dữ liệu chơi thử chỉ lưu trên máy này, không gửi lên hệ thống. Tài khoản QTV vẫn giữ đăng nhập: bấm Thoát lúc chơi thử là quay về.</div>'
    +'<button type="button" id="gm-sb-btn">Bắt đầu chơi thử</button></div>';
  pg.insertBefore(box,pg.firstChild);
  $('#gm-sb-btn').addEventListener('click',sbStart);
}
document.addEventListener('click',function(e){
  if(SB_ON&&e.target&&e.target.closest&&e.target.closest('#btn-logout')){
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    if(confirm('Thoát chế độ chơi thử và quay về tài khoản QTV? Tiến độ chơi thử vẫn giữ trên máy này.'))sbExit();
  }
},true);

setInterval(sbGuard,700);
setInterval(sbAdminBox,1500);
setInterval(tick,1500);
setInterval(heartbeat,5000);
setInterval(function(){try{teamButton();decorateTree();}catch(e){}},2000);
window.__gm={state:function(){return G;},steps:ST,tick:tick,active:active,team:function(){return TEAM;},calc:function(){_calc=null;return calcTeam();},fetch:teamFetch,show:showTeam,honor:honorText};
})();
