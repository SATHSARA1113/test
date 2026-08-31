const SUBJECTS={
"Combined Mathematics":"combined-mathematics","Physics":"physics","Chemistry":"chemistry","Biology":"biology",
"Accounting":"accounting","Business Studies":"business-studies","Economics":"economics","History":"history",
"Geography":"geography","Political Science":"political-science","Sinhala":"sinhala",
"Engineering Technology":"engineering-technology","Science for Technology":"science-for-technology",
"Information & Communication Technology":"information-and-communication-technology-ict"
};
const MEDIUMS={sinhala:"sinhala",english:"english",tamil:"tamil"};

function mediumPage(subject,medium){
  return `https://govdoc.lk/page/gce-advanced-level-exam-${SUBJECTS[subject]}-past-papers-${MEDIUMS[medium]}`;
}
async function reader(url){
  const target=url.replace(/^https?:\/\//,"");
  const r=await fetch(`https://r.jina.ai/http://${target}`,{
    headers:{
      "Accept":"text/plain",
      "User-Agent":"Mozilla/5.0 AL-Past-Papers"
    }
  });
  if(!r.ok) throw new Error(`Source reader returned ${r.status}`);
  return r.text();
}

function cleanUrl(u){
  return u.replace(/[)>.,]+$/,"");
}

/*
 Jina Reader normally turns GovDoc links into Markdown like:
 G.C.E. Advance Level Exam 2024
 [Download](https://govdoc.lk/view?fid=...&id=...)
 We pair each year heading with the first nearby view?fid link.
*/
function extractYearViews(text){
  const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const out=[];
  for(let i=0;i<lines.length;i++){
    const ym=lines[i].match(/G\.?C\.?E\.?\s*Advance Level Exam\s*((?:19|20)\d{2})/i)
          || lines[i].match(/Advance Level Exam\s*((?:19|20)\d{2})/i);
    if(!ym) continue;
    const year=Number(ym[1]);
    for(let j=i;j<Math.min(lines.length,i+12);j++){
      const vm=lines[j].match(/\]\((https?:\/\/govdoc\.lk\/view\?fid=[^) ]+)/i)
             || lines[j].match(/(https?:\/\/govdoc\.lk\/view\?fid=[^)\s]+)/i);
      if(vm){
        out.push({year,url:cleanUrl(vm[1])});
        break;
      }
      if(j>i && /Advance Level Exam\s*(?:19|20)\d{2}/i.test(lines[j])) break;
    }
  }
  const map=new Map();
  for(const x of out) if(!map.has(x.year)) map.set(x.year,x.url);
  return [...map.entries()].map(([year,url])=>({year,url})).sort((a,b)=>b.year-a.year);
}

export async function getYearList(subject,medium){
  if(!SUBJECTS[subject]||!MEDIUMS[medium]) throw new Error("Invalid subject or medium.");
  const page=mediumPage(subject,medium);
  const text=await reader(page);
  const years=extractYearViews(text);
  if(!years.length){
    // Last-resort parser: find year and any view URL within a larger text window.
    const found=new Map();
    for(const m of text.matchAll(/(?:Advance Level Exam|Exam)\s*((?:19|20)\d{2})/gi)){
      const year=Number(m[1]);
      const window=text.slice(m.index,m.index+3000);
      const v=window.match(/https?:\/\/govdoc\.lk\/view\?fid=[^)\s]+/i);
      if(v&&!found.has(year)) found.set(year,cleanUrl(v[0]));
    }
    return [...found.entries()].map(([year,url])=>({year,url})).sort((a,b)=>b.year-a.year);
  }
  return years;
}
export async function resolveView(subject,year,medium){
  const items=await getYearList(subject,medium);
  const hit=items.find(x=>String(x.year)===String(year));
  if(!hit) throw new Error(`GovDoc does not list ${year} for ${subject} in ${medium} medium.`);
  return hit.url;
}
export {SUBJECTS,MEDIUMS,mediumPage};
