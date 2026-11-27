/* ================================================================
   HÀNH TRÌNH TÂM AN — lớp game "buổi đầu" (BẢN DEMO, 27/11/2026)
   • Nạp SAU toàn bộ script của app (thẻ <script src> trước </body>). App gốc không sửa dòng nào.
   • Chỉ chạy cho tài khoản tạo từ GM_FROM trở đi, hoặc khi mở link có ?choi=1 (xem thử).
   • 6 chương · 20 bước. App tự biết bước đã xong nhờ dữ liệu thật → dữ liệu nằm đúng mục, không phải chuyển.
   • Lưu tiến độ trong _prefs.gm (đồng bộ đa thiết bị qua savePrefs).
   ================================================================ */
(function(){
'use strict';
var GM_FROM='2026-11-27';
var FORCE=/[?&]choi=1(&|$)/.test(location.search);
var prefsReady=false,G=null,_saveT=null,_secDirty=0,_lastCh=0;

function $(s,r){return (r||document).querySelector(s);}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
function esc(s){try{return escHtml(s);}catch(e){return String(s||'');}}
function toast(m){try{showToast(m);}catch(e){}}
function realNodes(){try{return _realTreeNodes()||[];}catch(e){return (window.treeNodes||[]);}}
function realMembers(){return (window.dreamMode&&window._dreamSaved)?(_dreamSaved.members||[]):(window.members||[]);}
function realRoot(){return realNodes().find(function(n){return !n.parentId;})||null;}
function dreamNodes(){try{return dreamMode?treeNodes:loadDreamTree().nodes;}catch(e){return [];}}
function flag(k){return function(){return !!(G&&G.flags&&G.flags[k]);};}

/* ---------- Ai được chơi ---------- */
function createdOk(){
  try{var c=fbUser&&fbUser.metadata&&fbUser.metadata.creationTime;if(!c)return false;return new Date(c).getTime()>=new Date(GM_FROM+'T00:00:00').getTime();}catch(e){return false;}
}
function eligible(){return !!(window.fbUser&&!window.viewOnlyMode&&(FORCE||createdOk()));}
function active(){return !!(prefsReady&&G&&eligible()&&!G.hide);}
function isOpen(c){return !c||!G||G.openAll||!!G.grad||c<=G.ch;}

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
  '#btn-export-branch':7,'#btn-import-branch':7,'#btn-idstats':7,'#fab-att':7};
var MAP_FLAG={'locate-me':1,'map-locate':1,'focus-club':1,'dir-to':1,'gp-view':1,'set-radius':1,'map-dir-ab':1};

function selfAttended(){
  try{var r=realRoot();if(!r)return false;var m=realMembers().find(function(x){return x.name===r.name;});if(!m)return false;
    return ['sang','trua','toi'].some(function(t){var v=dGet(m.id,t);return v==='yes'||v==='late';});}catch(e){return false;}
}

/* ---------- Trạng thái ---------- */
function blank(){return {v:1,uid:(window.fbUser&&fbUser.uid)||'',start:new Date().toISOString(),done:{},skip:{},flags:{},sec:{},chAt:{},grad:'',openAll:false,min:false,hide:false,ch:1};}
function loadState(){
  var g=(window._prefs&&_prefs.gm&&typeof _prefs.gm==='object')?_prefs.gm:null;
  if(g&&!(window.fbUser&&g.uid===fbUser.uid))g=null; // _prefs có bản sao trên máy: không nhận tiến độ của tài khoản khác cùng máy
  G=g||blank();['done','skip','flags','sec','chAt'].forEach(function(k){if(!G[k]||typeof G[k]!=='object')G[k]={};});
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
  if(!active())return;
  var changed=false;
  ST.forEach(function(s){
    if(G.done[s.id])return;
    var ok=false;try{ok=!!s.ok();}catch(e){}
    if(ok){G.done[s.id]=new Date().toISOString();delete G.skip[s.id];changed=true;G.min=false;toast('✓ Xong bước '+stepNo(s)+': '+s.t);}
  });
  var c=calcCh();
  if(c!==G.ch){
    var old=G.ch;G.ch=c;changed=true;
    if(c<=6){G.chAt[c]=G.chAt[c]||new Date().toISOString();if(c>old)setTimeout(function(){toast('🎉 Xong chương '+old+'! Đã mở: '+CH[c-1].open);},900);}
    if(c===7&&!G.grad){G.grad=new Date().toISOString();setTimeout(showGrad,700);}
    G.min=false;
  }
  if(!G.chAt[1])G.chAt[1]=G.start;
  if(changed)save();
  applyLocks();fixSub();render();
}
function heartbeat(){
  if(!active()||document.hidden||G.ch>6)return;
  G.sec[G.ch]=Math.round(((G.sec[G.ch]||0)+5)*10)/10;
  if(++_secDirty>=6){_secDirty=0;save();} // ghi thời gian chơi mỗi 30 giây
}

/* ---------- Khoá / mở ---------- */
function mark(el,lock,c){
  if(lock){el.classList.add('gm-locked');el.setAttribute('data-gm-ch',c>=7?'TN':c);}
  else if(el.classList.contains('gm-locked')){el.classList.remove('gm-locked');el.removeAttribute('data-gm-ch');}
}
function applyLocks(){
  var on=active();
  $$('.mtab[data-main], .home-card[data-main]').forEach(function(b){var c=MAIN_CH[b.getAttribute('data-main')];mark(b,on&&!!c&&!isOpen(c),c);});
  $$('.stab[data-sub]').forEach(function(b){var c=SUB_CH[b.getAttribute('data-sub')];mark(b,on&&!!c&&!isOpen(c),c);});
  Object.keys(BTN_CH).forEach(function(sel){$$(sel).forEach(function(b){mark(b,on&&!isOpen(BTN_CH[sel]),BTN_CH[sel]);});});
}
function fixSub(){
  if(!active())return;
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
  var t=e.target.closest('.gm-locked');
  if(t){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();toast(lockMsg(t.getAttribute('data-gm-ch')));return;}
  var a=e.target.closest('[data-add-pid]');
  if(a&&!window.dreamMode&&!isOpen(7)){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();toast('🔒 Thêm người lên cây thật mở khi bạn xong buổi đầu. Bây giờ bạn tập trên 🌠 Cây mơ ước.');return;}
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
function reportText(){
  return '🎉 Em đã đi xong buổi đầu Hành trình Tâm An trên app!\n'
    +'• Tên: '+myName()+(myCode()?'\n• Mã ID: '+myCode():'')+'\n'
    +'• Xong '+(doneCount()+(G.done.report?0:1))+'/'+ST.length+' bước, khoảng '+totalMin()+' phút.\n' // +1: chính bước gửi tin này
    +'Em cảm ơn đã giới thiệu em. Ngày mai em bắt đầu 30 ngày thực chiến ạ!';
}
function fmtT(iso){if(!iso)return '—';var d=new Date(iso);return d.getDate()+'/'+(d.getMonth()+1)+' '+('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);}
function testText(){
  var L=['KẾT QUẢ CHƠI THỬ · Hành trình Tâm An (bản demo)','Người chơi: '+myName()+(myCode()?' · '+myCode():''),
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
.gm-links{display:flex;gap:14px;margin-top:8px}\
.gm-links button{border:none;background:none;color:#1D63B8;padding:0;cursor:pointer;font-size:12.5px;text-decoration:underline}\
.gm-pill{position:fixed;left:10px;bottom:10px;z-index:450;border:2px solid #0F766E;background:#fff;color:#0F766E;font-weight:800;border-radius:22px;padding:8px 14px;box-shadow:0 6px 20px rgba(0,0,0,.18);cursor:pointer;font-size:13.5px}\
.gm-locked{opacity:.45!important;filter:grayscale(1);outline:1.5px dashed #8FA9A6;outline-offset:-3px}\
.mtab.gm-locked::after,.stab.gm-locked::after,.tbtn.gm-locked::after{content:" 🔒"}\
.home-card.gm-locked::after{content:"🔒 Mở ở chương " attr(data-gm-ch);display:block;font-size:11.5px;font-weight:700;color:#4A6766;margin-top:4px}\
.home-card.gm-locked[data-gm-ch="TN"]::after{content:"🔒 Mở khi xong buổi đầu"}\
.gm-spot{outline:3px solid #F07B30!important;outline-offset:3px;animation:gmPulse 1s ease-in-out 6;position:relative;z-index:5}\
@keyframes gmPulse{0%,100%{box-shadow:0 0 0 0 rgba(240,123,48,.55)}50%{box-shadow:0 0 0 10px rgba(240,123,48,0)}}\
@media (prefers-reduced-motion:reduce){.gm-spot{animation:none}}\
.gm-ov{position:fixed;inset:0;z-index:2500;background:rgba(10,30,30,.5);display:flex;align-items:center;justify-content:center;padding:14px}\
.gm-box{background:#fff;color:#16302F;border-radius:16px;max-width:520px;width:100%;max-height:88vh;overflow:auto;padding:18px;font:14px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif}\
.gm-box h3{margin:0 0 4px;font-size:18px}\
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
';
function ensureUi(){
  if(!$('#gm-style')){var st=document.createElement('style');st.id='gm-style';st.textContent=CSS;document.head.appendChild(st);}
  if(!$('#gm-root')){var d=document.createElement('div');d.id='gm-root';document.body.appendChild(d);d.addEventListener('click',onUi);}
}
var _lastHtml='';
function render(){
  ensureUi();
  var root=$('#gm-root');
  if(!active()){if(_lastHtml){root.innerHTML='';_lastHtml='';}return;}
  var h='',n=doneCount(),pct=Math.round(n/ST.length*100);
  if(G.ch>6){
    h=G.min?'<button class="gm-pill" data-gm="max">🎓 Đã xong buổi đầu</button>'
      :'<div class="gm-card" role="region" aria-label="Hành trình Tâm An"><div class="gm-hd"><span class="gm-demo">DEMO</span><b>Hành trình Tâm An</b><button class="gm-x" data-gm="min" aria-label="Thu nhỏ">–</button></div>'
      +'<div class="gm-bar"><i style="width:100%"></i></div><div class="gm-t">🎓 Bạn đã xong buổi đầu</div><div class="gm-why">Toàn bộ app đã mở. Từ ngày mai là 30 ngày thực chiến.</div>'
      +'<div class="gm-acts"><button class="gm-go" data-gm="test">📋 Copy kết quả chơi thử</button></div><div class="gm-links"><button data-gm="list">Cả hành trình</button><button data-gm="hide">Ẩn thẻ này</button></div></div>';
  }else{
    var s=curStep();if(!s)return; // chương vừa xong: lượt kiểm tra kế tiếp sẽ chuyển chương
    if(G.min)h='<button class="gm-pill" data-gm="max">🎯 Bước '+stepNo(s)+'/'+ST.length+' · '+esc(s.t)+'</button>';
    else{
      h='<div class="gm-card" role="region" aria-label="Hành trình Tâm An"><div class="gm-hd"><span class="gm-demo">DEMO</span><b>Hành trình Tâm An</b><button class="gm-x" data-gm="min" aria-label="Thu nhỏ">–</button></div>'
       +'<div class="gm-chp">Chương '+G.ch+'/6 · '+esc(CH[G.ch-1].n)+' · '+n+'/'+ST.length+' bước</div><div class="gm-bar"><i style="width:'+pct+'%"></i></div>'
       +'<div class="gm-no">Việc tiếp theo · bước '+stepNo(s)+' · khoảng '+s.m+' phút</div><div class="gm-t">'+esc(s.t)+'</div>'
       +'<div class="gm-why">'+esc(s.why)+'</div><div class="gm-how">'+esc(s.how)+'</div>'
       +'<div class="gm-acts">'+(s.copy?'<button class="gm-go" data-gm="report">📋 Copy tin báo</button>':'<button class="gm-go" data-gm="go">Đưa tôi tới đó</button>')
       +(s.noSkip?'':'<button class="gm-sk" data-gm="skip">Bỏ qua</button>')+'</div>'
       +'<div class="gm-links"><button data-gm="list">Cả hành trình</button>'+(G.openAll?'':'<button data-gm="all">Mở tất cả</button>')+'</div></div>';
    }
  }
  if(h!==_lastHtml){
    $$('.gm-card, .gm-pill',root).forEach(function(x){x.remove();}); // giữ nguyên hộp thoại #gm-ov nếu đang mở
    root.insertAdjacentHTML('afterbegin',h);_lastHtml=h;
  }
}
function closeOv(){var o=$('#gm-ov');if(o)o.remove();}
function showList(){
  closeOv();
  var h='<div class="gm-ov" id="gm-ov"><div class="gm-box" role="dialog" aria-label="Cả hành trình"><h3>Hành trình buổi đầu</h3><div class="gm-no">'+doneCount()+'/'+ST.length+' bước · đã chơi khoảng '+totalMin()+' phút</div>';
  CH.forEach(function(c,i){
    var cn=i+1;h+='<div class="gm-chl"><b>Chương '+cn+' · '+esc(c.n)+(isOpen(cn)?'':' 🔒')+'</b><div class="gm-no">"'+esc(c.q)+'"</div>';
    chSteps(cn).forEach(function(s){
      var st=stepState(s),cur=(G.ch===cn&&curStep()===s);
      h+='<div class="gm-row '+(st==='done'?'done':cur?'cur':'')+'"><span>'+(st==='done'?'✅':st==='skip'?'⏭':cur?'👉':'○')+'</span><span>'+stepNo(s)+'. '+esc(s.t)+(st==='skip'?' <button class="gm-sk" style="padding:1px 8px;font-size:12px" data-gm="unskip" data-gm-id="'+s.id+'">Làm lại</button>':'')+'</span></div>';
    });
    h+='</div>';
  });
  h+='<div class="gm-foot"><button class="pri" data-gm="close">Đóng</button><button data-gm="test">📋 Copy kết quả chơi thử</button>'+(G.openAll||G.grad?'':'<button data-gm="all">Mở tất cả</button>')+'</div></div></div>';
  $('#gm-root').insertAdjacentHTML('beforeend',h);
}
function showGrad(){
  closeOv();
  var h='<div class="gm-ov" id="gm-ov"><div class="gm-box" role="dialog" aria-label="Tốt nghiệp buổi đầu"><div class="gm-big">🎓</div><h3 style="text-align:center">Chúc mừng '+esc(myName())+'!</h3>'
   +'<p style="text-align:center">Bạn đã đi xong buổi đầu: '+doneCount()+'/'+ST.length+' bước trong khoảng '+totalMin()+' phút. <b>Toàn bộ app đã mở.</b></p>'
   +'<p class="gm-how">Từ ngày mai: điểm danh mỗi ngày để giữ chuỗi, ghi nhật ký buổi tối, và chăm sóc 3 người trong danh sách của bạn.</p>'
   +'<div class="gm-foot" style="justify-content:center"><button class="pri" data-gm="close">Vào app</button><button data-gm="test">📋 Copy kết quả chơi thử</button></div></div></div>';
  $('#gm-root').insertAdjacentHTML('beforeend',h);
}
function onUi(e){
  var b=e.target.closest('[data-gm]');
  if(!b){if(e.target.id==='gm-ov')closeOv();return;}
  var a=b.getAttribute('data-gm');
  if(a==='min'){G.min=true;save();render();}
  else if(a==='max'){G.min=false;save();render();}
  else if(a==='go'){var s=curStep();if(s&&s.go){if(window.innerWidth<700){G.min=true;save();render();}try{s.go();}catch(err){}}} // điện thoại: thu thẻ để thấy chỗ cần làm
  else if(a==='skip'){var s2=curStep();if(s2&&!s2.noSkip){G.skip[s2.id]=1;save();toast('⏭ Đã bỏ qua. Bước này vẫn nằm trong "Cả hành trình" để làm lại.');tick();}}
  else if(a==='unskip'){delete G.skip[b.getAttribute('data-gm-id')];save();closeOv();tick();toast('👉 Bước này đã quay lại hàng chờ.');}
  else if(a==='report'){try{copyText(reportText());}catch(err){}if(!G.flags.report){G.flags.report=new Date().toISOString();save();}setTimeout(tick,60);}
  else if(a==='test'){try{copyText(testText());}catch(err){}}
  else if(a==='list'){showList();}
  else if(a==='close'){closeOv();}
  else if(a==='all'){if(confirm('Mở tất cả tính năng ngay? Thẻ Hành trình vẫn ở đây để bạn đi tiếp nếu muốn.')){G.openAll=true;save(true);closeOv();applyLocks();render();toast('🔓 Đã mở tất cả tính năng');}}
  else if(a==='hide'){G.hide=true;save(true);render();applyLocks();}
}

/* ---------- Móc vào app (không sửa code gốc) ---------- */
function wrap(name,fn){var o=window[name];if(typeof o!=='function')return;window[name]=fn(o);}
wrap('startOnboarding',function(o){return async function(){prefsReady=false;try{return await o.apply(this,arguments);}finally{prefsReady=true;G=null;_lastHtml='';if(eligible()){loadState();tick();}else render();}};});
wrap('checkTutorial',function(o){return function(next){
  if(window.fbUser&&!window.viewOnlyMode&&createdOk()){_prefs.tutSeen=1;try{savePrefs();}catch(e){}(next||function(){})();return;}
  return o.apply(this,arguments);};});
wrap('checkWhatsNew',function(o){return function(next){
  if(window.fbUser&&!window.viewOnlyMode&&createdOk()){
    var seen=((_prefs&&_prefs.wnSeen)||[]).slice();(window.WHATS_NEW||[]).forEach(function(it){if(seen.indexOf(it.id)<0)seen.push(it.id);});
    _prefs.wnSeen=seen;try{savePrefs();}catch(e){}
    try{(next||checkRequiredUpdates)();}catch(e){}return Promise.resolve();}
  return o.apply(this,arguments);};});
wrap('renderHomePage',function(o){return function(){var r=o.apply(this,arguments);try{applyLocks();}catch(e){}return r;};});
wrap('openModal',function(o){return function(mid,type){var r=o.apply(this,arguments);if(type==='kn')setFlag('skill');return r;};});
wrap('skSelectCond',function(o){return function(v){var r=o.apply(this,arguments);if(v)setFlag('sk');return r;};});

try{document.title='Tâm An · BẢN DEMO Hành trình';}catch(e){}
setInterval(tick,1500);
setInterval(heartbeat,5000);
window.__gm={state:function(){return G;},steps:ST,tick:tick,active:active};
})();
