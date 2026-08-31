const SUBJECTS={
"Combined Mathematics":"combined-mathematics","Physics":"physics","Chemistry":"chemistry","Biology":"biology",
"Accounting":"accounting","Business Studies":"business-studies","Economics":"economics","History":"history",
"Geography":"geography","Political Science":"political-science","Sinhala":"sinhala",
"Engineering Technology":"engineering-technology","Science for Technology":"science-for-technology",
"Information & Communication Technology":"information-and-communication-technology-ict"
};
const MEDIUMS={sinhala:"sinhala",english:"english",tamil:"tamil"};

function collectionPage(subject,medium){
  return `https://govdoc.lk/page/gce-advanced-level-exam-${SUBJECTS[subject]}-past-papers-${MEDIUMS[medium]}`;
}
async function fetchGovdoc(url){
  // Jina Reader retrieves the public HTML as readable text even when the
  // hosting provider refuses direct server-to-server HTML requests.
  const jina=`https://r.jina.ai/http://${url.replace(/^https?:\/\//,"")}`;
  const r=await fetch(jina,{headers:{"Accept":"text/plain","User-Agent":"AL-Past-Papers/1.0"}});
  if(!r.ok) throw new Error(`Source reader returned ${r.status}`);
  return r.text();
}
function extractYears(text){
  const out=new Set();
  for(const m of text.matchAll(/G\.C\.E\.\s*Advance Level Exam\s*((?:19|20)\d{2})/gi)) out.add(Number(m[1]));
  // Reader markdown can omit punctuation.
  for(const m of text.matchAll(/Advance Level Exam\s+((?:19|20)\d{2})/gi)) out.add(Number(m[1]));
  return [...out].sort((a,b)=>b-a);
}
function extractViewUrl(text,year){
  const lines=text.split(/\r?\n/);
  for(let i=0;i<lines.length;i++){
    if(new RegExp(`(?:^|\\D)${year}(?:\\D|$)`).test(lines[i])){
      const windowText=lines.slice(i,Math.min(lines.length,i+8)).join("\n");
      const m=windowText.match(/\((https?:\/\/govdoc\.lk\/view\?fid=[^) ]+)/i);
      if(m)return m[1];
      const m2=windowText.match(/https?:\/\/govdoc\.lk\/view\?fid=[^\s)]+/i);
      if(m2)return m2[0];
    }
  }
  const all=[...text.matchAll(/https?:\/\/govdoc\.lk\/view\?fid=[^\s)]+/gi)].map(x=>x[0]);
  return all[0]||null;
}
export async function getYears(subject,medium){
  const text=await fetchGovdoc(collectionPage(subject,medium));
  return {years:extractYears(text),text};
}
export async function resolveView(subject,year,medium){
  const {years,text}=await getYears(subject,medium);
  if(!years.includes(Number(year))) throw new Error(`GovDoc does not list ${year} for this medium.`);
  const view=extractViewUrl(text,Number(year));
  if(!view) throw new Error("Could not locate GovDoc's download page.");
  return view;
}
export {SUBJECTS,MEDIUMS,collectionPage,fetchGovdoc};
