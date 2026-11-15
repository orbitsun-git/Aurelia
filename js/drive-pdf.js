'use strict';
(()=>{
async function api(body){const session=await database.auth.getSession();const token=session.data.session?.access_token;const r=await fetch('/api/links',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw Error(d.error||'요청 실패');return d;}
window.aureliaLinkApi=api;
window.aureliaUnlockLink=function(item){const c=document.getElementById('modalcontent');c.replaceChildren(node('h2','과목 암호 입력'));const f=node('form',undefined,'realform'),pin=formField(f,'숫자 4자리','pin','password');pin.inputMode='numeric';pin.pattern='[0-9]{4}';pin.maxLength=4;pin.required=true;const submit=node('button','확인'),status=node('p');f.append(submit,status);f.onsubmit=async e=>{e.preventDefault();submit.disabled=true;try{const d=await api({action:'unlock',id:item.id,pin:pin.value});const a=node('a','학습자료 열기 ↗');a.href=d.url;a.target='_blank';a.rel='noopener noreferrer';c.replaceChildren(node('p','암호가 확인되었습니다.'),a);}catch(e){status.textContent=e.message;}finally{submit.disabled=false;}};c.append(f);modal.showModal();};
})();
