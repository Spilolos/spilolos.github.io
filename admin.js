// Admin utilities (lessons + quizzes) using IndexedDB
const DB_NAME='edughana-db', DB_VER=1; let db;
function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,DB_VER);r.onupgradeneeded=e=>{const d=e.target.result;if(!d.objectStoreNames.contains('lessons'))d.createObjectStore('lessons',{keyPath:'id'});if(!d.objectStoreNames.contains('quizzes'))d.createObjectStore('quizzes',{keyPath:'id'});};r.onsuccess=()=>{db=r.result;resolve(db)};r.onerror=()=>reject(r.error)});}
async function put(store,value){const d=db||await openDB();return new Promise((res,rej)=>{const tx=d.transaction(store,'readwrite');tx.objectStore(store).put(value);tx.oncomplete=()=>res(true);tx.onerror=()=>rej(tx.error);});}
async function del(store,key){const d=db||await openDB();return new Promise((res,rej)=>{const tx=d.transaction(store,'readwrite');tx.objectStore(store).delete(key);tx.oncomplete=()=>res(true);tx.onerror=()=>rej(tx.error);});}
async function all(store){const d=db||await openDB();return new Promise((res,rej)=>{const tx=d.transaction(store,'readonly');const g=tx.objectStore(store).getAll();g.onsuccess=()=>res(g.result||[]);g.onerror=()=>rej(g.error);});}

(async ()=>{
  await openDB();
  if (document.getElementById('lessonsTbody')) initLessons();
  if (document.getElementById('quizzesTbody')) initQuizzes();
})();

// LESSONS
async function initLessons(){
  const tbody=document.getElementById('lessonsTbody');
  async function render(){
    const items=await all('lessons');
    tbody.innerHTML=items.map(L=>`<tr>
      <td class="border px-3 py-2">${L.id}</td>
      <td class="border px-3 py-2">${L.title}</td>
      <td class="border px-3 py-2">${L.subject}</td>
      <td class="border px-3 py-2 text-sm">${(L.body||'').slice(0,60)}${(L.body||'').length>60?'…':''}</td>
      <td class="border px-3 py-2 text-right space-x-2">
        <button class="px-2 py-1 border rounded editLesson" data-id="${L.id}">Edit</button>
        <button class="px-2 py-1 border rounded delLesson" data-id="${L.id}">Delete</button>
      </td>
    </tr>`).join('');
  }
  await render();

  document.getElementById('btnAddLesson').addEventListener('click',()=>openLessonModal({}));
  document.getElementById('btnExport').addEventListener('click', async ()=>{
    const data=await all('lessons');
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='lessons.json'; a.click(); URL.revokeObjectURL(url);
  });
  document.getElementById('btnImport').addEventListener('click',()=>document.getElementById('fileImport').click());
  document.getElementById('fileImport').addEventListener('change', async (e)=>{
    const f=e.target.files[0]; if(!f) return;
    const txt=await f.text(); const items=JSON.parse(txt);
    for (const L of items) await put('lessons', L);
    await render(); alert('Imported.');
  });

  document.addEventListener('click', async (e)=>{
    if (e.target.matches('.editLesson')){
      const id=e.target.dataset.id; const items=await all('lessons'); const L=items.find(x=>x.id===id); openLessonModal(L);
    }
    if (e.target.matches('.delLesson')){
      const id=e.target.dataset.id; if(confirm('Delete lesson?')){ await del('lessons', id); await render(); }
    }
  });

  function openLessonModal(L){
    const m=document.getElementById('lessonModal'); m.classList.remove('hidden'); m.classList.add('flex');
    document.getElementById('lessonId').value=L.id||'';
    document.getElementById('lessonTitle').value=L.title||'';
    document.getElementById('lessonSubject').value=L.subject||'';
    document.getElementById('lessonBody').value=L.body||'';
  }
  document.getElementById('btnCancelLesson').addEventListener('click',()=>document.getElementById('lessonModal').classList.add('hidden'));
  document.getElementById('btnSaveLesson').addEventListener('click', async ()=>{
    const id=document.getElementById('lessonId').value || crypto.randomUUID();
    const L={
      id,
      title:document.getElementById('lessonTitle').value,
      subject:document.getElementById('lessonSubject').value,
      body:document.getElementById('lessonBody').value
    };
    await put('lessons', L);
    document.getElementById('lessonModal').classList.add('hidden'); await render();
  });
}

