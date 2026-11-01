// 교체 위치: js/subject.js. 함께 제공된 subject.html과 한 쌍입니다.
(function () {
'use strict';
const id = new URLSearchParams(location.search).get('id') || 'reading';
let admin = false;
const $ = key => document.getElementById(key);
const db = window.supabase;
function element(tag, text, cls) { const n=document.createElement(tag); if(text!==undefined)n.textContent=text; if(cls)n.className=cls; return n; }
function status(box, text, error=false) { box.replaceChildren(element('p',text,'status'+(error?' error':''))); }
function ensureDB() { if(!db || typeof db.from!=='function')throw Error('Supabase에 연결되지 않았습니다. 인터넷 연결과 config.js를 확인하세요.'); }
function safeURL(raw) { try {const u=new URL(raw);return u.protocol==='https:'?u.href:null;}catch(_){return null;} }
function videoURL(raw) {
 try { const u=new URL(raw); if(!['https:','http:'].includes(u.protocol))return null;
 let key='';const host=u.hostname.toLowerCase();
 if(host==='youtu.be')key=u.pathname.slice(1);
 else if(['youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com'].includes(host)){
   key=u.searchParams.get('v') || (/^\/(embed|shorts|live)\//.test(u.pathname)?u.pathname.split('/')[2]:'');
 }
 return /^[A-Za-z0-9_-]{11}$/.test(key)?'https://www.youtube-nocookie.com/embed/'+key:null;
 }catch(_){return null;}
}
async function loadVideos() {
 const box=$('lecture-list'); status(box,'강의 불러오는 중…');
 try {ensureDB(); const {data,error}=await db.from('lectures').select('*').eq('subject_id',id).order('created_at',{ascending:false});if(error)throw error;
 box.replaceChildren();if(!data?.length){status(box,'아직 등록된 강의가 없습니다.');return;}
 data.forEach(item=>{const card=element('article',undefined,'entry');card.append(element('h3',item.title));if(item.description)card.append(element('p',item.description,'hint'));
 const direct=safeURL(item.video_url);
 if(direct && !videoURL(item.video_url)){
 const player=element('video');player.src=direct;player.controls=true;player.preload='metadata';player.playsInline=true;player.className='video-frame';player.setAttribute('aria-label',item.title||'강의 영상');card.append(player);
 player.addEventListener('error',()=>{if(!card.querySelector('.video-error'))card.append(element('p','영상 재생에 실패했습니다. 공개 접근 권한 또는 영상 코덱을 확인하세요.','hint video-error'));});
 }
 const src=videoURL(item.video_url);if(src){const frame=element('iframe');frame.src=src;frame.title=item.title||'강의 영상';frame.className='video-frame';frame.allowFullscreen=true;frame.loading='lazy';frame.referrerPolicy='strict-origin-when-cross-origin';card.append(frame);}else if(!direct) card.append(element('p','올바른 영상 주소가 아닙니다.','hint'));
 box.append(card);});
 }catch(e){status(box,'강의를 불러오지 못했습니다. '+e.message,true);}
}
async function loadMaterials() {
 const box=$('material-list');status(box,'자료 불러오는 중…');
 try {ensureDB();const {data,error}=await db.from('learning_materials').select('*').eq('subject_id',id).order('created_at',{ascending:false});if(error)throw error;
 box.replaceChildren();if(!data?.length){status(box,'아직 등록된 자료가 없습니다.');return;}
 data.forEach(item=>{const card=element('article',undefined,'entry');card.append(element('h3',item.title));const url=safeURL(item.file_url);
 if(url){if(['image/png','image/jpeg'].includes(item.mime_type)){const image=element('img');image.src=url;image.alt=item.title;image.loading='lazy';image.className='material-image';card.append(image);}
 const a=element('a',(item.mime_type==='application/pdf'?'📄 PDF 열기 · ':'📎 자료 열기 · ')+(item.file_name||'파일'),'material-link');a.href=url;a.target='_blank';a.rel='noopener noreferrer';card.append(a);}
 else card.append(element('p','자료 주소를 확인해 주세요.','hint'));box.append(card);});
 }catch(e){status(box,'자료를 불러오지 못했습니다. learning_materials 테이블과 조회 권한을 확인하세요.\n'+e.message,true);}
}
async function loadComments() {
 const box=$('comment-list');status(box,'피드 불러오는 중…');
 try {
 ensureDB();
 const {data,error}=await db.from('comments').select('*').eq('subject_id',id).order('created_at',{ascending:false}).limit(100);
 if(error)throw error;
 box.replaceChildren();
 if(!data?.length){status(box,'아직 이야기가 없어요. 첫 번째 게시글을 남겨 보세요.');return;}
 const deck=element('div',undefined,'feed-deck');deck.id='feed-deck';deck.setAttribute('role','region');deck.setAttribute('aria-label','학생 게시글 넘겨 보기');deck.tabIndex=0;
 data.forEach((item,index)=>{
 const card=element('article',undefined,'feed-slide');card.setAttribute('aria-label',`${index+1} / ${data.length} 게시글`);
 const head=element('div',undefined,'feed-head');const identity=element('div','익명 학생');const date=new Date(item.created_at);
 identity.append(element('div',Number.isNaN(date.getTime())?'':date.toLocaleString('ko-KR'),'feed-time'));
 head.append(element('span','👤','avatar'),identity);card.append(head,element('p',item.content||'','feed-content'));deck.append(card);
 });
 const nav=element('div',undefined,'feed-nav');const prev=element('button','←','feed-arrow');const next=element('button','→','feed-arrow');const count=element('span','','feed-counter');
 prev.type=next.type='button';prev.setAttribute('aria-label','이전 게시글');next.setAttribute('aria-label','다음 게시글');count.setAttribute('aria-live','polite');
 let current=0;
 function paint(){count.textContent=`${current+1} / ${data.length}`;prev.disabled=current===0;next.disabled=current===data.length-1;}
 function go(delta){current=Math.max(0,Math.min(data.length-1,current+delta));const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;deck.scrollTo({left:deck.clientWidth*current,behavior:reduced?'auto':'smooth'});paint();}
 prev.addEventListener('click',()=>go(-1));next.addEventListener('click',()=>go(1));
 deck.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();go(event.key==='ArrowLeft'?-1:1);}});
 deck.addEventListener('scroll',()=>{if(deck.clientWidth){current=Math.max(0,Math.min(data.length-1,Math.round(deck.scrollLeft/deck.clientWidth)));paint();}},{passive:true});
 nav.append(prev,count,next);box.append(deck,nav);paint();
 }catch(e){status(box,'피드를 불러오지 못했습니다. '+e.message,true);}
}
async function submit(form, work){const button=form.querySelector('button[type=submit]');button.disabled=true;try{ensureDB();await work();}catch(e){alert('처리하지 못했습니다: '+e.message+'\n관리자 화면 표시만으로는 서버 쓰기 권한이 생기지 않습니다.');}finally{button.disabled=false;}}
document.addEventListener('DOMContentLoaded',()=>{
 const info=window.SUBJECT_CONFIG?.[id];if(!info){$('subject-header').textContent='찾을 수 없는 과목';document.querySelectorAll('form').forEach(f=>f.hidden=true);return;}
 $('subject-header').textContent=info.name+' 학습 공간';document.title=info.name+' · 학습 공간';
 function adminUI(){document.querySelectorAll('.admin-only').forEach(n=>n.hidden=!admin);$('admin-badge').hidden=!admin;if(!admin){$('video-form').hidden=true;$('material-form').hidden=true;}}
 async function refreshAdmin(){
 try{ensureDB();const {data,error}=await db.auth.getUser();if(error && !error.message.toLowerCase().includes('session'))throw error;
 admin=!!data?.user && data.user.app_metadata?.role==='admin';
 $('auth-status').textContent=admin?'관리자로 로그인되었습니다.':data?.user?'로그인 계정에 관리자 권한이 없습니다.':'관리자 로그인이 필요합니다.';
 }catch(e){admin=false;$('auth-status').textContent=e.message;}adminUI();}
 $('auth-form').addEventListener('submit',event=>{event.preventDefault();submit(event.currentTarget,async()=>{const {error}=await db.auth.signInWithPassword({email:$('auth-email').value.trim(),password:$('auth-password').value});if(error)throw error;$('auth-password').value='';await refreshAdmin();});});
 $('auth-logout').addEventListener('click',async()=>{try{ensureDB();const {error}=await db.auth.signOut();if(error)throw error;admin=false;adminUI();$('auth-status').textContent='로그아웃되었습니다.';}catch(e){alert(e.message);}});
 adminUI();refreshAdmin();
 document.querySelectorAll('[data-toggle]').forEach(button=>button.addEventListener('click',()=>{if(admin){const form=$(button.dataset.toggle);form.hidden=!form.hidden;}}));
 $('video-form').addEventListener('submit',event=>{event.preventDefault();if(!admin)return;
 submit(event.currentTarget,async()=>{
 const title=$('video-title').value.trim();const file=$('video-file').files[0];
 if(!title||!file)throw Error('제목과 영상 파일을 선택하세요.');
 const ext=file.name.split('.').pop().toLowerCase();const mime={mp4:'video/mp4',webm:'video/webm'}[ext];
 if(!mime || (file.type && file.type!==mime))throw Error('MP4 또는 WebM 영상 파일만 선택하세요.');
 if(file.size===0||file.size>1000000000)throw Error('0바이트 초과, 최대 1GB 파일만 가능합니다.');
 if(!window.tus)throw Error('영상 업로드 라이브러리를 불러오지 못했습니다.');
 const {data:{session},error:sessionError}=await db.auth.getSession();if(sessionError)throw sessionError;if(!session)throw Error('관리자로 다시 로그인하세요.');
 const progress=$('video-upload-status');progress.textContent='업로드 준비 중…';
 // 동일 파일 재선택 시 같은 경로와 TUS fingerprint를 사용하여 재개합니다.
 const fingerprint=['gold-video',session.user.id,id,file.name,file.size,file.lastModified].join('|');
 const key='gold-upload-'+fingerprint;
 let path;try{path=localStorage.getItem(key);}catch(_){}
 if(!path||!path.startsWith(id+'/'))path=id+'/'+crypto.randomUUID()+'.'+ext;
 try{localStorage.setItem(key,path);}catch(_){}
 try{
 await new Promise((resolve,reject)=>{
 const upload=new tus.Upload(file,{
 endpoint:'https://yzpajsjptweyenjpmhxh.storage.supabase.co/storage/v1/upload/resumable',
 retryDelays:[0,3000,5000,10000,20000],
 headers:{authorization:'Bearer '+session.access_token,'x-upsert':'false'},
 uploadDataDuringCreation:true,removeFingerprintOnSuccess:true,
 fingerprint:()=>Promise.resolve(fingerprint),
 metadata:{bucketName:'lecture-videos',objectName:path,contentType:mime,cacheControl:'3600'},
 chunkSize:6*1024*1024,
 onBeforeRequest:async request=>{const {data:{session:latest}}=await db.auth.getSession();if(latest)request.setHeader('authorization','Bearer '+latest.access_token);},
 onProgress:(sent,total)=>{progress.textContent='업로드'+' '+(sent/total*100).toFixed(1)+'% · '+(sent/1000000).toFixed(1)+' / '+(total/1000000).toFixed(1)+'MB';},
 onError:reject,onSuccess:resolve
 });
 upload.findPreviousUploads().then(previous=>{if(previous.length)upload.resumeFromPreviousUpload(previous[0]);upload.start();}).catch(reject);
 });
 progress.textContent='영상 저장 완료 · 강의 정보 등록 중…';
 const storage=db.storage.from('lecture-videos');const {data}=storage.getPublicUrl(path);
 const {error}=await db.from('lectures').insert({subject_id:id,title,description:$('video-description').value.trim(),video_url:data.publicUrl});
 if(error){const cleanup=await storage.remove([path]);if(cleanup.error)throw Error(error.message+' / 업로드 파일 정리 실패: '+path);throw error;}
 try{localStorage.removeItem(key);}catch(_){}
 progress.textContent='등록 완료';$('video-form').reset();$('video-form').hidden=true;await loadVideos();
 }catch(error){progress.textContent='업로드 또는 등록 실패: '+error.message+' · 같은 파일을 다시 선택하여 재시도할 수 있습니다.';throw error;}
 });});
 $('material-form').addEventListener('submit',event=>{event.preventDefault();if(!admin)return;
 submit(event.currentTarget,async()=>{const file=$('material-file').files[0];const title=$('material-title').value.trim();if(!title||!file)throw Error('제목과 파일을 선택하세요.');const allowed={'image/png':'png','image/jpeg':'jpg','application/pdf':'pdf'};const ext=allowed[file.type];if(!ext)throw Error('PNG, JPG, PDF 파일만 가능합니다.');if(file.size>10*1024*1024)throw Error('파일은 10MB 이하여야 합니다.');
 const path=id+'/'+crypto.randomUUID()+'.'+ext;const storage=db.storage.from('lecture-files');const upload=await storage.upload(path,file,{contentType:file.type,upsert:false});if(upload.error)throw upload.error;
 const {data}=storage.getPublicUrl(path);const saved=await db.from('learning_materials').insert({subject_id:id,title,file_url:data.publicUrl,file_name:file.name,mime_type:file.type,storage_path:path});
 if(saved.error){await storage.remove([path]);throw saved.error;}$('material-form').reset();$('material-form').hidden=true;await loadMaterials();});});
 function compose(show){$('comment-form').hidden=!show;$('feed-compose-open').setAttribute('aria-expanded',String(show));if(show)$('comment-text').focus();}
 $('feed-compose-open').addEventListener('click',()=>compose($('comment-form').hidden));
 $('feed-compose-cancel').addEventListener('click',()=>compose(false));
 $('comment-form').addEventListener('submit',event=>{event.preventDefault();submit(event.currentTarget,async()=>{const content=$('comment-text').value.trim();if(!content)throw Error('내용을 입력하세요.');if(content.length>2000)throw Error('2000자 이내로 입력하세요.');const {error}=await db.from('comments').insert({subject_id:id,author_name:'익명 학생',content});if(error)throw error;$('comment-form').reset();compose(false);await loadComments();});});
 $('ai-form').addEventListener('submit',event=>{event.preventDefault();$('ai-response').textContent=(!$('ai-question-text').value.trim()&&!$('ai-image-input').files.length)?'질문 또는 문제 사진을 입력해 주세요.':'아직 실제 AI 서버가 연결되지 않았습니다. 현재는 답변을 생성할 수 없습니다.';});
 loadVideos();loadMaterials();loadComments();
});
})();
