const D=window.SITE_DATA;
const sg=document.getElementById("streamGrid"), sj=document.getElementById("subjectGrid");
const sf=document.getElementById("streamFilter"), search=document.getElementById("search");
const empty=document.getElementById("empty"), panel=document.getElementById("paperPanel"), title=document.getElementById("paperTitle");

function renderStreams(){
  sg.innerHTML=D.streams.map(s=>`<button class="stream-card" data-stream="${s.id}">
    <div class="stream-icon">${s.icon}</div><div><h3>${s.name}</h3><p>${s.description}</p></div><span class="stream-arrow">↗</span></button>`).join("");
  document.querySelectorAll("[data-stream]").forEach(b=>b.onclick=()=>{
    sf.value=b.dataset.stream;renderSubjects();document.getElementById("subjects").scrollIntoView({behavior:"smooth"});
  });
}
function renderFilter(){
  sf.innerHTML='<option value="all">All streams</option>'+D.streams.map(s=>`<option value="${s.id}">${s.name}</option>`).join("");
  sf.onchange=renderSubjects;
}
function inStream(name,id){const s=D.streams.find(x=>x.id===id);return !!s&&s.subjects.includes(name)}
function renderSubjects(){
  const q=search.value.trim().toLowerCase(),f=sf.value;
  const names=[...new Set(D.streams.flatMap(s=>s.subjects))].filter(n=>(f==="all"||inStream(n,f))&&(!q||n.toLowerCase().includes(q)));
  empty.classList.toggle("hidden",names.length>0);
  sj.innerHTML=names.map(n=>`<article class="subject-card" data-subject="${n}">
    <div class="top"><h3>${n}</h3><span class="badge">Choose year</span></div>
    <small>Live GovDoc years are loaded when you open this subject.</small>
  </article>`).join("");
  document.querySelectorAll("[data-subject]").forEach(c=>c.onclick=()=>showPicker(c.dataset.subject));
}
async function showPicker(name){
  title.textContent=name;
  panel.innerHTML=`<div class="direct-card"><div class="picker two">
    <label>Medium<select id="medium"><option value="">Choose medium</option><option value="sinhala">Sinhala</option><option value="english">English</option><option value="tamil">Tamil</option></select></label>
    <label>Year<select id="year" disabled><option>Choose medium first</option></select></label>
  </div>
  <div id="downloadArea"></div><div id="status" class="status">Choose a medium. The site will read the real years available on GovDoc.</div></div>`;
  document.getElementById("medium").onchange=loadYears;
  document.getElementById("year").onchange=update;
  document.getElementById("download").scrollIntoView({behavior:"smooth"});
}
async function loadYears(){
  const medium=document.getElementById("medium").value;
  const year=document.getElementById("year"),area=document.getElementById("downloadArea"),status=document.getElementById("status");
  area.innerHTML="";
  if(!medium){year.innerHTML='<option>Choose medium first</option>';year.disabled=true;return}
  year.innerHTML='<option>Loading years…</option>';year.disabled=true;
  status.textContent="Checking GovDoc for this subject and medium…";
  try{
    const r=await fetch(`/api/years?subject=${encodeURIComponent(title.textContent)}&medium=${medium}`);
    const data=await r.json();
    if(!r.ok) throw new Error(data.error||"Could not load years.");
    if(!data.years.length) throw new Error("No papers were found for this medium.");
    year.innerHTML='<option value="">Choose year</option>'+data.years.map(y=>`<option value="${y}">${y}</option>`).join("");
    year.disabled=false;
    status.textContent=`${data.years.length} year(s) available. Select a year to get the download button.`;
  }catch(e){
    year.innerHTML='<option>No years found</option>';year.disabled=true;
    status.className="status error";status.textContent=e.message;
  }
}
function update(){
  const y=document.getElementById("year").value,m=document.getElementById("medium").value;
  const area=document.getElementById("downloadArea"),status=document.getElementById("status");
  if(!y||!m){area.innerHTML="";return}
  const url=`/api/download?subject=${encodeURIComponent(title.textContent)}&year=${y}&medium=${m}`;
  area.innerHTML=`<div class="download-box"><div>
    <strong>${y} • ${m[0].toUpperCase()+m.slice(1)}</strong>
    <small>Downloads the actual GovDoc document through this website.</small>
  </div><a class="btn btn-primary" href="${url}">Download PDF ↓</a></div>`;
  status.className="status";status.textContent="Ready. Click Download PDF.";
}
search.oninput=renderSubjects;
document.querySelectorAll(".quick-tags button").forEach(b=>b.onclick=()=>{search.value=b.dataset.search;renderSubjects();document.getElementById("subjects").scrollIntoView({behavior:"smooth"})});
document.getElementById("back").onclick=()=>document.getElementById("subjects").scrollIntoView({behavior:"smooth"});
renderStreams();renderFilter();renderSubjects();
