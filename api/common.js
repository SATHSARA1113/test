const SUBJECTS={
  "Combined Mathematics":"combined-mathematics",
  "Physics":"physics",
  "Chemistry":"chemistry",
  "Biology":"biology",
  "Accounting":"accounting",
  "Business Studies":"business-studies",
  "Economics":"economics",
  "History":"history",
  "Geography":"geography",
  "Political Science":"political-science",
  "Sinhala":"sinhala",
  "Engineering Technology":"engineering-technology",
  "Science for Technology":"science-for-technology",
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

function cleanHtml(s){
  return String(s)
    .replace(/<!--[\s\S]*?-->/g,' ')
    .replace(/<script[\s\S]*?<\/script>/gi,' ')
    .replace(/<style[\s\S]*?<\/style>/gi,' ');
}

function findYearDownloads(html,base){
  const source=cleanHtml(html);
  const rows=[];

  // GovDoc's subject pages contain a year heading followed by a "Download"
  // link to /view?fid=...&id=<numeric file id>. We keep the nearest year
  // preceding each view link, which is much more reliable than matching large
  // div blocks.
  const tokenRe=/(<(?:h[1-6]|hgroup|strong|b|p|div|li)[^>]*>[^<]{0,200}?(?:19|20)\d{2}[^<]{0,200}<\/(?:h[1-6]|hgroup|strong|b|p|div|li)>|href\s*=\s*["']([^"']*\/view\?[^"']*\bid=\d+[^"']*)["'])/gi;
  let m;
  let currentYear=null;
  while((m=tokenRe.exec(source))){
    const token=m[0];
    const ym=token.match(/\b((?:19|20)\d{2})\b/);
    if(ym && !m[1]){
      currentYear=Number(ym[1]);
      continue;
    }
    if(m[1] && currentYear){
      const idm=m[1].match(/[?&]id=(\d+)/i);
      if(idm) rows.push({year:currentYear,id:Number(idm[1]),viewUrl:abs(base,m[1])});
    }
  }

  // Fallback for minified/changed markup: use all year and view positions and
  // associate each file with the nearest earlier year.
  if(!rows.length){
    const years=[];
    const yearRe=/(?:19|20)\d{2}/g;
    let y;
    while((y=yearRe.exec(source))) years.push({year:Number(y[0]),pos:y.index});
    const views=[];
    const viewRe=/href\s*=\s*["']([^"']*\/view\?[^"']*\bid=\d+[^"']*)["']/gi;
    let v;
    while((v=viewRe.exec(source))){
      const idm=v[1].match(/[?&]id=(\d+)/i);
      if(idm) views.push({id:Number(idm[1]),url:abs(base,v[1]),pos:v.index});
    }
    for(const view of views){
      const before=years.filter(x=>x.pos<view.pos);
      if(!before.length) continue;
      const nearest=before[before.length-1];
      if(view.pos-nearest.pos<10000) rows.push({year:nearest.year,id:view.id,viewUrl:view.url});
    }
  }

  const map=new Map();
  for(const x of rows) map.set(x.year,x);
  return [...map.values()].sort((a,b)=>b.year-a.year);
}

export async function getYearList(subject,medium){
  const slug=SUBJECTS[subject];
  if(!slug||!MEDIUMS[medium]) throw new Error("Invalid subject or medium.");
  const url=subjectPage(slug,medium);
  const html=await getPage(url);
  return findYearDownloads(html,url);
}

export async function resolvePaper(subject,year,medium){
  const years=await getYearList(subject,medium);
  const hit=years.find(x=>String(x.year)===String(year));
  if(!hit) throw new Error(`GovDoc does not list ${year} for ${subject} in ${medium} medium.`);
  return hit;
}

export {SUBJECTS,MEDIUMS,subjectPage};
