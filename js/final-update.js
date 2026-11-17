 'use strict';
(()=>{
const originalRender=render;
render=function(){
 if(state.page==='store'||state.page==='book')state.course='수능';
 filters();
 if(state.page==='subject'&&!visibleSubjects.length){state.page='home';}
 originalRender();
 const cs=state.page==='store'||state.page==='book';
 if(cs){document.getElementById('filters').hidden=true;}
 else if(state.course==='내신'&&!visibleSubjects.length&&state.page==='home'){
 const host=document.querySelector('.hero');if(host)host.after(node('p','이 학기에 등록된 과목이 없습니다. 관리자가 과목을 추가해 주세요.','notice'));
 document.querySelectorAll('[data-subject]').forEach(b=>{b.disabled=true;});
 }
};
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-shop-category]');if(!b)return;
 state.bookCategory=b.dataset.shopCategory;render();
});
const baseCategory=categoryOf;
categoryOf=function(item){const s=catalog.find(x=>x.subject_id===item.subject_id);if(s&&s.course==='수능')return s.name;const v=baseCategory(item);return v==='과학'?'통합과학':v==='사회'?'통합사회':v;};
// Recalculate deep-linked built-in selection using its actual semester, not stale array position.
window.addEventListener('load',async()=>{
 await loadCatalog();const id=new URLSearchParams(location.hash.slice(1)).get('subject');
 const target=catalog.find(x=>x.subject_id===id);
 if(target){state.course=target.course;if(target.course==='내신'){document.getElementById('grade').value=target.grade;document.getElementById('semester').value=target.semester;}filters();state.subject=visibleSubjects.findIndex(x=>x.subject_id===id);state.page=target.course==='수능'?'store':'subject';}
 render();
},{once:true});
})();
