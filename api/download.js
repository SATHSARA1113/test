const SUBJECTS = {
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

function normalize(s){
  return String(s).toLowerCase().replace(/&/g,"and").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}
function abs(base,u){try{return new URL(u,base).toString()}catch{return null}}
async function fetchText(url){
  const r=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0 AL-Past-Papers/1.0"}});
  if(!r.ok) throw new Error(`GovDoc returned ${r.status}`);
  return r.text();
}
function findLinks(html, base){
  return [...html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)]
    .map(m=>abs(base,m[1])).filter(Boolean);
}

async function findYearPage(subjectSlug, year){
  const url=`https://govdoc.lk/category/past-papers/physics/gce-advance-level-exam`;
  // Search the subject's actual category page instead of assuming a single
  // year-page slug format for every subject.
  const category=`https://govdoc.lk/category/past-papers/${subjectSlug}/gce-advance-level-exam`;
  try{
    const html=await fetchText(category);
    const links=findLinks(html,category);
    const wanted=`${year} G.C.E. Advance Level Exam`;
    const candidate=links.find(u=>u.toLowerCase().includes(`/gce-advance-level-exam-${year}-${subjectSlug}-past-papers`));
    if(candidate) return candidate;
    const yearCandidate=links.find(u=>u.includes(`-${year}-`) && /past-papers/i.test(u));
    if(yearCandidate) return yearCandidate;
  }catch(e){}
  return `https://govdoc.lk/gce-advance-level-exam-${year}-${subjectSlug}-past-papers`;
}

function mediumMatches(text, medium){
  const t=text.toLowerCase();
  if(medium==="sinhala") return /sinhala|සිංහල/.test(t);
  if(medium==="english") return /english/.test(t);
  if(medium==="tamil") return /tamil|தமிழ/.test(t);
  return false;
}

async function findViewPage(yearPage, year, medium){
  const html=await fetchText(yearPage);
  const links=[...html.matchAll(/<a[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map(m=>({url:abs(yearPage,m[1]),text:m[2].replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim()}))
    .filter(x=>x.url);

  let candidates=links.filter(x=>mediumMatches(x.text,medium));
  // If the page uses only "Sinhala" as the visible label, use the first
  // /view?fid= link. We never fabricate the fid.
  if(!candidates.length) candidates=links.filter(x=>/\/view\?fid=/i.test(x.url));

  const view=candidates.find(x=>/\/view\?fid=/i.test(x.url));
  if(view) return view.url;
  throw new Error(`No ${medium} download is listed for ${year}.`);
}

async function findFileId(viewPage){
  const html=await fetchText(viewPage);
  // GovDoc's view page has a Download link such as /download/69e9f427...
  const link=[...html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)]
    .map(m=>abs(viewPage,m[1])).find(u=>/\/download\/[a-z0-9]+$/i.test(u));
  if(!link) throw new Error("GovDoc download page was not found.");
  const downloadHtml=await fetchText(link);
  const m=downloadHtml.match(/\/downloadFile\/(\d+)/i);
  if(!m) throw new Error("GovDoc file ID was not found.");
  return m[1];
}

export default async function handler(req,res){
  try{
    const {subject,year,medium}=req.query||{};
    const slug=SUBJECTS[subject];
    if(!slug) return res.status(400).send("Unknown subject.");
    if(!/^(19|20)\d{2}$/.test(String(year))) return res.status(400).send("Invalid year.");
    if(!/^(sinhala|english|tamil)$/.test(String(medium))) return res.status(400).send("Invalid medium.");

    const yearPage=await findYearPage(slug,String(year));
    const viewPage=await findViewPage(yearPage,String(year),String(medium));
    const fileId=await findFileId(viewPage);

    const pdf=await fetch(`https://govdoc.lk/downloadFile/${fileId}`,{
      headers:{"User-Agent":"Mozilla/5.0 AL-Past-Papers/1.0"}
    });
    if(!pdf.ok) throw new Error("GovDoc PDF fetch failed.");

    const buf=Buffer.from(await pdf.arrayBuffer());
    res.statusCode=200;
    res.setHeader("Content-Type",pdf.headers.get("content-type")||"application/pdf");
    res.setHeader("Content-Disposition",`attachment; filename="${year}-${normalize(subject)}-${medium}.pdf"`);
    res.setHeader("Cache-Control","private, max-age=600");
    return res.send(buf);
  }catch(e){
    console.error(e);
    return res.status(404).send(`Paper unavailable: ${e.message}`);
  }
}
