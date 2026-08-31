import {resolveView,getYears} from "./common.js";

async function readerText(url){
  const r=await fetch(`https://r.jina.ai/http://${url.replace(/^https?:\/\//,"")}`,{
    headers:{"Accept":"text/plain","User-Agent":"AL-Past-Papers/1.0"}
  });
  if(!r.ok) throw new Error(`Reader returned ${r.status}`);
  return r.text();
}
function firstDownloadLink(text){
  const m=text.match(/https?:\/\/govdoc\.lk\/download\/[a-z0-9]+/i);
  return m?m[0]:null;
}
async function getFileId(viewUrl){
  const viewText=await readerText(viewUrl);
  const download=firstDownloadLink(viewText);
  if(!download)throw new Error("GovDoc download link was not found.");
  const dlText=await readerText(download);
  // Jina output preserves the /downloadFile/<number> link.
  const m=dlText.match(/https?:\/\/govdoc\.lk\/downloadFile\/(\d+)/i);
  if(!m){
    // Sometimes only the path is preserved.
    const m2=dlText.match(/\/downloadFile\/(\d+)/i);
    if(!m2)throw new Error("GovDoc PDF endpoint was not found.");
    return m2[1];
  }
  return m[1];
}
export default async function handler(req,res){
  try{
    const {subject,year,medium}=req.query||{};
    const view=await resolveView(subject,String(year),String(medium));
    const id=await getFileId(view);
    const pdf=await fetch(`https://govdoc.lk/downloadFile/${id}`,{
      redirect:"follow",
      headers:{
        "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/151 Safari/537.36",
        "Accept":"application/pdf,*/*"
      }
    });
    if(!pdf.ok)throw new Error(`GovDoc PDF returned ${pdf.status}`);
    const buf=Buffer.from(await pdf.arrayBuffer());
    res.statusCode=200;
    res.setHeader("Content-Type",pdf.headers.get("content-type")||"application/pdf");
    res.setHeader("Content-Disposition",`attachment; filename="${year}-${String(subject).toLowerCase().replace(/[^a-z0-9]+/g,"-")}-${medium}.pdf"`);
    res.setHeader("Cache-Control","private, max-age=300");
    return res.send(buf);
  }catch(e){
    console.error(e);return res.status(404).send(`Paper unavailable: ${e.message}`);
  }
}