// QUIZZES
async function initQuizzes(){
  const tbody=document.getElementById('quizzesTbody');
  function row(Q){ return `<tr>
    <td class="border px-3 py-2">${Q.id}</td>
    <td class="border px-3 py-2">${Q.title}</td>
    <td class="border px-3 py-2">${Q.lessonId||''}</td>
    <td class="border px-3 py-2">${(Q.questions||[]).length}</td>
    <td class="border px-3 py-2 text-right space-x-2">
      <button class="px-2 py-1 border rounded editQuiz" data-id="${Q.id}">Edit</button>
      <button class="px-2 py-1 border rounded delQuiz" data-id="${Q.id}">Delete</button>
    </td>
  </tr>`; }
  async function render(){
    const items=await all('quizzes'); tbody.innerHTML=items.map(row).join('');
  }
  await render();
  document.getElementById('btnAddQuiz').addEventListener('click',()=>openQuizModal({questions:[]}));

  document.addEventListener('click', async (e)=>{
    if (e.target.matches('.editQuiz')){
      const id=e.target.dataset.id; const items=await all('quizzes'); const Q=items.find(x=>x.id===id); openQuizModal(Q);
    }
    if (e.target.matches('.delQuiz')){
      const id=e.target.dataset.id; if(confirm('Delete quiz?')){ await del('quizzes', id); await render(); }
    }
  });

  function openQuizModal(Q){
    const m=document.getElementById('quizModal'); m.classList.remove('hidden'); m.classList.add('flex');
    document.getElementById('quizId').value=Q.id||'';
    document.getElementById('quizTitle').value=Q.title||'';
    document.getElementById('quizLessonId').value=Q.lessonId||'';
    const wrap=document.getElementById('quizQuestions'); wrap.innerHTML='';
    (Q.questions||[]).forEach(addQuestionRow);
  }
  function addQuestionRow(q={q:'', options:['','','',''], correct:0}){
    const wrap=document.getElementById('quizQuestions');
    const idx = wrap.children.length;
    const el=document.createElement('div');
    el.className='p-3 border rounded';
    el.innerHTML=`
      <label class="text-sm block mb-1">Question</label>
      <input class="w-full p-2 border rounded mb-2 qtext" value="${q.q.replace(/"/g,'&quot;')}">
      <div class="grid grid-cols-2 gap-2 mb-2">
        ${[0,1,2,3].map(i=>`<input class="p-2 border rounded opt" data-i="${i}" value="${(q.options[i]||'').replace(/"/g,'&quot;')}">`).join('')}
      </div>
      <label class="text-sm">Correct index (0-3)</label>
      <input type="number" min="0" max="3" class="p-2 border rounded correct" value="${q.correct||0}">
    `;
    wrap.appendChild(el);
  }
  document.getElementById('btnAddQuestion').addEventListener('click',()=>addQuestionRow());

  document.getElementById('btnCancelQuiz').addEventListener('click',()=>document.getElementById('quizModal').classList.add('hidden'));
  document.getElementById('btnSaveQuiz').addEventListener('click', async ()=>{
    const id=document.getElementById('quizId').value || crypto.randomUUID();
    const title=document.getElementById('quizTitle').value;
    const lessonId=document.getElementById('quizLessonId').value || null;
    const wrap=document.getElementById('quizQuestions');
    const questions=[...wrap.children].map(div=>{
      const q=div.querySelector('.qtext').value;
      const opts=[...div.querySelectorAll('.opt')].map(x=>x.value);
      const correct=parseInt(div.querySelector('.correct').value||0,10);
      return {q, options:opts, correct:isNaN(correct)?0:correct};
    });
    await put('quizzes', {id, title, lessonId, questions});
    document.getElementById('quizModal').classList.add('hidden'); await render();
  });
}
