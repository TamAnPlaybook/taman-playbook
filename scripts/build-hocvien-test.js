/* Sinh bản CHẠY THỬ độc lập của Học viện: scripts/build-hocvien-test.js
 * Trích THẲNG khối CSS + engine của Học viện từ TamAn_Master.html (khối <style>
 * và <script> cuối cùng) rồi bọc bằng lớp "hậu trường" chạy offline:
 *   - _prefs/savePrefs, academyContent  → lưu localStorage (thay Firebase)
 *   - tải ảnh/video từ máy → nén tại chỗ thành dataURL / objectURL (thay kho Storage)
 * Nhờ dùng CHUNG engine, test xong ghép vào app là chạy y hệt.
 * Chạy:  node scripts/build-hocvien-test.js   → tạo hocvien-test.html
 */
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(ROOT,'TamAn_Master.html'),'utf8');
const styles=[...src.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/gi)].map(m=>m[1]);
const scripts=[...src.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
const acadCss=styles[styles.length-1];
const engine=scripts[scripts.length-1];
if(!/#page-academy/.test(acadCss)||!/var ACADEMY=/.test(engine)){
  console.error('Không tìm thấy khối CSS/engine Học viện — kiểm tra lại TamAn_Master.html');process.exit(1);
}
const S='<'+'script>', E='<'+'/script>'; // tránh chuỗi </script> trong nguồn

const baseCss=`
:root{--accent:#C8A84B}
*{box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,-apple-system,'Helvetica Neue',sans-serif;background:#F4F7FB;color:#1F2A37;line-height:1.6;margin:0}
a{color:inherit}
.btn{display:inline-block;border:none;border-radius:10px;padding:10px 16px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}
.btn-g{background:#1B4F8A;color:#fff}.btn-d{background:#EEF1F5;color:#3F4C5A}.btn-o{background:#F07B30;color:#fff}.btn-r{background:#E53935;color:#fff}.btn-sm{padding:6px 10px;font-size:12px}
.hint{font-size:12.5px;color:#8794A3}
.page{display:none}.page.on{display:block}
#hvtest-bar{position:sticky;top:0;z-index:50;background:#12203A;color:#fff;padding:10px 16px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;box-shadow:0 2px 10px rgba(0,0,0,.15)}
#hvtest-bar .ttl{font-weight:800;font-size:14px}
#hvtest-bar .tag{background:#C8A84B;color:#2a2205;border-radius:20px;padding:1px 9px;font-size:11px;font-weight:800}
#hvtest-bar label{display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer}
#hvtest-bar .sp{flex:1}
#hvtest-bar button{background:#25406e;color:#fff;border:none;border-radius:8px;padding:7px 12px;font-size:12.5px;font-weight:700;cursor:pointer}
#hvtest-note{max-width:920px;margin:12px auto 0;padding:0 16px;font-size:12.5px;color:#5A6B7B}
#hvtest-wrap{padding:16px}
#hvtest-toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);background:#1F2A37;color:#fff;padding:10px 16px;border-radius:10px;font-size:13.5px;font-weight:600;opacity:0;transition:opacity .25s;z-index:200;max-width:90%;text-align:center;pointer-events:none}
`;

const shim=`
/* ===== HẬU TRƯỜNG CHẠY THỬ (thay Firebase bằng lưu máy) ===== */
var isBranchAdmin=false, viewOnlyMode=false;
var fbApp={}, fbDb={}, fbUser={uid:'test-qtv'}, FB_STORAGE='';
function escHtml(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function showToast(m){var t=document.getElementById('hvtest-toast');if(!t)return;t.textContent=m;t.style.opacity='1';clearTimeout(showToast._t);showToast._t=setTimeout(function(){t.style.opacity='0';},2600);}
var _prefs={};try{_prefs=JSON.parse(localStorage.getItem('hvtest_prefs')||'{}')||{};}catch(e){_prefs={};}
function savePrefs(){try{localStorage.setItem('hvtest_prefs',JSON.stringify(_prefs));}catch(e){}}
function fsGetGlobal(n){var o={};try{o=JSON.parse(localStorage.getItem('hvtest_g_'+n)||'{}')||{};}catch(e){}return Promise.resolve(o);}
function fsSetGlobal(n,data){var cur={};try{cur=JSON.parse(localStorage.getItem('hvtest_g_'+n)||'{}')||{};}catch(e){}for(var k in data)cur[k]=data[k];try{localStorage.setItem('hvtest_g_'+n,JSON.stringify(cur));}catch(e){showToast('⚠ Hết dung lượng lưu thử (ảnh nặng) — xoá bớt ảnh hoặc dán link.');}return Promise.resolve();}
function _skCompressImage(file){return Promise.resolve(file);} /* engine không dùng trong bản thử (đã override upload) */
`;

const overrides=`
/* ===== OVERRIDE UPLOAD cho bản thử: nén ảnh → dataURL, video → objectURL ===== */
function _hvImgToDataURL(file){return new Promise(function(res){
  if(!/^image\\//.test(file.type)){res('');return;}
  var url=URL.createObjectURL(file),img=new Image();
  img.onload=function(){var MAX=1280,sc=Math.min(1,MAX/Math.max(img.naturalWidth,img.naturalHeight));
    var w=Math.round(img.naturalWidth*sc),h=Math.round(img.naturalHeight*sc);
    var c=document.createElement('canvas');c.width=w;c.height=h;
    try{c.getContext('2d').drawImage(img,0,0,w,h);URL.revokeObjectURL(url);res(c.toDataURL('image/jpeg',0.72));}
    catch(e){URL.revokeObjectURL(url);res('');}};
  img.onerror=function(){URL.revokeObjectURL(url);res('');};img.src=url;});}
window.acadUploadImages=async function(sid,lessonId){
  var inp=document.getElementById('acad-img-input');if(!inp||!inp.files||!inp.files.length)return;
  var files=Array.prototype.slice.call(inp.files),st=document.getElementById('acad-img-status');
  if(!_acadEdDraft||_acadEdDraft.lessonId!==lessonId){var ov=acadEnsureOverride(sid),ix=-1;ov.lessons.forEach(function(l,i){if(l.id===lessonId)ix=i;});_acadEdDraft={sid:sid,lessonId:lessonId,images:(ix>=0?ov.lessons[ix].images:[])};}
  var done=0;
  for(var i=0;i<files.length;i++){if(st)st.innerHTML='⏳ Đang nén ảnh '+(i+1)+'/'+files.length+'…';var d=await _hvImgToDataURL(files[i]);if(d){_acadEdDraft.images.push(d);done++;}}
  if(st&&done)st.innerHTML='✅ Đã thêm '+done+' ảnh (bản thử — lưu trong máy). Nhớ 💾 Lưu bài.';
  inp.value='';var b=document.getElementById('acad-img-list');if(b)b.innerHTML=_acadEdImgList(_acadEdDraft.images);
};
window.acadUploadVideo=function(sid,lessonId){
  var inp=document.getElementById('acad-vid-input');if(!inp||!inp.files||!inp.files.length)return;
  var f=inp.files[0],st=document.getElementById('acad-vid-status');
  var url=URL.createObjectURL(f);var vin=document.getElementById('acad-ed-video');if(vin)vin.value=url;
  if(st)st.innerHTML='✅ Đã chọn video (bản thử — chỉ xem trong phiên này). App thật sẽ tải lên kho.';
};
/* điều khiển thanh trên cùng */
document.getElementById('hvtest-admin').addEventListener('change',function(e){isBranchAdmin=!!e.target.checked;renderAcademy();});
document.getElementById('hvtest-reset').addEventListener('click',function(){if(confirm('Xoá toàn bộ dữ liệu chạy thử trên máy này (tiến độ + nội dung đã soạn)?')){try{localStorage.removeItem('hvtest_prefs');localStorage.removeItem('hvtest_g_registration');}catch(e){}location.reload();}});
renderAcademy();
`;

const html=`<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Học viện Tâm An — Bản chạy thử</title>
<style>${baseCss}</style>
<style>${acadCss}</style>
</head>
<body>
<div id="hvtest-bar">
  <span class="ttl">🎓 Học viện Tâm An</span><span class="tag">BẢN CHẠY THỬ</span>
  <label><input type="checkbox" id="hvtest-admin"> Chế độ QTV (soạn nội dung)</label>
  <span class="sp"></span>
  <button id="hvtest-reset">↺ Xoá dữ liệu thử</button>
</div>
<div id="hvtest-note">Bản chạy thử độc lập — <b>không cần đăng nhập</b>. Dữ liệu (tiến độ học + nội dung QTV soạn) lưu <b>trong trình duyệt này</b>. Bật <b>Chế độ QTV</b> để hiện nút soạn nội dung. Ảnh tải lên được nén &amp; lưu tạm trong máy; video nên <b>dán link YouTube</b> để xem được. Nút mở công cụ (Bánh xe/Sơ đồ/Nhật ký) chỉ hoạt động trong app thật.</div>
<div id="hvtest-wrap">
  <div class="page on" id="page-academy"><div class="content" id="academy-content"></div></div>
</div>
<div id="hvtest-toast"></div>
${S}
${shim}
${E}
${S}
${engine}
${E}
${S}
${overrides}
${E}
</body>
</html>`;

fs.writeFileSync(path.join(ROOT,'hocvien-test.html'),html);
console.log('Đã tạo hocvien-test.html —',html.length,'bytes (engine',engine.length,'· css',acadCss.length,')');
