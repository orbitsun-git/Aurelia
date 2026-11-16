'use strict';
const oldEnhanceResources=enhancePage;
enhancePage=async function(){if(state.page==='subject'){await drawResourcePage();return;}await oldEnhanceResources();};
function resourceImage(url,title){const img=node('img');img.src=url;img.alt=title;img.loading='lazy';img.onerror=()=>img.replaceWith(node('p','이미지를 불러오지 못했습니다.'));return img;}
function resourceCard(item){const card=node('article',undefined,'resource-post');card.append(node('h3',item.title));if(window.aureliaGalleryURLs(item).length)card.append(window.aureliaGallery(item));if(item.description)card.append(node('p',item.description));const b=node('button','🔒 과목 암호 입력 후 열기','resource-link');b.type='button';b.onclick=()=>window.aureliaUnlockLink(item);card.append(b);return card;}
async function drawResourcePage(){const deck=document.querySelector('.subjectcards');if(!deck)return;const selected={...scope()};deck.replaceChildren();const box=node('section',undefined,'glass');box.append(node('h2','학습자료'));deck.append(box);try{const rows=await query('aurelia_resources',{...selected,kind:'material'});if(state.page!=='subject'||JSON.stringify(scope())!==JSON.stringify(selected)||!box.isConnected)return;if(!rows.length)box.append(node('p','등록된 자료가 없습니다.'));for(const row of rows)box.append(resourceCard(row));}catch(e){box.append(node('p',e.message));}}


