const D=window.SITE_DATA;
const sg=document.getElementById("streamGrid"), sj=document.getElementById("subjectGrid");
const sf=document.getElementById("streamFilter"), search=document.getElementById("search");
const empty=document.getElementById("empty"), panel=document.getElementById("paperPanel"), title=document.getElementById("paperTitle");

function renderStreams(){
  sg.innerHTML=D.streams.map(s=>`<button class="stream-card" data-stream="${s.id}">
    <div class="stream-icon">${s.icon}</div>
    <div><h3>${s.name}</h3><p>${s.description}</p></div>
    <span class="stream-arrow">↗</span>
  </button>`).join("");
  document.querySelectorAll("[data-stream]").forEach(b=>b.onclick=()=>{
    sf.value=b.dataset.stream; renderSubjects(); document.getElementById("subjects").scrollIntoView({behavior:"smooth"});
  });
}
function renderFilter(){
  sf.innerHTML='<option value="all">All streams</option>'+D.streams.map(s=>`<option value="${s.id}">${s.name}</option>`).join("");
  sf.onchange=renderSubjects;
}
function inStream(name,id){const s=D.streams.find(x=>x.id===id);return !!s && s.subjects.includes(name);}
function renderSubjects(){
  const q=search.value.trim().toLowerCase(), f=sf.value;
  const names=[...new Set(D.streams.flatMap(s=>s.subjects))].filter(n=>(f==="all"||inStream(n,f))&&(!q||n.toLowerCase().includes(q)));
  empty.classList.toggle("hidden",names.length>0);
  sj.innerHTML=names.map(n=>`<article class="subject-card" data-subject="${n}">
    <div class="top"><h3>${n}</h3><span class="badge">Select year</span></div>
    <small>Choose a year and medium to download</small>
  </article>`).join("");
  document.querySelectorAll("[data-subject]").forEach(c=>c.onclick=()=>showPicker(c.dataset.subject));
}
function showPicker(name){
  title.textContent=name;
  let ys='<option value="">Choose year</option>';
  for(let y=2026;y>=2000;y--)ys+=`<option>${y}</option>`;
  panel.innerHTML=`<div class="direct-card">
    <div class="picker">
      <label>Year<select id="year">${ys}</select></label>
      <label>Medium<select id="medium"><option value="">Choose medium</option><option value="sinhala">Sinhala</option><option value="english">English</option><option value="tamil">Tamil</option></select></label>
      <label>Paper<select id="part"><option value="">Choose paper</option><option value="1">Paper I / Part 1</option><option value="2">Paper II / Part 2</option><option value="both">I + II if available</option></select></label>
    </div>
    <div id="downloadArea"></div>
    <div id="status" class="status">Choose all three options.</div>
  </div>`;
  ["year","medium","part"].forEach(id=>document.getElementById(id).onchange=update);
  document.getElementById("download").scrollIntoView({behavior:"smooth"});
}
function update(){
  const y=document.getElementById("year").value,m=document.getElementById("medium").value,p=document.getElementById("part").value;
  const area=document.getElementById("downloadArea"), status=document.getElementById("status");
  if(!y||!m||!p){area.innerHTML="";status.textContent="Choose year, medium and paper.";status.className="status";return;}
  const url=`/api/download?subject=${encodeURIComponent(title.textContent)}&year=${y}&medium=${m}&part=${p}`;
  area.innerHTML=`<div class="download-box"><div><strong>${y} • ${m[0].toUpperCase()+m.slice(1)} • ${p==="both"?"Part I + II":"Part "+p}</strong><small>Your browser will download the PDF from this site's download endpoint.</small></div><a class="btn btn-primary" href="${url}">Download PDF ↓</a></div>`;
  status.textContent="The button is ready. If that exact paper is not available on the source, the site will show a clear error.";status.className="status";
}
search.oninput=renderSubjects;
document.querySelectorAll(".quick-tags button").forEach(b=>b.onclick=()=>{search.value=b.dataset.search;renderSubjects();document.getElementById("subjects").scrollIntoView({behavior:"smooth"})});
document.getElementById("back").onclick=()=>document.getElementById("subjects").scrollIntoView({behavior:"smooth"});
renderStreams();renderFilter();renderSubjects();
