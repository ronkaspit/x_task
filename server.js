const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      date TEXT, client TEXT, type TEXT,
      priority TEXT, status TEXT, details TEXT, notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('Database ready');
}

app.use(express.json());

app.get('/api/tasks', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
    res.json(r.rows);
  } catch(e) { res.status(500).json({error: e.message}); }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const {id,date,client,type,priority,status,details,notes} = req.body;
    await pool.query(
      'INSERT INTO tasks(id,date,client,type,priority,status,details,notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
      [id,date,client,type,priority,status,details,notes]
    );
    res.json({ok:true});
  } catch(e) { res.status(500).json({error: e.message}); }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const {date,client,type,priority,status,details,notes} = req.body;
    await pool.query(
      'UPDATE tasks SET date=$1,client=$2,type=$3,priority=$4,status=$5,details=$6,notes=$7 WHERE id=$8',
      [date,client,type,priority,status,details,notes,req.params.id]
    );
    res.json({ok:true});
  } catch(e) { res.status(500).json({error: e.message}); }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id=$1', [req.params.id]);
    res.json({ok:true});
  } catch(e) { res.status(500).json({error: e.message}); }
});

const HTML = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="משימות">
<title>ניהול משימות</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
:root{--bg:#f5f4f0;--sur:#fff;--sur2:#f0efeb;--txt:#1a1a1a;--txt2:#6b6b6b;--brd:#e0dfd8;--brd2:#cccbc3;--r:10px;--rs:7px}
@media(prefers-color-scheme:dark){:root{--bg:#1a1a18;--sur:#242422;--sur2:#2e2e2b;--txt:#f0efe8;--txt2:#a0a09a;--brd:#3a3a36;--brd2:#4a4a46}}
body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:var(--bg);color:var(--txt);min-height:100vh;font-size:15px}
.app{max-width:960px;margin:0 auto;padding:1rem}
.hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem}
.hdr h1{font-size:20px;font-weight:600;display:flex;align-items:center;gap:8px}
.dot{width:9px;height:9px;border-radius:50%;background:#ccc;transition:background .3s}
.dot.ok{background:#1D9E75}.dot.err{background:#E24B4A}.dot.spin{background:#BA7517;animation:blink 1s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
.btn-new{padding:8px 16px;background:var(--txt);color:var(--bg);border:none;border-radius:var(--rs);font-size:14px;font-weight:500;cursor:pointer}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:1.25rem}
.stat{background:var(--sur);border:1px solid var(--brd);border-radius:var(--r);padding:.75rem;text-align:center}
.sn{font-size:22px;font-weight:600}.sl{font-size:11px;color:var(--txt2);margin-top:4px}
.ct{color:var(--txt)}.cd{color:#3b6d11}.cp{color:#854f0b}.cl{color:#a32d2d}
@media(prefers-color-scheme:dark){.cd{color:#8fc95a}.cp{color:#f0a030}.cl{color:#f07070}}
.flt{background:var(--sur);border:1px solid var(--brd);border-radius:var(--r);padding:.875rem;margin-bottom:1rem;display:flex;gap:8px;flex-wrap:wrap}
.flt input,.flt select{padding:8px 10px;border:1px solid var(--brd2);border-radius:var(--rs);font-size:13px;background:var(--sur2);color:var(--txt);-webkit-appearance:none;appearance:none;min-width:0}
.flt input{flex:1;min-width:140px}.flt select{flex:1;min-width:110px}
.tw{background:var(--sur);border:1px solid var(--brd);border-radius:var(--r);overflow:hidden}
table{width:100%;border-collapse:collapse;font-size:13px}
th{padding:10px 12px;text-align:right;font-weight:500;font-size:11px;color:var(--txt2);background:var(--sur2);border-bottom:1px solid var(--brd);cursor:pointer;white-space:nowrap;user-select:none}
th:hover{color:var(--txt)}
td{padding:10px 12px;border-bottom:1px solid var(--brd);vertical-align:middle}
tr:last-child td{border-bottom:none}
tr:hover td{background:var(--sur2)}
.ov td{background:#fff8f8}
@media(prefers-color-scheme:dark){.ov td{background:#2a1515}}
.dl{color:#a32d2d;font-weight:500}
.badge{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:500;white-space:nowrap}
.bd{background:#eaf3de;color:#3b6d11}.bp{background:#faeeda;color:#854f0b}
.ba{background:#e6f1fb;color:#185fa5}.bpr{background:#eeedfe;color:#3c3489}
.bh{background:#fcebeb;color:#a32d2d}.bm{background:#faeeda;color:#854f0b}.bl{background:#eaf3de;color:#3b6d11}
@media(prefers-color-scheme:dark){
  .bd{background:#1a2f10;color:#8fc95a}.bp{background:#2a1f0a;color:#f0a030}
  .ba{background:#0a1a2a;color:#70adf0}.bpr{background:#1a1830;color:#a090f0}
  .bh{background:#2a1010;color:#f07070}.bm{background:#2a1f0a;color:#f0a030}.bl{background:#1a2f10;color:#8fc95a}
}
.btg{cursor:pointer}.btg:active{opacity:.7}
.act{display:flex;gap:5px}
.be,.bde{padding:5px 9px;border-radius:var(--rs);font-size:11px;cursor:pointer;border:1px solid var(--brd2);background:var(--sur);color:var(--txt)}
.bde{color:#a32d2d;border-color:transparent;background:transparent}
.empty,.loading{text-align:center;padding:2.5rem;color:var(--txt2);font-size:14px}
.nc{max-width:120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--txt2);font-size:12px}
.dc{max-width:150px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px}
.pdot{width:7px;height:7px;border-radius:50%;display:inline-block}
.ph{background:#E24B4A}.pm{background:#BA7517}.pl{background:#639922}
.sa::after{content:' ↑'}.sd::after{content:' ↓'}
.cpr{display:none}
@media(max-width:600px){.cn,.cd2,.cpr{display:none}.stats{grid-template-columns:repeat(2,1fr)}th,td{padding:8px}.badge{font-size:10px;padding:2px 6px}}
.fab{display:none;position:fixed;bottom:1.5rem;left:1.5rem;width:52px;height:52px;border-radius:50%;background:var(--txt);color:var(--bg);font-size:26px;border:none;cursor:pointer;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,.3);z-index:100}
@media(max-width:600px){.fab{display:flex}.btn-new{display:none}}
.mbg{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;display:flex;align-items:flex-end;justify-content:center}
@media(min-width:600px){.mbg{align-items:center}}
.modal{background:var(--sur);border-radius:var(--r) var(--r) 0 0;padding:1.5rem;width:100%;max-width:520px;max-height:92vh;overflow-y:auto}
@media(min-width:600px){.modal{border-radius:var(--r);margin:1rem}}
.modal h2{font-size:18px;font-weight:600;margin-bottom:1.25rem}
.fr{margin-bottom:12px}
.fr label{display:block;font-size:12px;color:var(--txt2);margin-bottom:5px;font-weight:500}
.fr input,.fr select,.fr textarea{width:100%;padding:10px 12px;border:1px solid var(--brd2);border-radius:var(--rs);font-size:15px;background:var(--sur2);color:var(--txt);-webkit-appearance:none;appearance:none}
.fr textarea{height:80px;resize:vertical;font-family:inherit}
.fg{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:400px){.fg{grid-template-columns:1fr}}
.mbtns{display:flex;gap:8px;justify-content:flex-end;margin-top:1.25rem;padding-top:1rem;border-top:1px solid var(--brd)}
.bsv{padding:10px 22px;background:var(--txt);color:var(--bg);border:none;border-radius:var(--rs);font-size:14px;font-weight:600;cursor:pointer}
.bcn{padding:10px 16px;background:transparent;border:1px solid var(--brd2);border-radius:var(--rs);font-size:14px;cursor:pointer;color:var(--txt)}
.bsv:disabled{opacity:.5;cursor:default}
.cm{background:var(--sur);border-radius:var(--r);padding:1.5rem;width:90%;max-width:320px;text-align:center}
.cm p{margin-bottom:1.25rem;color:var(--txt2);font-size:14px}
.cm h3{margin-bottom:.5rem;font-size:16px}
.toast{position:fixed;bottom:5rem;left:50%;transform:translateX(-50%);background:#1a1a1a;color:#fff;padding:10px 18px;border-radius:var(--rs);font-size:13px;z-index:300;opacity:0;transition:opacity .3s;pointer-events:none;white-space:nowrap}
@media(prefers-color-scheme:dark){.toast{background:#e0efe8;color:#1a1a1a}}
.toast.show{opacity:1}
.hdate{font-size:12px;color:var(--txt2)}
</style>
</head>
<body>
<div class="app">
<div class="hdr">
  <h1>ניהול משימות <span class="dot spin" id="dot"></span></h1>
  <div style="display:flex;align-items:center;gap:10px">
    <span class="hdate" id="hdate"></span>
    <button class="btn-new" onclick="openModal()">+ משימה חדשה</button>
  </div>
</div>
<div class="stats">
  <div class="stat"><div class="sn ct" id="st">—</div><div class="sl">סה"כ</div></div>
  <div class="stat"><div class="sn cd" id="sd">—</div><div class="sl">בוצעו</div></div>
  <div class="stat"><div class="sn cp" id="sp">—</div><div class="sl">ממתינות</div></div>
  <div class="stat"><div class="sn cl" id="sl">—</div><div class="sl">באיחור</div></div>
</div>
<div class="flt">
  <input type="text" id="q" placeholder="חיפוש לקוח, פרטים..." oninput="render()">
  <select id="fs" onchange="render()"><option value="">כל הסטטוסים</option><option value="לא בוצע">לא בוצע</option><option value="בוצע">בוצע</option></select>
  <select id="ft" onchange="render()"><option value="">כל הסוגים</option><option value="מכאן">מכאן</option><option value="פרטי">פרטי</option></select>
  <select id="fp" onchange="render()"><option value="">כל עדיפות</option><option value="גבוה">גבוה</option><option value="בינוני">בינוני</option><option value="נמוך">נמוך</option></select>
</div>
<div class="tw">
<table>
<thead><tr>
  <th onclick="srt('date')" id="th-date">תאריך</th>
  <th onclick="srt('client')" id="th-client">לקוח</th>
  <th onclick="srt('type')" id="th-type">סוג</th>
  <th onclick="srt('priority')" id="th-priority" class="cpr">עדיפות</th>
  <th onclick="srt('status')" id="th-status">סטטוס</th>
  <th class="cd2">פרטים</th>
  <th class="cn">הערות</th>
  <th></th>
</tr></thead>
<tbody id="tbody"><tr><td colspan="8" class="loading">טוען...</td></tr></tbody>
</table>
</div>
</div>
<button class="fab" onclick="openModal()">+</button>
<div class="toast" id="toast"></div>
<div class="mbg" id="modal" style="display:none" onclick="bgc(event)">
<div class="modal">
  <h2 id="mttl">משימה חדשה</h2>
  <div class="fg">
    <div class="fr"><label>תאריך יעד</label><input type="date" id="fd"></div>
    <div class="fr"><label>עדיפות</label><select id="fpr"><option value="גבוה">גבוה</option><option value="בינוני" selected>בינוני</option><option value="נמוך">נמוך</option></select></div>
    <div class="fr"><label>לקוח</label><input type="text" id="fc" placeholder="שם הלקוח"></div>
    <div class="fr"><label>סוג לקוח</label><select id="ftp"><option value="מכאן">מכאן</option><option value="פרטי">פרטי</option></select></div>
    <div class="fr"><label>סטטוס</label><select id="fst"><option value="לא בוצע">לא בוצע</option><option value="בוצע">בוצע</option></select></div>
  </div>
  <div class="fr"><label>פרטים / מיקום</label><input type="text" id="fdt" placeholder="תיק, Drive, אימייל..."></div>
  <div class="fr"><label>הערות</label><textarea id="fn" placeholder="הערות נוספות..."></textarea></div>
  <div class="mbtns"><button class="bcn" onclick="closeModal()">ביטול</button><button class="bsv" id="bsv" onclick="save()">שמירה</button></div>
</div>
</div>
<div class="mbg" id="cdel" style="display:none">
<div class="cm">
  <h3>מחיקת משימה</h3>
  <p>למחוק את המשימה של <strong id="dname"></strong>?</p>
  <div style="display:flex;gap:8px;justify-content:center">
    <button class="bcn" onclick="document.getElementById('cdel').style.display='none'">ביטול</button>
    <button class="bsv" style="background:#E24B4A" id="dyes">מחק</button>
  </div>
</div>
</div>
<script>
let tasks=[],editId=null,sf='date',sa=false;
const today=new Date().toISOString().slice(0,10);
document.getElementById('hdate').textContent=new Date().toLocaleDateString('he-IL',{weekday:'long',day:'numeric',month:'long'});
function setDot(s){const d=document.getElementById('dot');d.className='dot '+s}
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500)}
async function api(method,path,body){
  setDot('spin');
  try{
    const r=await fetch('/api'+path,{method,headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
    if(!r.ok)throw new Error(r.status);
    const d=await r.json();setDot('ok');return d;
  }catch(e){setDot('err');throw e}
}
async function load(){
  try{tasks=await api('GET','/tasks');render();}
  catch(e){document.getElementById('tbody').innerHTML='<tr><td colspan="8" class="empty">שגיאה בטעינה</td></tr>';}
}
function isLate(t){return t.status==='לא בוצע'&&t.date&&t.date<today}
function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function render(){
  const q=document.getElementById('q').value.toLowerCase();
  const fs=document.getElementById('fs').value,ft=document.getElementById('ft').value,fp=document.getElementById('fp').value;
  const pm={גבוה:0,בינוני:1,נמוך:2};
  let list=tasks.filter(t=>{
    if(fs&&t.status!==fs)return false;
    if(ft&&t.type!==ft)return false;
    if(fp&&t.priority!==fp)return false;
    if(q&&![(t.client||''),(t.details||''),(t.notes||'')].join(' ').toLowerCase().includes(q))return false;
    return true;
  });
  list.sort((a,b)=>{
    let va=sf==='priority'?(pm[a.priority]??1):(a[sf]||'');
    let vb=sf==='priority'?(pm[b.priority]??1):(b[sf]||'');
    return(va<vb?-1:va>vb?1:0)*(sa?1:-1);
  });
  ['date','client','type','priority','status'].forEach(f=>{
    const el=document.getElementById('th-'+f);
    if(el)el.className=(sf===f?(sa?'sa':'sd'):'')+(f==='priority'?' cpr':'');
  });
  const tb=document.getElementById('tbody');
  if(!list.length){tb.innerHTML='<tr><td colspan="8" class="empty">אין משימות</td></tr>';return}
  tb.innerHTML=list.map(t=>{
    const late=isLate(t);
    const ds=t.date?new Date(t.date+'T12:00').toLocaleDateString('he-IL',{day:'2-digit',month:'2-digit',year:'2-digit'}):'—';
    const tc=t.type==='מכאן'?'ba':'bpr';
    const pc=t.priority==='גבוה'?'bh':t.priority==='בינוני'?'bm':'bl';
    const pd=t.priority==='גבוה'?'ph':t.priority==='בינוני'?'pm':'pl';
    const sc=t.status==='בוצע'?'bd':'bp';
    return \`<tr class="\${late?'ov':''}">
      <td class="\${late?'dl':''}">\${ds}\${late?' ⚠':''}</td>
      <td style="font-weight:500">\${esc(t.client)||'—'}</td>
      <td><span class="badge \${tc}">\${t.type}</span></td>
      <td class="cpr"><span class="badge \${pc}"><span class="pdot \${pd}"></span>\${t.priority}</span></td>
      <td><span class="badge \${sc} btg" onclick="toggle('\${t.id}')">\${t.status}</span></td>
      <td class="dc cd2" title="\${esc(t.details)||''}">\${esc(t.details)||'—'}</td>
      <td class="nc cn" title="\${esc(t.notes)||''}">\${esc(t.notes)||'—'}</td>
      <td><div class="act"><button class="be" onclick="edit('\${t.id}')">עריכה</button><button class="bde" onclick="del('\${t.id}')">✕</button></div></td>
    </tr>\`;
  }).join('');
  document.getElementById('st').textContent=tasks.length;
  document.getElementById('sd').textContent=tasks.filter(t=>t.status==='בוצע').length;
  document.getElementById('sp').textContent=tasks.filter(t=>t.status==='לא בוצע').length;
  document.getElementById('sl').textContent=tasks.filter(isLate).length;
}
function srt(f){sa=sf===f?!sa:false;sf=f;render()}
async function toggle(id){
  const t=tasks.find(x=>x.id===id);if(!t)return;
  const u={...t,status:t.status==='בוצע'?'לא בוצע':'בוצע'};
  tasks=tasks.map(x=>x.id===id?u:x);render();
  try{await api('PUT','/tasks/'+id,u);}catch(e){toast('שגיאה');await load();}
}
function del(id){
  const t=tasks.find(x=>x.id===id);if(!t)return;
  document.getElementById('dname').textContent=t.client||'';
  document.getElementById('dyes').onclick=async()=>{
    document.getElementById('cdel').style.display='none';
    tasks=tasks.filter(x=>x.id!==id);render();
    try{await api('DELETE','/tasks/'+id);toast('נמחק');}catch(e){toast('שגיאה');await load();}
  };
  document.getElementById('cdel').style.display='flex';
}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2)}
function openModal(reset=true){
  if(reset){
    editId=null;document.getElementById('mttl').textContent='משימה חדשה';
    document.getElementById('fd').value=today;document.getElementById('fc').value='';
    document.getElementById('ftp').value='מכאן';document.getElementById('fpr').value='בינוני';
    document.getElementById('fst').value='לא בוצע';document.getElementById('fdt').value='';document.getElementById('fn').value='';
  }
  document.getElementById('modal').style.display='flex';
  setTimeout(()=>document.getElementById('fc').focus(),100);
}
function closeModal(){document.getElementById('modal').style.display='none'}
function bgc(e){if(e.target===document.getElementById('modal'))closeModal()}
function edit(id){
  const t=tasks.find(x=>x.id===id);if(!t)return;
  editId=id;document.getElementById('mttl').textContent='עריכת משימה';
  document.getElementById('fd').value=t.date||'';document.getElementById('fc').value=t.client||'';
  document.getElementById('ftp').value=t.type||'מכאן';document.getElementById('fpr').value=t.priority||'בינוני';
  document.getElementById('fst').value=t.status||'לא בוצע';document.getElementById('fdt').value=t.details||'';document.getElementById('fn').value=t.notes||'';
  openModal(false);
}
async function save(){
  const client=document.getElementById('fc').value.trim();
  if(!client){alert('יש למלא שם לקוח');return}
  const btn=document.getElementById('bsv');btn.disabled=true;
  const t={id:editId||uid(),date:document.getElementById('fd').value,client,type:document.getElementById('ftp').value,priority:document.getElementById('fpr').value,status:document.getElementById('fst').value,details:document.getElementById('fdt').value.trim(),notes:document.getElementById('fn').value.trim()};
  try{
    if(editId){await api('PUT','/tasks/'+editId,t);tasks=tasks.map(x=>x.id===editId?t:x);}
    else{await api('POST','/tasks',t);tasks.unshift(t);}
    closeModal();render();toast(editId?'עודכן':'נשמר');
  }catch(e){toast('שגיאה בשמירה');}
  finally{btn.disabled=false}
}
setInterval(load,30000);
load();
</script>
</body>
</html>`;

app.get('*', (req, res) => res.send(HTML));

initDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('DB connection failed:', err.message);
  process.exit(1);
});
