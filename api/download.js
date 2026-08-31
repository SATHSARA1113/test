import {resolvePaper,getPage} from "./common.js";

async function getGovdocDownloadUrl(viewUrl){
  // A GovDoc view page points to /download/<file-token>.
  const html=await getPage(viewUrl);
  const m=html.match(/href\s*=\s*["']([^"']*\/download\/[a-z0-9]+)["']/i);
  if(!m) throw new Error("GovDoc download link not found.");
  return new URL(m[1],viewUrl).toString();
}

async function getNumericFileId(downloadPage){
  const html=await getPage(downloadPage);
  const m=html.match(/\/downloadFile\/(\d+)/i);
  if(!m) throw new Error("GovDoc file endpoint not found.");
  return m[1];
}

export default async function handler(req,res){
  try{
    const {subject,year,medium}=req.query||{};
    const view=await resolvePaper(subject,String(year),String(medium));
    const downloadPage=await getGovdocDownloadUrl(view);
    const id=await getNumericFileId(downloadPage);

    // GovDoc currently sends this endpoint to the stored PDF. Fetch it here
    // and stream the bytes through your own Vercel response.
    const pdf=await fetch(`https://govdoc.lk/downloadFile/${id}`,{
      redirect:"follow",
      headers:{
        "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151 Safari/537.36",
        "Accept":"application/pdf,*/*"
      }
    });
    if(!pdf.ok) throw new Error(`PDF server returned ${pdf.status}`);
    const buf=Buffer.from(await pdf.arrayBuffer());

    res.statusCode=200;
    res.setHeader("Content-Type",pdf.headers.get("content-type")||"application/pdf");
    res.setHeader("Content-Disposition",`attachment; filename="${year}-${String(subject).toLowerCase().replace(/[^a-z0-9]+/g,"-")}-${medium}.pdf"`);
    res.setHeader("Cache-Control","private, max-age=300");
    return res.send(buf);
  }catch(e){
    console.error(e);
    return res.status(404).send(`Paper unavailable: ${e.message}`);
  }
}
