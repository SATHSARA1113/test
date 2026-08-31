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
function inStream(n,id){const s=D.streams.find(x=>x.id===id);return !!s&&s.subjects.includes(n)}
function renderSubjects(){
  const q=search.value.trim().toLowerCase(), f=sf.value;
  const names=[...new Set(D.streams.flatMap(s=>s.subjects))].filter(n=>(f==="all"||inStream(n,f))&&(!q||n.toLowerCase().includes(q)));
  empty.classList.toggle("hidden",names.length>0);
  sj.innerHTML=names.map(n=>`<article class="subject-card" data-subject="${n}">
    <div class="top"><h3>${n}</h3><span class="badge">Choose year</span></div>
    <small>Real years are read from the GovDoc collection.</small></article>`).join("");
  document.querySelectorAll("[data-subject]").forEach(c=>c.onclick=()=>showPicker(c.dataset.subject));
}

async function showPicker(name){
  title.textContent=name;
  panel.innerHTML=`<div class="direct-card">
    <div class="picker two">
      <label>Medium<select id="medium"><option value="">Choose medium</option><option value="sinhala">Sinhala</option><option value="english">English</option><option value="tamil">Tamil</option></select></label>
      <label>Year<select id="year" disabled><option>Choose medium first</option></select></label>
    </div>
    <div id="downloadArea"></div>
    <div id="status" class="status">Choose a medium.</div>
  </div>`;
  document.getElementById("medium").onchange=loadYears;
  document.getElementById("year").onchange=readyDownload;
  document.getElementById("download").scrollIntoView({behavior:"smooth"});
}

function fallbackYears(subject,medium){
  const known={
    "Physics":{
      sinhala:[2010,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026],
      english:[2018,2019,2020,2021,2022,2023,2024,2026],
      tamil:[]
    },
    "Combined Mathematics":{
      sinhala:[2010,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025],
      english:[2016,2017,2018,2019,2020,2021,2022,2024],
      tamil:[]
    }
  };
  return known[subject]?.[medium]||[];
}

async function loadYears(){
  const medium=document.getElementById("medium").value;
  const year=document.getElementById("year"), area=document.getElementById("downloadArea"), status=document.getElementById("status");
  area.innerHTML="";
  if(!medium){year.innerHTML="<option>Choose medium first</option>";year.disabled=true;return;}
  year.innerHTML="<option>Loading real years…</option>";year.disabled=true;
  status.className="status";status.textContent="Checking GovDoc…";
  try{
    const r=await fetch(`/api/years?subject=${encodeURIComponent(title.textContent)}&medium=${medium}`);
    const payload=await r.json();
    const years=(r.ok&&Array.isArray(payload.years))?payload.years:fallbackYears(title.textContent,medium);
    if(!years.length) throw new Error("No papers were found for this subject and medium.");
    year.innerHTML='<option value="">Choose year</option>'+years.sort((a,b)=>b-a).map(y=>`<option value="${y}">${y}</option>`).join("");
    year.disabled=false;
    status.textContent=`${years.length} available year(s).`;
  }catch(e){
    const years=fallbackYears(title.textContent,medium);
    if(years.length){
      year.innerHTML='<option value="">Choose year</option>'+years.map(y=>`<option value="${y}">${y}</option>`).join("");
      year.disabled=false;
      status.textContent="Years loaded from the site's verified fallback list.";
    }else{
      year.innerHTML="<option>No years found</option>";year.disabled=true;
      status.className="status error";status.textContent=e.message;
    }
  }
}
function readyDownload(){
  const y=document.getElementById("year").value,m=document.getElementById("medium").value,area=document.getElementById("downloadArea");
  if(!y||!m){area.innerHTML="";return;}
  area.innerHTML=`<div class="download-box"><div>
    <strong>${y} • ${m[0].toUpperCase()+m.slice(1)}</strong>
    <small>The actual GovDoc PDF will be downloaded through this website.</small>
  </div><a class="btn btn-primary" href="/api/download?subject=${encodeURIComponent(title.textContent)}&year=${y}&medium=${m}">Download PDF ↓</a></div>`;
}
search.oninput=renderSubjects;
document.querySelectorAll(".quick-tags button").forEach(b=>b.onclick=()=>{
  search.value=b.dataset.search;renderSubjects();document.getElementById("subjects").scrollIntoView({behavior:"smooth"});
});
document.getElementById("back").onclick=()=>document.getElementById("subjects").scrollIntoView({behavior:"smooth"});
renderStreams();renderFilter();renderSubjects();
