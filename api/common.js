const SUBJECTS={
"Combined Mathematics":"combined-mathematics","Physics":"physics","Chemistry":"chemistry","Biology":"biology",
"Accounting":"accounting","Business Studies":"business-studies","Economics":"economics","History":"history",
"Geography":"geography","Political Science":"political-science","Sinhala":"sinhala",
"Engineering Technology":"engineering-technology","Science for Technology":"science-for-technology",
"Information & Communication Technology":"information-and-communication-technology-ict"
};
const MEDIUMS={sinhala:"sinhala",english:"english",tamil:"tamil"};

function subjectPage(slug,medium){
  return `https://govdoc.lk/page/gce-advanced-level-exam-${slug}-past-papers-${MEDIUMS[medium]}`;
}
async function getPage(url){
  const r=await fetch(url,{headers:{
    "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151 Safari/537.36",
    "Accept":"text/html,application/xhtml+xml",
    "Accept-Language":"en-US,en;q=0.9"
  }});
  if(!r.ok) throw new Error(`GovDoc returned ${r.status}`);
  return r.text();
}
function abs(base,u){try{return new URL(u,base).toString()}catch{return null}}

function findYearDownloads(html,base){
  const out=[];
  // Real GovDoc pages place each year heading before its Download/view link.
  // We associate the next view?fid link with the nearest year heading.
  const yearRe=/<(?:h[1-6]|div|p|strong|b)[^>]*>[\s\S]*?((?:19|20)\d{2})[\s\S]*?<\/(?:h[1-6]|div|p|strong|b)>/gi;
  const yearMatches=[];
  let y;
  while((y=yearRe.exec(html))) yearMatches.push({year:Number(y[1]),pos:y.index});
  const viewRe=/href\s*=\s*["']([^"']*\/view\?fid=[^"']+)["']/gi;
  let v;
  const views=[];
  while((v=viewRe.exec(html))) views.push({url:abs(base,v[1]),pos:v.index});
  for(const view of views){
    const before=yearMatches.filter(x=>x.pos<view.pos);
    if(!before.length) continue;
    const nearest=before[before.length-1];
    // Don't let a link from a previous year travel too far.
    if(view.pos-nearest.pos<7000) out.push({year:nearest.year,url:view.url});
  }
  const map=new Map();
  for(const x of out) map.set(x.year,x.url);
  return [...map.entries()].map(([year,url])=>({year,url})).sort((a,b)=>b.year-a.year);
}

export async function getYearList(subject,medium){
  const slug=SUBJECTS[subject];
  if(!slug||!MEDIUMS[medium]) throw new Error("Invalid subject or medium.");
  const url=subjectPage(slug,medium);
  const html=await getPage(url);
  const years=findYearDownloads(html,url);
  // More tolerant fallback: inspect raw text blocks surrounding the year and
  // capture a following view?fid href.
  if(!years.length){
    const fallback=[];
    const yearOnly=/(?:19|20)\d{2}/g;
    let m;
    while((m=yearOnly.exec(html))){
      const tail=html.slice(m.index,Math.min(html.length,m.index+5000));
      const vm=tail.match(/href\s*=\s*["']([^"']*\/view\?fid=[^"']+)["']/i);
      if(vm) fallback.push({year:Number(m[0]),url:abs(url,vm[1])});
    }
    const map=new Map();
    for(const x of fallback) map.set(x.year,x.url);
    return [...map.entries()].map(([year,u])=>({year,url:u})).sort((a,b)=>b.year-a.year);
  }
  return years;
}

export async function resolvePaper(subject,year,medium){
  const years=await getYearList(subject,medium);
  const hit=years.find(x=>String(x.year)===String(year));
  if(!hit) throw new Error(`GovDoc does not list ${year} for ${subject} in ${medium} medium.`);
  return hit.url;
}
export {SUBJECTS,MEDIUMS,subjectPage};
