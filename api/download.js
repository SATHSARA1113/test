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

const MEDIUMS = {
  sinhala:"sinhala",
  english:"english",
  tamil:"tamil"
};

function esc(s){return String(s).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");}

async function getText(url){
  const r=await fetch(url,{headers:{"User-Agent":"AL-Past-Papers-Download/1.0"}});
  if(!r.ok) throw new Error(`Source returned ${r.status}`);
  return r.text();
}

// On govdoc, medium-specific pages contain a list of years, each followed by "Download".
// We find the selected year and the nearby view-link.
async function findViewUrl(subjectSlug, year, medium){
  const page=`https://govdoc.lk/page/gce-advanced-level-exam-${subjectSlug}-past-papers-${MEDIUMS[medium]}`;
  const html=await getText(page);
  const marker=`G.C.E. Advance Level Exam ${year}`;
  const p=html.toLowerCase().indexOf(marker.toLowerCase());
  if(p<0) throw new Error("This year is not listed for that medium.");

  const windowText=html.slice(Math.max(0,p-300),Math.min(html.length,p+1800));
  const matches=[...windowText.matchAll(/href=["']([^"']+)["']/gi)].map(m=>m[1]);
  const view=matches.find(h=>/\/view\?fid=/i.test(h));
  if(!view) throw new Error("The selected paper is not available.");
  return new URL(view,"https://govdoc.lk").toString();
}

async function findDownloadFileId(viewUrl){
  const html=await getText(viewUrl);
  const m=html.match(/href=["'](?:https?:\/\/govdoc\.lk)?\/download\/([a-f0-9]+)["']/i);
  if(!m) throw new Error("Could not find the download link.");
  const downloadPage=await getText(`https://govdoc.lk/download/${m[1]}`);
  const id=downloadPage.match(/\/downloadFile\/(\d+)/i);
  if(!id) throw new Error("Could not find the PDF file.");
  return id[1];
}

export default async function handler(req,res){
  try{
    const {subject,year,medium,part}=req.query||{};
    if(!SUBJECTS[subject]) return res.status(400).send("Unknown subject.");
    if(!/^(19|20)\d{2}$/.test(String(year))) return res.status(400).send("Invalid year.");
    if(!MEDIUMS[medium]) return res.status(400).send("Invalid medium.");
    if(!/^(1|2|both)$/.test(String(part))) return res.status(400).send("Invalid paper.");

    // Govdoc's linked document can represent the full paper set. For "both",
    // deliver the single source file. For individual parts, the same source is used
    // when the site publishes the paper as one PDF.
    const viewUrl=await findViewUrl(SUBJECTS[subject],String(year),String(medium));
    const fileId=await findDownloadFileId(viewUrl);
    const pdf=await fetch(`https://govdoc.lk/downloadFile/${fileId}`,{headers:{"User-Agent":"AL-Past-Papers-Download/1.0"}});
    if(!pdf.ok) throw new Error("PDF fetch failed.");
    const buf=Buffer.from(await pdf.arrayBuffer());
    res.statusCode=200;
    res.setHeader("Content-Type",pdf.headers.get("content-type")||"application/pdf");
    res.setHeader("Content-Disposition",`attachment; filename="${year}-${subject.replace(/[^a-z0-9]+/gi,"-").toLowerCase()}-${medium}.pdf"`);
    res.setHeader("Cache-Control","public, max-age=3600");
    return res.send(buf);
  }catch(e){
    console.error(e);
    return res.status(404).send(`Paper unavailable: ${e.message}`);
  }
}
