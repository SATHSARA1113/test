const D=window.SITE_DATA;
const sg=document.getElementById("streamGrid"),sj=document.getElementById("subjectGrid");
const sf=document.getElementById("streamFilter"),search=document.getElementById("search");
const empty=document.getElementById("empty"),panel=document.getElementById("paperPanel"),title=document.getElementById("paperTitle");

function renderStreams(){
 sg.innerHTML=D.streams.map(s=>`<button class="stream-card" data-stream="${s.id}">
 <div class="stream-icon">${s.icon}</div><div><h3>${s.name}</h3><p>${s.description}</p></div><span class="stream-arrow">↗</span></button>`).join("");
 document.querySelectorAll("[data-stream]").forEach(b=>b.onclick=()=>{sf.value=b.dataset.stream;renderSubjects();document.getElementById("subjects").scrollIntoView({behavior:"smooth"})});
}
function renderFilter(){
 sf.innerHTML='<option value="all">All streams</option>'+D.streams.map(s=>`<option value="${s.id}">${s.name}</option>`).join("");
 sf.onchange=renderSubjects;
}
function inStream(n,id){const s=D.streams.find(x=>x.id===id);return !!s&&s.subjects.includes(n)}
function renderSubjects(){
 const q=search.value.trim().toLowerCase(),f=sf.value;
 const names=[...new Set(D.streams.flatMap(s=>s.subjects))].filter(n=>(f==="all"||inStream(n,f))&&(!q||n.toLowerCase().includes(q)));
 empty.classList.toggle("hidden",names.length>0);
 sj.innerHTML=names.map(n=>`<article class="subject-card" data-subject="${n}">
 <div class="top"><h3>${n}</h3><span class="badge">${D.papers[n]?"Download":"Coming soon"}</span></div>
 <small>${D.papers[n]?"Verified GovDoc files":"Source not verified yet"}</small></article>`).join("");
 document.querySelectorAll("[data-subject]").forEach(c=>c.onclick=()=>showPicker(c.dataset.subject));
}
function showPicker(name){
 title.textContent=name;
 const mediums=D.papers[name]||{};
 panel.innerHTML=`<div class="direct-card">
 <div class="picker two">
  <label>Medium<select id="medium"><option value="">Choose medium</option>${Object.keys(mediums).map(m=>`<option value="${m}">${m[0].toUpperCase()+m.slice(1)}</option>`).join("")}</select></label>
  <label>Year<select id="year" disabled><option>Choose medium first</option></select></label>
 </div>
 <div id="downloadArea"></div><div id="status" class="status">Choose a medium.</div>
 </div>`;
 document.getElementById("medium").onchange=loadYears;
 document.getElementById("year").onchange=readyDownload;
 document.getElementById("download").scrollIntoView({behavior:"smooth"});
}
function loadYears(){
 const m=document.getElementById("medium").value, years=(D.papers[title.textContent]?.[m])||{};
 const y=document.getElementById("year"),area=document.getElementById("downloadArea"),status=document.getElementById("status");
 area.innerHTML="";
 if(!m){y.innerHTML="<option>Choose medium first</option>";y.disabled=true;return}
 const list=Object.keys(years).map(Number).sort((a,b)=>b-a);
 if(!list.length){y.innerHTML="<option>No papers available</option>";y.disabled=true;status.className="status error";status.textContent="No verified GovDoc papers are mapped for this medium.";return}
 y.innerHTML='<option value="">Choose year</option>'+list.map(v=>`<option value="${v}">${v}</option>`).join("");
 y.disabled=false;status.className="status";status.textContent=`${list.length} verified year(s) available.`;
}
function readyDownload(){
 const m=document.getElementById("medium").value,y=Number(document.getElementById("year").value);
 const id=D.papers[title.textContent]?.[m]?.[y], area=document.getElementById("downloadArea");
 if(!id){area.innerHTML="";return}
 area.innerHTML=`<div class="download-box"><div><strong>${y} • ${m[0].toUpperCase()+m.slice(1)}</strong><small>PDF will be delivered through your website.</small></div>
 <a class="btn btn-primary" href="/api/download?subject=${encodeURIComponent(title.textContent)}&year=${y}&medium=${m}">Download PDF ↓</a></div>`;
}
search.oninput=renderSubjects;
document.querySelectorAll(".quick-tags button").forEach(b=>b.onclick=()=>{search.value=b.dataset.search;renderSubjects();document.getElementById("subjects").scrollIntoView({behavior:"smooth"})});
document.getElementById("back").onclick=()=>document.getElementById("subjects").scrollIntoView({behavior:"smooth"});
renderStreams();renderFilter();renderSubjects();
